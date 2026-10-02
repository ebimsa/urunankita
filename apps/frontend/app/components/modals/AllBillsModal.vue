<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatRupiah } from '../../utils/formatters'

const props = defineProps<{
  isOpen: boolean
  bills: any[]
  pendingVerificationCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'verify', bill: any): void
  (e: 'viewReceipt', bill: any): void
}>()

const billFilterStatus = ref<'ALL' | 'PENDING_VERIFICATION' | 'UNPAID' | 'PAID'>('ALL')

const filteredAllBills = computed(() => {
  if (billFilterStatus.value === 'ALL') return props.bills
  return props.bills.filter((b: any) => b.status === billFilterStatus.value)
})

const handleVerify = (bill: any) => {
  emit('close')
  emit('verify', bill)
}

const handleViewReceipt = (bill: any) => {
  emit('close')
  emit('viewReceipt', bill)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click="$emit('close')"
      ></div>

      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-2xl rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800"
        >
          <div class="flex items-start justify-between">
            <div>
              <div
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs"
              >
                Rekap Pengurus
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Rekap Tagihan Seluruh Warga
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Pantau status pembayaran iuran setiap warga di grup ini.
              </p>
            </div>
            <button
              type="button"
              @click="$emit('close')"
              class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Filter Status Chips -->
          <div class="flex flex-wrap gap-1.5 pb-1">
            <button
              type="button"
              @click="billFilterStatus = 'ALL'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                billFilterStatus === 'ALL'
                  ? 'bg-[#007979] text-white shadow-xs'
                  : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'
              "
            >
              Semua ({{ bills.length }})
            </button>
            <button
              type="button"
              @click="billFilterStatus = 'PENDING_VERIFICATION'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                billFilterStatus === 'PENDING_VERIFICATION'
                  ? 'bg-[#E37434] text-white shadow-xs'
                  : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'
              "
            >
              Perlu Verifikasi ({{ pendingVerificationCount }})
            </button>
            <button
              type="button"
              @click="billFilterStatus = 'UNPAID'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                billFilterStatus === 'UNPAID'
                  ? 'bg-[#007979] text-white shadow-xs'
                  : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'
              "
            >
              Belum Bayar
            </button>
            <button
              type="button"
              @click="billFilterStatus = 'PAID'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                billFilterStatus === 'PAID'
                  ? 'bg-[#24B1B1] text-white shadow-xs'
                  : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'
              "
            >
              Lunas
            </button>
          </div>

          <!-- List Warga Bills -->
          <div class="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
            <div
              v-if="filteredAllBills.length === 0"
              class="p-8 text-center text-slate-500 font-medium text-xs"
            >
              Tidak ada data tagihan pada kategori ini.
            </div>

            <div
              v-for="b in filteredAllBills"
              :key="b.id"
              class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] border border-white/70 flex items-center justify-between gap-3"
            >
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-black text-xs text-slate-800">
                    {{ b.unit?.name || b.member?.user?.fullName || 'Warga' }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-medium">
                    • {{ b.title }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 font-medium mt-0.5">
                  Periode: {{ b.period || 'Berjalan' }}
                </p>
                <div class="mt-1 text-xs font-black text-[#007979]">
                  {{ formatRupiah(b.totalAmount) }}
                </div>
              </div>

              <div>
                <button
                  v-if="b.status === 'PENDING_VERIFICATION'"
                  type="button"
                  @click="handleVerify(b)"
                  class="px-3 py-1 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white font-black text-[11px] shadow-[2px_2px_5px_rgba(0,121,121,0.3)] hover:brightness-105 active:scale-95 transition-all uppercase whitespace-nowrap cursor-pointer"
                >
                  Verifikasi
                </button>
                <button
                  v-else-if="b.status === 'PAID'"
                  type="button"
                  @click="handleViewReceipt(b)"
                  class="px-2.5 py-1 rounded-xl bg-[#24B1B1]/15 hover:bg-[#24B1B1]/25 text-[#007979] font-black text-[10px] uppercase shadow-xs whitespace-nowrap transition-all flex items-center space-x-1 cursor-pointer"
                  title="Lihat & cetak kwitansi pembayaran resmi"
                >
                  <span>🧾 Kwitansi</span>
                </button>
                <span
                  v-else
                  class="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-600 font-black text-[11px] uppercase whitespace-nowrap"
                >
                  Belum Bayar
                </span>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              @click="$emit('close')"
              class="py-2.5 px-5 rounded-xl bg-[#eaf0f7] text-slate-700 font-bold text-xs shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
