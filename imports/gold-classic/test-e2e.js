const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

// Replicate the key generation from OwnershipKeyService
function generateTestKey() {
  const keyBytes = crypto.randomBytes(32);
  const key = keyBytes.toString('base64');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 12);
  return { key, keyHash, keyPrefix };
}

(async () => {
  // 1. Create a test process
  const asset = await p.goldAsset.findFirst();
  const customer = await p.user.findFirst({ where: { email: 'admin@gold-platform.com' } });
  
  if (!asset || !customer) { console.log('Missing asset or customer'); return; }
  
  const processId = 'OTP-TEST-' + Date.now().toString(36).toUpperCase();
  const process = await p.ownershipTransferProcess.create({
    data: {
      processId,
      assetId: asset.id,
      customerId: customer.id,
      salePrice: 50000,
      saleCurrency: 'USD',
      currentStep: 'KEY_ISSUANCE',
      status: 'KEY_ISSUED',
      step1CompletedAt: new Date(),
      step2CompletedAt: new Date(),
    },
  });
  console.log('Process created:', process.processId);
  
  // 2. Generate a key and store its hash
  const testKey = generateTestKey();
  console.log('\n=== GENERATED KEY (give to customer) ===');
  console.log('KEY:', testKey.key);
  console.log('PREFIX:', testKey.keyPrefix);
  console.log('HASH:', testKey.keyHash);
  console.log('==========================================\n');
  
  // Store key with hash
  const iv = crypto.randomBytes(16).toString('hex');
  const authTag = crypto.randomBytes(16).toString('hex');
  const encryptedPayload = crypto.createHash('sha256').update(testKey.key).digest('hex');
  
  await p.ownershipKey.create({
    data: {
      processId: process.id,
      keyHash: testKey.keyHash,
      keyPrefix: testKey.keyPrefix,
      keyAlgorithm: 'AES-256-GCM',
      encryptedPayload,
      iv,
      authTag,
      status: 'ISSUED_TO_OWNER',
      ownerId: customer.id,
      generatedAt: new Date(),
      issuedAt: new Date(),
    },
  });
  console.log('Key stored in DB');
  
  // 3. Verify the key
  const providedHash = crypto.createHash('sha256').update(testKey.key).digest('hex');
  const storedKey = await p.ownershipKey.findFirst({
    where: { processId: process.id },
  });
  
  const isValid = providedHash === storedKey.keyHash;
  console.log('\n=== KEY VERIFICATION ===');
  console.log('Provided hash:', providedHash);
  console.log('Stored hash:   ', storedKey.keyHash);
  console.log('Match:', isValid);
  console.log('========================\n');
  
  // 4. Try with wrong key
  const wrongHash = crypto.createHash('sha256').update('wrong-key').digest('hex');
  const isWrongValid = wrongHash === storedKey.keyHash;
  console.log('Wrong key valid:', isWrongValid, '(should be false)');
  
  await p.$disconnect();
})().catch(e => { console.error(e); p.$disconnect(); });
