# 💰 eYuran — Multi-tenant Community Billing & Bookkeeping Engine

**eYuran** adalah platform SaaS pencatatan, penagihan, dan transparansi iuran komunitas mandiri. Dirancang untuk menangani kelompok formal (perumahan, RT/RW, kost) maupun kelompok kasual (futsal, arisan, komunitas hobi).

---

## 🏗️ Tech Stack & Architecture

Sistem ini dibangun dengan arsitektur **Monorepo** modern menggunakan npm workspaces:

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Backend** | [NestJS](https://nestjs.com/) (TypeScript) | Enterprise-grade, modular, strict architecture (Modules, Guards, DTOs) |
| **Database & ORM** | PostgreSQL + [Prisma ORM](https://www.prisma.io/) | Type-safe schema, relational integrity, migrations |
| **Frontend** | [Nuxt 3](https://nuxt.com/) (Vue 3) + Tailwind CSS | Reactive Composition API, auto-imports, high-speed DX |
| **Payment Flow** | P2P QRIS Dinamis & Rekening Bank Manual | Zero platform fee, zero escrow, langsung ke rekening/e-wallet Bendahara |

---

## 🌟 Pilar Fitur Utama

1. **Dua Mode Struktur Grup:**
   - **Mode Unit Fisik (`PHYSICAL_UNIT`):** Cocok untuk RT/RW atau Kost. Tagihan dialokasikan ke Unit (contoh: *Rumah Blok A-1* atau *Kamar 03*). Riwayat tagihan tetap tersimpan di unit meski penghuni berganti.
   - **Mode Anggota Langsung (`DIRECT_MEMBER`):** Cocok untuk komunitas olahraga/kasual. Tagihan langsung ditujukan ke akun masing-masing individu.
2. **Mesin Penagihan & QRIS Dinamis (P2P):**
   - Bendahara cukup memasukkan QRIS statis / nomor rekening mereka sekali.
   - Sistem memodifikasi payload QRIS secara dinamis dengan menambahkan **nominal tagihan + 3 digit kode unik** untuk mempermudah pengecekan mutasi bank.
3. **Pembukuan & Transparansi Terbuka:**
   - Rekap arus kas masuk (iuran) dan keluar (operasional) dapat dipantau seluruh anggota secara transparan.
   - **Audit Trail** otomatis untuk setiap aksi sensitif (konfirmasi manual, perubahan tagihan).

---

## 📁 Struktur Direktori

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

## 🚀 Panduan Menjalankan Proyek

### 1. Install Dependensi
```bash
npm install
```

### 2. Setup Database & Prisma
Salin konfigurasi environment di backend:
```bash
cp apps/backend/.env.example apps/backend/.env
```
Sesuaikan `DATABASE_URL` di `apps/backend/.env` dengan koneksi PostgreSQL lokal/Supabase Anda, lalu jalankan migrasi:
```bash
npm run prisma:generate
# atau untuk migrasi ke database riil:
npm run prisma:migrate
```

### 3. Jalankan Aplikasi (Development)
```bash
# Menjalankan Backend NestJS (Port 3001)
npm run dev:backend

# Menjalankan Frontend Nuxt (Port 3000)
npm run dev:frontend
```
