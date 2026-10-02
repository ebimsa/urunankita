<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah, formatDate } from '../../utils/formatters'

const props = defineProps<{
  isOpen: boolean
  bill: any
  groupName?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const receiptNumber = computed(() => {
  if (!props.bill?.id) return 'KW-000000'
  return `KW-${props.bill.id.slice(0, 8).toUpperCase()}`
})

const successfulPayment = computed(() => {
  if (!props.bill?.payments || props.bill.payments.length === 0) return null
  return props.bill.payments.find((p: any) => p.status === 'SUCCESS') || props.bill.payments[0]
})

const paymentMethodLabel = computed(() => {
  const method = successfulPayment.value?.method
  switch (method) {
    case 'QRIS_DYNAMIC':
      return 'QRIS (Otomatis/Digital)'
    case 'BANK_TRANSFER_MANUAL':
      return 'Transfer Rekening Bank'
    case 'CASH_MANUAL':
      return 'Tunai (Kasir / Petugas)'
    default:
      return method || 'Konfirmasi Digital'
  }
})

const printReceipt = () => {
  window.print()
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="isOpen && bill"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        class="w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[10px_10px_30px_#cad5e2,-10px_-10px_30px_#ffffff] border border-white/80 space-y-6 my-8 print:m-0 print:p-6 print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white"
        id="receipt-print-container"
      >
        <!-- Top Toolbar: Judul & Tombol Tutup (Sembunyi saat dicetak) -->
        <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 print:hidden">
          <div class="flex items-center space-x-2 text-xs font-black text-[#007979]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Kwitansi Tanda Terima Resmi</span>
          </div>
          <button
            @click="$emit('close')"
            type="button"
            class="w-8 h-8 rounded-full bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- ============================================== -->
        <!-- AREA CETAK KWITANSI (TAMPIL DI LAYAR & PRINT)   -->
        <!-- ============================================== -->
        <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5 print:p-0 print:border-none print:shadow-none">
          <!-- Kop Kwitansi -->
          <div class="flex items-start justify-between border-b-2 border-slate-800 pb-4">
            <div>
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-lg bg-[#007979] text-white flex items-center justify-center font-black text-xs">
                  u
                </div>
                <span class="font-black text-slate-800 text-lg tracking-tight">urunankita</span>
              </div>
              <p class="text-[11px] text-slate-500 font-semibold mt-1">
                Sistem Iuran Komunitas Transparan & Akuntabel
              </p>
              <p class="text-xs font-black text-[#007979] mt-0.5">
                {{ groupName }}
              </p>
            </div>

            <div class="text-right">
              <span class="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider mb-1 border border-emerald-300">
                LUNAS
              </span>
              <p class="font-mono text-xs font-black text-slate-800">{{ receiptNumber }}</p>
              <p class="text-[10px] text-slate-400 font-medium">
                {{ formatDate(successfulPayment?.verifiedAt || successfulPayment?.createdAt || bill.updatedAt) }}
              </p>
            </div>
          </div>

          <!-- Rincian Pembayar & Tagihan -->
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Telah Diterima Dari
              </span>
              <p class="font-black text-slate-800">
                <span v-if="bill.unit">{{ bill.unit.name }}</span>
                <span v-else-if="bill.member?.user?.fullName">{{ bill.member.user.fullName }}</span>
                <span v-else>Warga Komunitas</span>
              </p>
              <p v-if="bill.unit && bill.member?.user?.fullName" class="text-[11px] text-slate-600 font-medium">
                Penghuni: {{ bill.member.user.fullName }}
              </p>
            </div>

            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Peruntukan Iuran
              </span>
              <p class="font-black text-slate-800">
                {{ bill.title }}
              </p>
              <p v-if="bill.period" class="text-[11px] text-slate-600 font-medium">
                Periode: {{ bill.period }}
              </p>
            </div>
          </div>

          <!-- Tabel Rincian Komponen Biaya -->
          <div>
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-300 text-[10px] font-black uppercase text-slate-500">
                  <th class="py-2">Uraian Komponen</th>
                  <th class="py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr v-for="item in (bill.items || [])" :key="item.id">
                  <td class="py-2 text-slate-800 font-semibold">{{ item.name }}</td>
                  <td class="py-2 text-right font-mono">{{ formatRupiah(item.amount) }}</td>
                </tr>
                <tr v-if="!bill.items || bill.items.length === 0">
                  <td class="py-2 text-slate-800 font-semibold">{{ bill.title }}</td>
                  <td class="py-2 text-right font-mono">{{ formatRupiah(bill.totalAmount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-slate-800 font-black text-sm text-slate-900">
                  <td class="py-2.5">Total Bayar Lunas</td>
                  <td class="py-2.5 text-right font-mono text-[#007979]">
                    {{ formatRupiah(bill.totalAmount) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Info Pembayaran & Stempel Digital -->
          <div class="pt-3 border-t border-slate-200 flex items-center justify-between gap-4">
            <div class="space-y-1 text-xs">
              <div class="text-[11px] text-slate-500">
                Metode Pembayaran: <strong class="text-slate-800">{{ paymentMethodLabel }}</strong>
              </div>
              <div v-if="successfulPayment?.notes" class="text-[11px] text-slate-500">
                Catatan: <em>{{ successfulPayment.notes }}</em>
              </div>
              <div class="text-[10px] text-slate-400">
                Diverifikasi secara digital melalui aplikasi urunankita.
              </div>
            </div>

            <!-- Stempel Digital Taktil -->
            <div class="border-2 border-emerald-600 rounded-xl px-3 py-1.5 text-center rotate-[-4deg] opacity-90">
              <span class="block text-[9px] font-black uppercase tracking-widest text-emerald-700">
                TERVERIFIKASI
              </span>
              <span class="block text-xs font-black text-emerald-800 font-mono">
                LUNAS
              </span>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi Bawah (Sembunyi saat cetak) -->
        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/80 print:hidden">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl bg-[#eaf0f7] text-xs font-bold text-slate-600 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            @click="printReceipt"
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white text-xs font-black shadow-[2px_2px_6px_rgba(0,121,121,0.3)] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak Kwitansi / PDF</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
@media print {
  /* Sembunyikan elemen latar belakang dan navigasi */
  body * {
    visibility: hidden;
  }
  #receipt-print-container,
  #receipt-print-container * {
    visibility: visible;
  }
  #receipt-print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white !important;
    box-shadow: none !important;
  }
}
</style>
