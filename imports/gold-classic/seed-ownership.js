const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const u = await p.user.findFirst({ where: { email: 'admin@gold-platform.com' } });
  if (!u) { console.log('No user found'); return; }
  
  const existing = await p.notaryAccount.findFirst({ where: { userId: u.id } });
  if (existing) { console.log('Notary already exists:', existing.id); return; }
  
  const n = await p.notaryAccount.create({
    data: {
      notaryCode: 'NOT-ALG-001',
      userId: u.id,
      licenseNumber: 'ALG-NOTARY-2024-001',
      licenseExpiry: new Date('2027-12-31'),
      officialSealHash: '0xseal_' + Date.now(),
      jurisdiction: 'Algiers',
      jurisdictionAr: 'الجزائر',
    },
  });
  console.log('Notary created:', n.id);
  
  const r = await p.digitalRegistrar.create({
    data: {
      serviceCode: 'REG-SVC-001',
      verificationEngineStatus: 'OPERATIONAL',
      cryptographicProofVerifier: 'SHA256+ECDSA',
    },
  });
  console.log('Registrar created:', r.id);
  
  await p.$disconnect();
})().catch(e => { console.error(e.message); p.$disconnect(); });
