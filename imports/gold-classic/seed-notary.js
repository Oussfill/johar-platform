const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  const roles = await p.role.findMany();
  console.log('Available roles:', roles.map(r => r.roleCode).join(', '));
  
  const role = roles.find(r => r.roleCode === 'OPERATOR') || roles[0];
  console.log('Using role:', role.roleCode);
  
  const existing = await p.user.findFirst({ where: { email: 'notary@gold-platform.com' } });
  if (existing) { console.log('Notary user already exists:', existing.id); return; }
  
  const hash = await bcrypt.hash('Notary@2024!', 12);
  const user = await p.user.create({
    data: {
      email: 'notary@gold-platform.com',
      passwordHash: hash,
      firstName: 'Ahmed',
      lastName: 'Benali',
      roleId: role.id,
      preferredLanguage: 'AR',
      preferredCurrency: 'USD',
    },
  });
  console.log('Notary user created:', user.id);
  
  const notary = await p.notaryAccount.create({
    data: {
      notaryCode: 'NOT-ALG-002',
      userId: user.id,
      licenseNumber: 'ALG-NOTARY-2024-002',
      licenseExpiry: new Date('2027-12-31'),
      officialSealHash: '0xseal2_' + Date.now(),
      jurisdiction: 'Algiers',
      jurisdictionAr: 'الجزائر',
    },
  });
  console.log('Notary account created:', notary.id);
  
  await p.$disconnect();
})().catch(e => { console.error(e); p.$disconnect(); });
