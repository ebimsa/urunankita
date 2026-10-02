# urunankita - UI Design System & Guidelines (Neumorphism / Soft UI)

Dokumen ini merupakan panduan resmi sistem desain antarmuka (**UI Design System**) untuk platform **urunankita**. Semua komponen baru (Dashboard, Form, Modal, Halaman Login, dll.) wajib mengikuti panduan ini agar pengalaman pengguna tetap konsisten, taktil, dan profesional.

---

## 1. Filosofi & Konsep Desain

urunankita mengadopsi gaya **Neumorphism (Soft UI)** yang dipadukan dengan prinsip minimalis modern:
- **Taktil & Tiga Dimensi**: Elemen antarmuka tampak seperti muncul dari permukaan latar (*extruded*) atau tenggelam (*inset/debossed*).
- **Cahaya Realistis**: Menggunakan *dual-shadows* yang konsisten (highlight putih di sudut kiri atas dan bayangan lembut abu-kebiruan di kanan bawah).
- **Tanpa Garis Tepi Hitam Kaku**: Tidak menggunakan garis tepi tegas ala *neo-brutalism* (`border-2 border-slate-900` ditiadakan). Batas elemen dibentuk oleh bayangan lembut dan sudut membulat (*smooth rounded corners*).
- **Mobile-First**: Seluruh hierarki, tata letak, dan area sentuh dirancang optimal untuk perangkat layar sentuh sebelum diskalakan ke desktop.

---

## 2. Palet Warna (Color Tokens)

Warna merek asli urunankita dipertahankan secara utuh dan dipadukan dengan kanvas *light blue-gray*:

| Token | Warna | Nilai Hex | Peruntukan Utama |
|---|---|---|---|
| `brand-tealDark` | Deep Teal | `#007979` | Aksen primer, tombol skema fisik, teks penekanan, header banner |
| `brand-teal` | Cyan Teal | `#24B1B1` | Aksen sekunder, indikator verifikasi, highlight data |
| `brand-cream` | Warm Cream | `#FFE2AF` | Latar belakang badge status, kontras teks aksen, sorotan hangat |
| `brand-orange` | Terracotta Orange | `#E37434` | Tombol CTA utama (Call-To-Action), badge penting, logo identitas `e` |
| `neu-base` | Light Blue-Gray | `#eaf0f7` | Latar belakang utama seluruh halaman & kartu (kanvas netral) |
| `neu-surface` | Soft White Gray | `#edf3fa` | Latar permukaan kartu sekunder atau gradien |
| `text-primary` | Slate 800 | `#1e293b` | Judul, heading utama, dan teks bernilai tegas |
| `text-secondary` | Slate 600 | `#475569` | Paragraf deskripsi dan label pembantu |
| `text-muted` | Slate 500 | `#64748b` | Metadata, tanggal, dan placeholder |

---

## 3. Sistem Bayangan Neumorphic (Shadow Elevation)

