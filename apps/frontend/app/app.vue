<script setup lang="ts">
// eYuran Preview
const groups = [
  { id: '1', name: 'RT 04 / RW 08 Griya Asri', type: 'PHYSICAL_UNIT', members: 48, status: 'Aktif' },
  { id: '2', name: 'Komunitas Futsal Sabtu Malam', type: 'DIRECT_MEMBER', members: 16, status: 'Aktif' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
    <!-- Navbar -->
    <header class="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            e
          </div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              eYuran
            </h1>
            <p class="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase font-semibold">Community Billing</p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Masuk
          </button>
          <button class="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm">
            Buat Grup Baru
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Hero Banner -->
      <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div class="max-w-2xl relative z-10">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-4">
            🚀 Mesin Iuran & Pembukuan Transparan
          </span>
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Kelola tagihan komunitas tanpa ribet & 100% transparan.
          </h2>
          <p class="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6">
            Mendukung mode perumahan/kost (berbasis unit fisik) dan kasual (anggota langsung) dengan generator QRIS dinamis & info transfer otomatis.
          </p>
          <div class="flex flex-wrap gap-3">
            <button class="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-sm rounded-xl transition shadow">
              Mulai Buat Grup
            </button>
            <button class="px-5 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-400/30 text-white font-semibold text-sm rounded-xl transition">
              Pelajari Cara Kerja
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Grup Kelola Saya</h3>
            <p class="text-sm text-slate-500">Pilih grup untuk mengelola tagihan dan buku kas</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="group in groups"
            :key="group.id"
            class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <span
                  :class="[
                    'inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mb-2',
                    group.type === 'PHYSICAL_UNIT' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  ]"
                >
                  {{ group.type === 'PHYSICAL_UNIT' ? 'Unit Fisik (RT/Kost)' : 'Anggota Langsung' }}
                </span>
                <h4 class="text-base font-bold text-slate-900">{{ group.name }}</h4>
              </div>
              <span class="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                ● {{ group.status }}
              </span>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>{{ group.members }} Anggota Terdaftar</span>
              <span class="text-emerald-600 font-medium">Buka Dashboard →</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
