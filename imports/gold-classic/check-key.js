const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Find process by processId (VarChar)
  const process = await p.ownershipTransferProcess.findFirst({
    where: { processId: 'OTP-MTU0DO5C-6B85' },
  });
  if (!process) { console.log('Process not found'); return; }
  console.log('Process UUID id:', process.id);
  console.log('Process processId:', process.processId);
  
  // Find key by process UUID id
  const key = await p.ownershipKey.findFirst({
    where: { processId: process.id },
  });
  if (!key) { console.log('Key not found'); return; }
  console.log('Key id:', key.id);
  console.log('Key prefix:', key.keyPrefix);
  console.log('Key hash:', key.keyHash);
  console.log('Status:', key.status);
  
  await p.$disconnect();
})().catch(e => { console.error(e); p.$disconnect(); });