Konfigurasi bayangan ganda (*dual-cast shadow*) didefinisikan dalam [`tailwind.config.ts`](file:///c:/project/eYuran/apps/frontend/tailwind.config.ts):

### A. Permukaan Timbul (*Raised / Extruded*)
Digunakan untuk kartu (*cards*), tombol default, dan lencana timbul:
- **Kartu Standar (`neu-flat`)**:
  ```css
  box-shadow: 8px 8px 18px #cad5e2, -8px -8px 18px #ffffff;
  ```
- **Komponen Kecil (`neu-flat-sm`)**:
  ```css
  box-shadow: 4px 4px 10px #cbd7e4, -4px -4px 10px #ffffff;
  ```
- **Kontainer Besar (`neu-flat-lg`)**:
  ```css
  box-shadow: 14px 14px 28px #c5d2e2, -14px -14px 28px #ffffff;
  ```

### B. Permukaan Cekung (*Inset / Debossed*)
Digunakan untuk kolom input, bilah pencarian, tab yang sedang aktif, dan sumur data (*data wells*):
- **Cekung Standar (`neu-pressed`)**:
  ```css
  box-shadow: inset 4px 4px 8px #cad5e2, inset -4px -4px 8px #ffffff;
  ```
- **Cekung Halus (`neu-pressed-sm`)**:
  ```css
  box-shadow: inset 2px 2px 5px #cad5e2, inset -2px -2px 5px #ffffff;
  ```

### C. Tombol Berwarna (*Colored 3D Glow*)
- **Orange CTA (`neu-orange`)**:
  ```css
  box-shadow: 6px 6px 18px rgba(227, 116, 52, 0.38), -4px -4px 14px rgba(255, 255, 255, 0.9);
  /* Saat Ditekan (Active State) */
  active:box-shadow: inset 3px 3px 6px rgba(175, 75, 15, 0.4), inset -2px -2px 5px rgba(255, 200, 160, 0.3);
  ```
- **Teal Accent (`neu-teal`)**:
  ```css
  box-shadow: 6px 6px 18px rgba(0, 121, 121, 0.38), -4px -4px 14px rgba(255, 255, 255, 0.9);
  ```

---

## 4. Spesifikasi Komponen

### 1. Tombol (Buttons)
- **Tombol Utama (CTA)**: Menggunakan gradien `bg-gradient-to-r from-[#e87b38] to-[#ce6326]`, teks putih, `rounded-2xl`, bayangan `neu-orange`. Saat diklik harus memiliki sensasi membal (*pressed state* dengan `active:shadow-[inset...]`).
- **Tombol Sekunder (Surface)**: Menggunakan warna dasar `bg-[#eaf0f7]`, teks `#007979` atau `#1e293b`, bayangan timbul `neu-flat-sm`.
- **Target Sentuh Mobile**: Tinggi tombol minimal **44px** dengan padding yang memadai (`py-3 px-5 sm:py-3.5 sm:px-7`).

### 2. Pengalih Mode (Segmented Control / Switcher)
- Latar belakang berupa wadah cekung (`neu-pressed-sm`).
- Tab yang aktif terangkat timbul dengan bayangan putih-abu atau berwarna (`bg-[#007979] text-white`).
- Di layar *mobile*, tombol diatur vertikal atau membentang penuh (*full-width*).

### 3. Kolom Input & Form
- Menggunakan latar belakang `#eaf0f7` dengan bayangan cekung (`shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff]`).
- Tanpa garis tepi tebal; fokus hanya menggunakan *ring* halus warna Deep Teal (`focus:ring-1 focus:ring-[#007979]`).

### 4. Tabel & Data List
- Kontainer tabel dibungkus kartu `rounded-3xl` dengan bayangan `neu-flat`.
- Wajib memiliki pembungkus `overflow-x-auto` agar data mutasi kas dapat digeser (*scroll*) dengan nyaman di layar HP tanpa memotong tampilan.

### 5. Navbar & Navigasi Mobile
- **Tinggi Header Mobile**: Ditetapkan proporsional di `h-16` (64px) di layar HP dan `h-20` (80px) di desktop.
- **Tombol Cepat**: Menggunakan tombol primer "Masuk" yang langsung dapat diakses baik di desktop maupun di header mobile.
- **Tombol Aksi Grup Taktil (+)**: Pada status terautentikasi, tombol squircle `+` ditempatkan di navbar (desktop & mobile) yang membuka dropdown Neumorphic melayang berisi opsi *"Gabung Grup"* dan *"Buat Grup Baru"*, menjaga konten dashboard tetap ringkas dan bebas tombol bertumpuk.
- **Drawer Menu Mobile**: Menggunakan kartu neumorphic melayang (*floating sheet*) dengan bayangan tebal lembut, animasi `slide-fade`, serta lapisan *backdrop overlay* semi-transparan (`bg-slate-900/30 backdrop-blur-xs`) yang dapat ditutup saat diklik di luar area menu.
- **Item Menu Mobile**: Tiap tautan dilengkapi kontainer ikon taktil berbayangan timbul, judul, subjudul deskriptif, dan panah navigasi (*chevron*).

---

## 5. Aturan Penting (*Do's & Don'ts*)

### ❌ HAL YANG HARUS DIHINDARI (DON'TS):
1. **DILARANG membuat bingkai/bar ponsel buatan pada kartu**:
   - Jangan memasang bingkai fisik HP, notch speaker, status bar baterai/wifi, atau *home indicator bar* di dalam komponen konten. Buat kartu antarmuka neumorphic secara mandiri.
2. **DILARANG memasang label overhead berulang di atas judul section**:
   - Hindari badge pengantar seperti *"Landasan Tata Kelola Kas"*, *"Dua Skema Komunitas"*, *"Audit Real-time"*, atau *"Portofolio Pengguna"* tepat di atas heading. Judul section harus langsung bersih dan tegas.
3. **DILARANG menyebut nama gaya desain di teks antarmuka**:
   - Jangan menulis kalimat seperti *"Kelola iuran dalam Gaya Neumorphism"*, *"Tampilan Soft UI"*, atau sejenisnya pada teks yang dibaca oleh pengguna akhir. Teks harus murni berorientasi pada nilai produk dan solusi.
4. **DILARANG menggunakan titik dekoratif (*floating dots*) tanpa fungsi**:
   - Hindari menambahkan bulatan titik warna (seperti dot hijau/teal di samping *"Surplus Kas Terverifikasi"* atau di footer kartu) yang tidak memiliki fungsi interaktif.
5. **DILARANG menggunakan garis tepi hitam tebal**:
   - Hindari `border-2 border-slate-900` atau bayangan offset kotak datar (`shadow-[4px_4px_0px_0px_#000000]`).
6. **DILARANG memasang tombol "Buat Grup" atau "Daftar Komunitas" di landing page**:
   - Seluruh tombol Call-to-Action diarahkan ke **"Masuk"** / **"Masuk"**.

### ✅ HAL YANG WAJIB DITERAPKAN (DO'S):
1. **Mobile-First Secara Konsisten**:
   - Setiap komponen harus nyaman digunakan satu tangan pada layar ponsel (360px - 414px).
   - Tombol aksi utama di mobile harus memenuhi lebar kontainer (`w-full sm:w-auto`).
   - Menyediakan menu navigasi *drawer/dropdown* di mobile.
2. **Konsistensi Radius Sudut**:
   - Kartu besar: `rounded-3xl` (24px)
   - Tombol & input: `rounded-2xl` (16px)
   - Badge & chip: `rounded-xl` atau `rounded-full`
3. **Aksesibilitas & Kontras Teks**:
   - Pertahankan warna teks gelap (`#1e293b` dan `#475569`) di atas kanvas abu-terang agar keterbacaan tetap tinggi dan tidak pudar.

---

*Terakhir diperbarui: 27 September 2026 — Tim Pengembang urunankita*
