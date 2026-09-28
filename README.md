# eYuran - Multi-tenant Community Billing & Bookkeeping Engine

eYuran adalah platform SaaS pencatatan, penagihan, dan transparansi iuran komunitas mandiri. Dirancang untuk menangani kelompok formal (perumahan, RT/RW, kost) maupun kelompok kasual (futsal, arisan, komunitas hobi).

---

## Tech Stack & Arsitektur

Sistem ini dibangun dengan arsitektur Monorepo menggunakan npm workspaces:

| Komponen | Teknologi | Keterangan |
|---|---|---|
| Backend | NestJS (TypeScript) | Arsitektur modular, DTO validation, Guards, dan Dependency Injection |
| Database & ORM | PostgreSQL + Prisma ORM | Type-safe schema, relational integrity, dan migrasi otomatis |
| Frontend | Nuxt 3 (Vue 3) + Tailwind CSS | Composition API, auto-imports, dan antarmuka responsif |
| Alur Pembayaran | P2P QRIS Dinamis & Rekening Bank Manual | Tanpa biaya platform, tanpa penampungan dana, dana langsung ke pengurus |

---

## Pilar Fitur Utama

1. Dua Mode Struktur Grup:
   - Mode Unit Fisik (PHYSICAL_UNIT): Cocok untuk RT/RW atau Kost. Tagihan dialokasikan ke Unit (contoh: Rumah Blok A-1 atau Kamar 03). Riwayat tagihan tetap tersimpan di unit meski penghuni berganti.
   - Mode Anggota Langsung (DIRECT_MEMBER): Cocok untuk komunitas olahraga atau kasual. Tagihan langsung ditujukan ke akun masing-masing individu.
2. Mesin Penagihan & QRIS Dinamis (P2P):
   - Pengurus memasukkan data QRIS statis atau nomor rekening bank.
   - Sistem memodifikasi payload QRIS secara dinamis dengan menambahkan nominal tagihan dan 3 digit kode unik untuk verifikasi mutasi bank.
3. Pembukuan & Transparansi:
   - Rekap arus kas masuk (iuran) dan keluar (operasional) dapat dipantau seluruh anggota secara terbuka.
   - Audit trail otomatis mencatat setiap tindakan sensitif seperti konfirmasi pembayaran manual dan perubahan tagihan.

---

## Struktur Direktori

```text
eYuran/
├── apps/
│   ├── backend/          # NestJS API & Prisma Schema
│   │   ├── prisma/       # schema.prisma (PostgreSQL)
│   │   └── src/          # Modules, Controllers, Services
│   └── frontend/         # Nuxt 3 (Vue 3) Web Application
│       ├── app/          # Vue Pages & Components
│       └── nuxt.config.ts
├── package.json          # Root Monorepo configuration
├── .npmrc
└── README.md
```

---

## Panduan Menjalankan Proyek

### 1. Install Dependensi
```bash
npm install
```

### 2. Setup Database & Prisma
Salin konfigurasi environment di backend:
```bash
cp apps/backend/.env.example apps/backend/.env
```

Sesuaikan `DATABASE_URL` di `apps/backend/.env` dengan koneksi PostgreSQL Anda, lalu jalankan pembuatan client:
```bash
npm run prisma:generate
```

Untuk menjalankan migrasi ke database:
```bash
npm run prisma:migrate
```

### 3. Jalankan Aplikasi (Development)
```bash
# Menjalankan Backend NestJS (Port 3001)
npm run dev:backend

# Menjalankan Frontend Nuxt (Port 3000)
npm run dev:frontend
```
