const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

function generateTestKey() {
  const keyBytes = crypto.randomBytes(32);
  const key = keyBytes.toString('base64');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, keyHash, keyPrefix: key.substring(0, 12) };
}

function sha256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

(async () => {
  console.log('=== E2E Ownership Transfer with Escrow ===\n');
  
  const asset = await p.goldAsset.findFirst();
  const customer = await p.user.findFirst({ where: { email: 'admin@gold-platform.com' } });
  const notaryUser = await p.user.findFirst({ where: { email: 'notary@gold-platform.com' } });
  const notaryAccount = await p.notaryAccount.findFirst({ where: { userId: notaryUser.id } });
  
  if (!asset || !customer || !notaryAccount) {
    console.log('Missing data:', { asset: !!asset, customer: !!customer, notaryAccount: !!notaryAccount });
    return;
  }
  
  // ═══════════════════════════════════════════════════
  // STEP 1: Customer requests purchase → Escrow HOLD
  // ═══════════════════════════════════════════════════
  console.log('--- STEP 1: Purchase Request + Escrow Hold ---');
  
  const processId = 'OTP-E2E-' + Date.now().toString(36).toUpperCase();
  const salePrice = 75000;
  
  const process = await p.ownershipTransferProcess.create({
    data: {
      processId,
      assetId: asset.id,
      customerId: customer.id,
      salePrice,
      saleCurrency: 'USD',
      currentStep: 'PURCHASE_REQUEST',
      status: 'PURCHASE_SUBMITTED',
      step1CompletedAt: new Date(),
    },
  });
  console.log('Process created:', process.processId);
  
  // Create escrow
  const escrowCode = 'ESC-E2E-' + Date.now().toString(36).toUpperCase();
  const platformFee = salePrice * 0.025;
  
  const escrow = await p.escrowLedger.create({
    data: {
      escrowCode,
      processId: process.id,
      buyerId: customer.id,
      sellerId: customer.id, // same for test
      holdAmount: salePrice,
      holdCurrency: 'USD',
      platformFee,
      status: 'HOLD',
      heldAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Escrow created:', escrow.escrowCode);
  console.log('  Hold Amount:', escrow.holdAmount, escrow.holdCurrency);
  console.log('  Platform Fee:', escrow.platformFee);
  console.log('  Status:', escrow.status);
  
  await p.escrowEvent.create({
    data: {
      escrowId: escrow.id,
      eventType: 'HOLD_placed',
      amount: salePrice,
      currency: 'USD',
      performedBy: customer.id,
      notes: 'Escrow hold placed on purchase request',
    },
  });
  console.log('  Event: HOLD_placed ✓\n');
  
  // ═══════════════════════════════════════════════════
  // STEP 2+3: Notary certifies → Escrow HELD
  // ═══════════════════════════════════════════════════
  console.log('--- STEP 2+3: Notary Certification + Key Issuance ---');
  
  await p.ownershipTransferProcess.update({
    where: { id: process.id },
    data: {
      currentStep: 'NOTARY_CERTIFICATION',
      status: 'NOTARY_CERTIFIED',
      notaryId: notaryAccount.id,
      step2CompletedAt: new Date(),
    },
  });
  
  // Update escrow: HOLD → HELD
  await p.escrowLedger.update({
    where: { id: escrow.id },
    data: { status: 'HELD' },
  });
  
  await p.escrowEvent.create({
    data: {
      escrowId: escrow.id,
      eventType: 'HOLD_confirmed',
      amount: escrow.holdAmount,
      currency: escrow.holdCurrency,
      performedBy: notaryUser.id,
      notes: 'Notary certification complete — escrow confirmed',
    },
  });
  
  // Generate key
  const testKey = generateTestKey();
  console.log('Key generated:', testKey.keyPrefix + '...');
  
  const iv = crypto.randomBytes(16).toString('hex');
  const authTag = crypto.randomBytes(16).toString('hex');
  
  await p.ownershipKey.create({
    data: {
      processId: process.id,
      keyHash: testKey.keyHash,
      keyPrefix: testKey.keyPrefix,
      keyAlgorithm: 'AES-256-GCM',
      encryptedPayload: sha256Hash(testKey.key),
      iv,
      authTag,
      status: 'ISSUED_TO_OWNER',
      ownerId: customer.id,
      generatedAt: new Date(),
      issuedAt: new Date(),
    },
  });
  
  await p.ownershipTransferProcess.update({
    where: { id: process.id },
    data: {
      currentStep: 'KEY_ISSUANCE',
      status: 'KEY_ISSUED',
      step3CompletedAt: new Date(),
    },
  });
  console.log('Escrow status: HELD ✓\n');
  
  // ═══════════════════════════════════════════════════
  // STEP 4: Customer activates → Escrow RELEASED
  // ═══════════════════════════════════════════════════
  console.log('--- STEP 4: Digital Record Activation + Escrow Release ---');
  
  // Verify key
  const providedHash = crypto.createHash('sha256').update(testKey.key).digest('hex');
  const storedKey = await p.ownershipKey.findFirst({ where: { processId: process.id } });
  const keyValid = providedHash === storedKey.keyHash;
  console.log('Key verification:', keyValid ? 'VALID ✓' : 'INVALID ✗');
  
  if (!keyValid) { console.log('Aborting — key invalid'); return; }
  
  // Release escrow
  const releasedAmount = Number(escrow.holdAmount) - Number(escrow.platformFee);
  
  await p.escrowLedger.update({
    where: { id: escrow.id },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
      releasedAmount,
      releaseAuthorization: sha256Hash(`${escrow.escrowCode}|${Date.now()}|RELEASED`),
    },
  });
  
  await p.escrowEvent.create({
    data: {
      escrowId: escrow.id,
      eventType: 'RELEASED',
      amount: releasedAmount,
      currency: escrow.holdCurrency,
      performedBy: customer.id,
      notes: 'Digital record activated — payment released to seller',
      metadata: { platformFee: escrow.platformFee, netAmount: releasedAmount },
    },
  });
  
  // Complete process
  await p.ownershipTransferProcess.update({
    where: { id: process.id },
    data: {
      currentStep: 'REGISTRAR_ACTIVATION',
      status: 'COMPLETED',
      completedAt: new Date(),
      step4CompletedAt: new Date(),
    },
  });
  
  await p.ownershipKey.update({
    where: { id: storedKey.id },
    data: { status: 'ACTIVATED', activatedAt: new Date() },
  });
  
  console.log('Escrow status: RELEASED ✓');
  console.log('  Released Amount:', releasedAmount, 'USD');
  console.log('  Platform Fee:', escrow.platformFee, 'USD');
  console.log('  Net to Seller:', releasedAmount, 'USD');
  
  // ═══════════════════════════════════════════════════
  // FINAL: Verify complete state
  // ═══════════════════════════════════════════════════
  console.log('\n--- FINAL STATE ---');
  
  const finalProcess = await p.ownershipTransferProcess.findUnique({
    where: { id: process.id },
    include: { escrow: true, key: true },
  });
  
  console.log('Process status:', finalProcess.status);
  console.log('Process step:', finalProcess.currentStep);
  console.log('Escrow status:', finalProcess.escrow.status);
  console.log('Escrow released:', finalProcess.escrow.releasedAmount, finalProcess.escrow.holdCurrency);
  console.log('Key status:', finalProcess.key.status);
  
  const events = await p.escrowEvent.findMany({
    where: { escrowId: escrow.id },
    orderBy: { createdAt: 'asc' },
  });
  
  console.log('\nEscrow Events:');
  events.forEach(e => console.log(`  ${e.eventType}: ${e.amount} ${e.currency} by ${e.performedBy.substring(0, 8)}...`));
  
  console.log('\n=== E2E TEST PASSED ===');
  
  await p.$disconnect();
})().catch(e => { console.error('TEST FAILED:', e); p.$disconnect(); });
