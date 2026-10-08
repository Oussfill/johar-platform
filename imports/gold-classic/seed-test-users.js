const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  const testUsers = [
    { email: 'custody@gold-platform.com', firstName: 'Custody', lastName: 'Manager', roleCode: 'CUSTODY_MANAGER' },
    { email: 'lab@gold-platform.com', firstName: 'Lab', lastName: 'Director', roleCode: 'LAB_DIRECTOR' },
    { email: 'auditor@gold-platform.com', firstName: 'Internal', lastName: 'Auditor', roleCode: 'AUDITOR' },
    { email: 'tech@gold-platform.com', firstName: 'Lab', lastName: 'Technician', roleCode: 'LAB_TECHNICIAN' },
    { email: 'seller@gold-platform.com', firstName: 'Market', lastName: 'Seller', roleCode: 'MARKETPLACE_SELLER' },
  ];
  
  const password = await bcrypt.hash('GOLD@Admin2024!', 12);
  
  for (const tu of testUsers) {
    const existing = await p.user.findUnique({ where: { email: tu.email } });
    if (!existing) {
      const role = await p.role.findUnique({ where: { roleCode: tu.roleCode } });
      if (role) {
        await p.user.create({
          data: {
            email: tu.email,
            passwordHash: password,
            firstName: tu.firstName,
            lastName: tu.lastName,
            roleId: role.id,
            preferredLanguage: 'EN',
            preferredCurrency: 'USD',
            isEmailVerified: true,
          },
        });
        console.log('Created:', tu.email, '(' + tu.roleCode + ')');
      }
    } else {
      console.log('Exists:', tu.email);
    }
  }
  
  console.log('\nAll test accounts ready. Password: GOLD@Admin2024!');
  await p.$disconnect();
})();
