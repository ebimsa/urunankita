import {
  PrismaClient,
  GroupType,
  MemberRole,
  MembershipStatus,
  BillStatus,
  CashFlowType,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menjalankan Prisma Seed eYuran...');

  // 1. Password default untuk akun demo
  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 2. Akun Pengurus / Admin Demo
  const adminUser = await prisma.user.upsert({
    where: { phone: '08111111111' },
    update: {},
    create: {
      fullName: 'Demo Admin (Pak RT)',
      phone: '08111111111',
      email: 'admin@eyuran.test',
      passwordHash,
    },
  });
  console.log(`👤 Admin dibuat/ditemukan: ${adminUser.fullName} (${adminUser.phone})`);

  // 3. Akun Anggota / Warga Demo
  const memberUser = await prisma.user.upsert({
    where: { phone: '08222222222' },
    update: {},
    create: {
      fullName: 'Budi Santoso',
      phone: '08222222222',
      email: 'budi@eyuran.test',
      passwordHash,
    },
  });
  console.log(`👤 Warga dibuat/ditemukan: ${memberUser.fullName} (${memberUser.phone})`);

  // 4. Komunitas Contoh: RT 04 / RW 08 Griya Asri (Mode PHYSICAL_UNIT)
  const group = await prisma.group.upsert({
    where: { joinCode: 'GRIYA04' },
    update: {},
    create: {
      name: 'RT 04 / RW 08 Griya Asri',
      description: 'Komunitas Warga RT 04 / RW 08 Perumahan Griya Asri - Pembukuan & Iuran Kas Terbuka',
      type: GroupType.PHYSICAL_UNIT,
      joinCode: 'GRIYA04',
    },
  });
  console.log(`🏘️ Grup dibuat/ditemukan: ${group.name} [Kode: ${group.joinCode}]`);

  // 5. Konfigurasi Pembayaran Pengurus
  await prisma.groupPaymentConfig.upsert({
    where: { groupId: group.id },
    update: {},
    create: {
      groupId: group.id,
      bankEnabled: true,
      bankName: 'BCA',
      accountNumber: '5270123456',
      accountHolder: 'Bendahara RT 04 Griya Asri',
      accountDetails: 'Rekening Bank BCA no 5270123456 a.n. Bendahara RT 04 Griya Asri',
      cashEnabled: true,
      instructions: 'Pembayaran tunai dapat diserahkan langsung ke Pak RT (Rumah Blok A-02) atau Bendahara.',
    },
  });

  // 6. Unit Hunian (Rumah / Blok Fisik)
  const unitNames = ['Blok A-01', 'Blok A-02', 'Blok B-01'];
  const units: Record<string, any> = {};

  for (const name of unitNames) {
    const unit = await prisma.groupUnit.upsert({
      where: {
        groupId_name: {
          groupId: group.id,
          name,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        name,
        description: `Hunian warga ${name}`,
      },
    });
    units[name] = unit;
  }
  console.log(`🏠 3 Unit hunian berhasil disiapkan: ${unitNames.join(', ')}`);

  // 7. Keanggotaan: Admin sebagai OWNER
  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: adminUser.id,
      },
    },
    update: {
      role: MemberRole.OWNER,
      status: MembershipStatus.APPROVED,
      isActive: true,
      unitId: units['Blok A-02'].id,
    },
    create: {
      groupId: group.id,
      userId: adminUser.id,
      role: MemberRole.OWNER,
      status: MembershipStatus.APPROVED,
      isActive: true,
      unitId: units['Blok A-02'].id,
    },
  });

  // 8. Keanggotaan: Warga Budi Santoso sebagai MEMBER menempati Blok A-01
  const memberMembership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: memberUser.id,
      },
    },
    update: {
      role: MemberRole.MEMBER,
      status: MembershipStatus.APPROVED,
      isActive: true,
      unitId: units['Blok A-01'].id,
    },
    create: {
      groupId: group.id,
      userId: memberUser.id,
      role: MemberRole.MEMBER,
      status: MembershipStatus.APPROVED,
      isActive: true,
      unitId: units['Blok A-01'].id,
    },
  });
  console.log(`🤝 Keanggotaan warga disiapkan: ${memberUser.fullName} di unit ${units['Blok A-01'].name}`);

  // 9. Lembar Tagihan Wajib untuk Blok A-01
  const existingBill = await prisma.bill.findFirst({
    where: {
      groupId: group.id,
      unitId: units['Blok A-01'].id,
      period: '2026-10',
    },
  });

  if (!existingBill) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.bill.create({
      data: {
        groupId: group.id,
        unitId: units['Blok A-01'].id,
        title: 'Iuran Bulanan Warga - Oktober 2026',
        period: '2026-10',
        dueDate,
        status: BillStatus.UNPAID,
        totalAmount: 150000,
        items: {
          create: [
            { name: 'Iuran Keamanan Lingkungan & Satpam', amount: 75000 },
            { name: 'Pengelolaan Kebersihan & Sampah', amount: 45000 },
            { name: 'Kas Sosial Warga', amount: 30000 },
          ],
        },
      },
    });
    console.log('📄 Tagihan contoh Rp 150.000 untuk Blok A-01 berhasil diterbitkan.');
  }

  // 10. Catatan Kas Awal di Buku Kas Komunitas
  const existingLedger = await prisma.cashLedger.findFirst({
    where: {
      groupId: group.id,
      category: 'Saldo Awal',
    },
  });

  if (!existingLedger) {
    await prisma.cashLedger.create({
      data: {
        groupId: group.id,
        type: CashFlowType.INCOME,
        amount: 2500000,
        category: 'Saldo Awal',
        description: 'Saldo kas operasional awal periode RT 04 Griya Asri',
      },
    });

    await prisma.cashLedger.create({
      data: {
        groupId: group.id,
        type: CashFlowType.EXPENSE,
        amount: 250000,
        category: 'Pemeliharaan',
        description: 'Pembelian lampu penerangan jalan gang 3 & kabel instalasi',
      },
    });
    console.log('📖 2 entri buku kas contoh (Pemasukan Saldo Awal & Pengeluaran Pemeliharaan) berhasil dicatat.');
  }

  console.log('✅ Prisma Seed berhasil diselesaikan!');
  console.log('\n--- Kredensial Akun Demo ---');
  console.log('1. Pengurus: 08111111111 / demo1234');
  console.log('2. Warga   : 08222222222 / demo1234');
  console.log('Kode Grup  : GRIYA04\n');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
