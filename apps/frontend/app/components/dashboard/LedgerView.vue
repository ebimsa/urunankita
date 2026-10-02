<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatRupiah, formatDate } from '../../utils/formatters'

const props = defineProps<{
  activeMembership: any
  isPengurus: boolean
  ledgerData: any
}>()

defineEmits<{
  (e: 'goToDashboard'): void
  (e: 'openCreateRecord', type: 'INCOME' | 'EXPENSE'): void
  (e: 'deleteEntry', id: string): void
}>()

// Internal reactive search & filter
const ledgerSearchQuery = ref('')
const ledgerFilterType = ref<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

const filteredLedgerEntries = computed(() => {
  if (!props.ledgerData?.entries) return []
  return props.ledgerData.entries.filter((entry: any) => {
    const matchesType =
      ledgerFilterType.value === 'ALL' || entry.type === ledgerFilterType.value
    const q = ledgerSearchQuery.value.trim().toLowerCase()
    if (!q) return matchesType

    const matchesQuery =
      (entry.description && entry.description.toLowerCase().includes(q)) ||
      (entry.category && entry.category.toLowerCase().includes(q)) ||
      (entry.amount && String(entry.amount).includes(q))

    return matchesType && matchesQuery
  })
})

const exportLedgerCsv = () => {
  const entries = filteredLedgerEntries.value
  if (!entries || entries.length === 0) {
    alert('Tidak ada data transaksi kas untuk diekspor.')
    return
  }

  const groupName = props.activeMembership?.group?.name || 'Komunitas'
  const header = ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Dicatat Oleh']
  const rows = entries.map((e: any) => [
    formatDate(e.entryDate || e.createdAt),
    e.type === 'INCOME' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
    `"${(e.category || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.amount,
    `"${(e.createdBy?.fullName || '-').replace(/"/g, '""')}"`,
  ])

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `Buku_Kas_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn">
    <!-- Top Toolbar / Header Row -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div class="space-y-1">
        <button
          type="button"
          @click="$emit('goToDashboard')"
          class="inline-flex items-center space-x-1.5 text-xs font-black text-[#007979] hover:text-[#24B1B1] transition-colors cursor-pointer mb-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Iuran & Tagihan</span>
        </button>
        <h3 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Transparansi Buku Kas Terkini
        </h3>
        <p class="text-xs text-slate-500 font-medium">
          Laporan pembukuan mutasi terbuka kas grup {{ activeMembership?.group.name }}
        </p>
      </div>

      <div class="flex items-center space-x-2.5 flex-wrap">
        <!-- Tombol Ekspor CSV -->
        <button
          type="button"
          @click="exportLedgerCsv"
          class="px-3.5 py-2.5 rounded-2xl bg-[#eaf0f7] text-[#007979] text-xs font-black shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:bg-white/60 transition-all flex items-center space-x-1.5 cursor-pointer"
          title="Ekspor laporan buku kas ke format CSV (Excel)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Ekspor CSV</span>
        </button>

        <template v-if="isPengurus">
          <button
            type="button"
            @click="$emit('openCreateRecord', 'EXPENSE')"
            class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white text-xs font-black shadow-[3px_3px_8px_rgba(227,116,52,0.35)] active:scale-95 transition-all flex items-center space-x-1.5 hover:brightness-105 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Catat Pengeluaran</span>
          </button>
          <button
            type="button"
            @click="$emit('openCreateRecord', 'INCOME')"
            class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white text-xs font-black shadow-[3px_3px_8px_rgba(0,121,121,0.35)] active:scale-95 transition-all flex items-center space-x-1.5 hover:brightness-105 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Catat Pemasukan</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Financial Metrics: Three Neumorphic Raised Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Card 1: Saldo Kas Saat Ini -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Saldo Kas Grup
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#007979] tracking-tight">
          {{ formatRupiah(ledgerData?.summary?.currentBalance) }}
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Saldo bersih riil yang dipegang bendahara
        </div>
      </div>

      <!-- Card 2: Total Pemasukan -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Total Pemasukan Iuran
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#24B1B1] tracking-tight">
          {{ formatRupiah(ledgerData?.summary?.totalIncome) }}
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Akumulasi iuran warga terverifikasi
        </div>
      </div>

      <!-- Card 3: Total Pengeluaran -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Total Pengeluaran Kas
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#E37434] tracking-tight">
          {{ formatRupiah(ledgerData?.summary?.totalExpense) }}
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Honor satpam, armada sampah, & perbaikan
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar Card -->
    <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-4 sm:p-5 space-y-3.5">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Box -->
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="ledgerSearchQuery"
            type="text"
            placeholder="Cari transaksi berdasarkan kategori, uraian, atau nominal..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
          />
        </div>

        <!-- Filter Chips -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            @click="ledgerFilterType = 'ALL'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="ledgerFilterType === 'ALL'
              ? 'bg-[#007979] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Semua ({{ ledgerData?.entries?.length || 0 }})
          </button>
          <button
            type="button"
            @click="ledgerFilterType = 'INCOME'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="ledgerFilterType === 'INCOME'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-[#eaf0f7] text-teal-800 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Pemasukan (+)
          </button>
          <button
            type="button"
            @click="ledgerFilterType = 'EXPENSE'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="ledgerFilterType === 'EXPENSE'
              ? 'bg-[#E37434] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-[#E37434] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Pengeluaran (-)
          </button>
        </div>
      </div>

      <div class="text-[11px] text-slate-500 font-semibold flex items-center justify-between pt-1 border-t border-slate-200/60">
        <span>Menampilkan {{ filteredLedgerEntries.length }} dari {{ ledgerData?.entries?.length || 0 }} mutasi kas</span>
        <span v-if="ledgerSearchQuery" class="text-[#007979] font-bold">Filter pencarian aktif</span>
      </div>
    </div>

    <!-- Tabel Mutasi Kas Terbuka -->
    <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-4 sm:p-6 overflow-hidden">
      <!-- State Kosong -->
      <div v-if="filteredLedgerEntries.length === 0" class="p-12 text-center text-slate-500 font-medium text-xs space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center mx-auto text-slate-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p v-if="ledgerSearchQuery">Tidak ditemukan catatan kas yang cocok dengan pencarian "{{ ledgerSearchQuery }}".</p>
        <p v-else>Belum ada catatan mutasi kas grup. Pengurus dapat mencatat pengeluaran atau pemasukan baru melalui tombol di atas.</p>
      </div>

      <!-- Tabel Responsif -->
      <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
        <table class="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th scope="col" class="py-3 px-4">Tanggal</th>
              <th scope="col" class="py-3 px-4">Tipe</th>
              <th scope="col" class="py-3 px-4">Kategori</th>
              <th scope="col" class="py-3 px-4">Uraian / Keterangan</th>
              <th scope="col" class="py-3 px-4 text-right">Nominal</th>
              <th v-if="isPengurus" scope="col" class="py-3 px-4 text-center w-16">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/60 text-xs font-semibold text-slate-700">
            <tr
              v-for="entry in filteredLedgerEntries"
              :key="entry.id"
              class="hover:bg-white/40 transition-colors group"
            >
              <!-- Tanggal -->
              <td class="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                {{ formatDate(entry.entryDate || entry.createdAt) }}
              </td>

              <!-- Tipe -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase text-white shadow-xs"
                  :class="entry.type === 'INCOME' ? 'bg-[#007979]' : 'bg-[#E37434]'"
                >
                  {{ entry.type === 'INCOME' ? 'Masuk (+)' : 'Keluar (-)' }}
                </span>
              </td>

              <!-- Kategori -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="inline-block px-2 py-0.5 rounded-lg bg-[#eaf0f7] shadow-[inset_1px_1px_2px_#cad5e2,inset_-1px_-1px_2px_#ffffff] text-slate-700 text-[11px] font-bold">
                  {{ entry.category }}
                </span>
              </td>

              <!-- Uraian / Keterangan -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-slate-800">
                  {{ entry.description }}
                </div>
                <div v-if="entry.payment" class="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span>Otomatis dari pembayaran iuran warga</span>
                  <span v-if="entry.payment?.bill?.unit" class="text-slate-600 font-bold">({{ entry.payment.bill.unit.name }})</span>
                </div>
                <a
                  v-if="entry.receiptUrl"
                  :href="entry.receiptUrl"
                  target="_blank"
                  class="inline-flex items-center space-x-1 text-[10px] text-[#007979] hover:underline font-bold mt-0.5"
                >
                  <span>Lihat Bukti/Struk</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </td>

              <!-- Nominal -->
              <td class="py-3.5 px-4 whitespace-nowrap text-right font-black text-sm">
                <span :class="entry.type === 'INCOME' ? 'text-[#007979]' : 'text-[#E37434]'">
                  {{ entry.type === 'INCOME' ? '+' : '-' }} {{ formatRupiah(entry.amount) }}
                </span>
              </td>

              <!-- Aksi -->
              <td v-if="isPengurus" class="py-3.5 px-4 whitespace-nowrap text-center">
                <button
                  v-if="!entry.paymentId"
                  type="button"
                  @click="$emit('deleteEntry', entry.id)"
                  class="w-7 h-7 mx-auto rounded-lg bg-[#eaf0f7] text-slate-400 hover:text-rose-600 shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                  title="Hapus entri kas ini"
                >
                  ✕
                </button>
                <span v-else class="text-[10px] text-slate-300 font-bold select-none" title="Terkunci otomatis dari sistem">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
