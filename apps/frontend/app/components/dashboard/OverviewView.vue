<script setup lang="ts">
import { formatRupiah } from '../../utils/formatters'

defineProps<{
  activeMembership: any
  isPengurus: boolean
  myBills: any[]
  myUnpaidBillsTotal: number
  myUnpaidBillsCount: number
  myPendingVerificationBillsCount: number
  myPendingVerificationBillsTotal: number
  ledgerData: any
  pendingVerificationBills: any[]
  pendingVerificationCount: number
}>()

defineEmits<{
  (e: 'openPayment', bill: any): void
  (e: 'openPaymentConfig'): void
  (e: 'openBillModal'): void
  (e: 'openVerify', bill: any): void
  (e: 'openAllBills'): void
  (e: 'goToLedger'): void
}>()
</script>

<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn">
    <!-- Financial Primary Cards: Tagihan Saya & Saldo Kas Grup (2 Cards Only) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
      <!-- CARD 1: TAGIHAN SAYA -->
      <div
        class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 flex flex-col justify-between transition-all"
      >
        <div>
          <!-- Header Tagihan -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-2 flex-wrap">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-black uppercase tracking-wider text-slate-700">
                Tagihan Saya
              </span>
              <span class="px-2 py-0.5 rounded-lg bg-[#eaf0f7] text-slate-600 shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] text-[10px] font-bold">
                {{ myBills.length }} Lembar
              </span>
            </div>

            <div class="flex items-center space-x-2">
              <span
                v-if="myUnpaidBillsTotal > 0"
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[#FFE2AF] text-[#E37434] shadow-xs"
              >
                Belum Lunas
              </span>
              <span
                v-else-if="myPendingVerificationBillsCount > 0"
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-800 shadow-xs"
              >
                Menunggu Verifikasi
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-[#24B1B1]/15 text-[#007979] shadow-xs"
              >
                Lunas
              </span>
            </div>
          </div>

          <!-- Nominal Tagihan -->
          <div class="mt-4">
            <div
              class="text-2xl sm:text-3xl font-black tracking-tight"
              :class="myUnpaidBillsTotal > 0 ? 'text-[#E37434]' : 'text-[#007979]'"
            >
              <template v-if="myUnpaidBillsTotal > 0">
                {{ formatRupiah(myUnpaidBillsTotal) }}
              </template>
              <template v-else-if="myPendingVerificationBillsCount > 0">
                {{ formatRupiah(myPendingVerificationBillsTotal) }}
              </template>
              <template v-else>
                Rp 0
              </template>
            </div>

            <p class="mt-1 text-[11px] font-medium text-slate-500">
              <span v-if="myUnpaidBillsTotal > 0">
                {{ myUnpaidBillsCount }} lembar tagihan menunggu pembayaran Anda
              </span>
              <span v-else-if="myPendingVerificationBillsCount > 0">
                {{ myPendingVerificationBillsCount }} pembayaran sedang diverifikasi pengurus
              </span>
              <span v-else>
                Semua kewajiban tagihan unit Anda telah lunas
              </span>
            </p>
          </div>

          <!-- Daftar Rincian Lembar Tagihan -->
          <div class="mt-5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            <div v-if="myBills.length === 0" class="p-6 rounded-2xl bg-white/40 text-center text-slate-500 text-xs font-semibold">
              Belum ada lembar tagihan aktif untuk unit Anda.
            </div>

            <div
              v-for="b in myBills"
              :key="b.id"
              class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-black text-xs text-slate-800 truncate">{{ b.title }}</p>
                <p class="text-[10px] text-slate-500 font-medium">
                  Periode: {{ b.period || 'Berjalan' }} • Unit: {{ b.unit?.name || 'Langsung' }}
                </p>
                <div class="text-xs font-black text-[#007979] mt-0.5">
                  {{ formatRupiah(b.totalAmount) }}
                </div>
              </div>

              <div class="flex-shrink-0">
                <span
                  v-if="b.status === 'PAID'"
                  class="px-2.5 py-1 rounded-xl bg-[#24B1B1]/15 text-[#007979] font-black text-[10px] uppercase shadow-xs"
                >
                  Lunas
                </span>
                <span
                  v-else-if="b.status === 'PENDING_VERIFICATION'"
                  class="px-2.5 py-1 rounded-xl bg-[#FFE2AF] text-[#E37434] font-black text-[10px] uppercase shadow-xs whitespace-nowrap"
                >
                  Menunggu
                </span>
                <button
                  v-else
                  type="button"
                  @click="$emit('openPayment', b)"
                  class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white font-black text-xs shadow-[2px_2px_5px_rgba(227,116,52,0.3)] hover:brightness-105 active:scale-95 transition-all uppercase cursor-pointer whitespace-nowrap"
                >
                  Bayar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 2: SALDO KAS GRUP -->
      <div
        class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 flex flex-col justify-between transition-all"
      >
        <div>
          <!-- Header Saldo -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-2 flex-wrap">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-black uppercase tracking-wider text-slate-700">
                Saldo Kas Grup
              </span>
              <span class="px-2 py-0.5 rounded-lg bg-[#007979]/10 text-[#007979] text-[10px] font-black">
                Audit Terbuka
              </span>
            </div>

            <button
              type="button"
              @click="$emit('goToLedger')"
              class="text-[11px] font-black text-[#007979] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Rincian Buku Kas</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Nominal Saldo -->
          <div class="mt-4">
            <div class="text-2xl sm:text-3xl font-black text-[#007979] tracking-tight">
              {{ formatRupiah(ledgerData?.summary?.currentBalance) }}
            </div>
            <p class="mt-1 text-[11px] font-medium text-slate-500">
              Saldo bersih riil yang dikelola kas bendahara grup
            </p>
          </div>

          <!-- Pemasukan & Pengeluaran Breakdown -->
          <div class="grid grid-cols-2 gap-3 mt-5">
            <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60">
              <div class="flex items-center space-x-1.5 text-[#007979]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span class="text-[10px] font-black uppercase tracking-wide">Pemasukan</span>
              </div>
              <p class="text-sm sm:text-base font-black text-[#007979] mt-1 truncate">
                {{ formatRupiah(ledgerData?.summary?.totalIncome || 0) }}
              </p>
            </div>

            <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60">
              <div class="flex items-center space-x-1.5 text-rose-600">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span class="text-[10px] font-black uppercase tracking-wide">Pengeluaran</span>
              </div>
              <p class="text-sm sm:text-base font-black text-rose-600 mt-1 truncate">
                {{ formatRupiah(ledgerData?.summary?.totalExpense || 0) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom CTA to Ledger Page -->
        <div class="mt-5 pt-3 border-t border-slate-200/60">
          <button
            type="button"
            @click="$emit('goToLedger')"
            class="w-full py-2.5 px-3 rounded-xl bg-[#eaf0f7] text-[#007979] font-black text-xs shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2] hover:bg-white/60 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Buka Pembukuan Kas Selengkapnya</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Card Khusus Pengurus: Pengaturan & Penerbitan (Set-Set) -->
    <div
      v-if="isPengurus"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 space-y-4"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-2 flex-wrap">
        <div>
          <h4 class="font-black text-sm uppercase tracking-wider text-slate-800">
            Pengaturan & Penerbitan Iuran
          </h4>
          <p class="text-[11px] text-slate-500 font-medium">
            Konfigurasi tujuan transfer rekening / QRIS dan kelola aturan tarif tagihan grup
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Card 1: Tujuan Transfer (Rekening & QRIS) -->
        <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-black text-slate-800">Tujuan Transfer Warga</p>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold text-[#007979] bg-[#007979]/10">
                Rekening / QRIS
              </span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
              Tentukan gambar QRIS grup atau nomor rekening / e-wallet untuk pembayaran warga.
            </p>
          </div>
          <div class="pt-2 border-t border-slate-200/60">
            <button
              type="button"
              @click="$emit('openPaymentConfig')"
              class="w-full py-2.5 px-3 rounded-xl bg-[#eaf0f7] text-[#007979] font-black text-xs shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2] hover:bg-white/60 transition-all text-center cursor-pointer"
            >
              Atur Rekening & QRIS
            </button>
          </div>
        </div>

        <!-- Card 2: Set Tagihan (Penerbitan Tagihan) -->
        <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-black text-slate-800">Penerbitan Tagihan Iuran</p>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold text-[#E37434] bg-[#FFE2AF]">
                Tarif & Terbit
              </span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
              Terapkan tarif iuran rutin bulanan warga atau terbitkan tagihan sekali bayar.
            </p>
          </div>
          <div class="pt-2 border-t border-slate-200/60">
            <button
              type="button"
              @click="$emit('openBillModal')"
              class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white font-black text-xs shadow-[2px_2px_6px_rgba(227,116,52,0.3)] active:shadow-[inset_1px_1px_3px_rgba(150,55,10,0.5)] hover:brightness-105 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Set Tagihan Iuran</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Khusus Pengurus: Pembayaran yang Perlu Dikonfirmasi & Rekap Warga -->
    <div
      v-if="isPengurus"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border p-5 sm:p-6 space-y-4 transition-all"
      :class="pendingVerificationCount > 0 ? 'border-amber-300 shadow-[8px_8px_20px_rgba(227,116,52,0.12)]' : 'border-white/80'"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-3 flex-wrap">
        <div class="flex items-center space-x-2.5">
          <span
            v-if="pendingVerificationCount > 0"
            class="w-2.5 h-2.5 rounded-full bg-[#E37434] animate-ping"
          ></span>
          <div>
            <h4 class="font-black text-sm uppercase tracking-wider text-slate-800">
              Konfirmasi Pembayaran & Rekap Warga
            </h4>
            <p class="text-[11px] text-slate-500 font-medium">
              Verifikasi bukti transfer masuk dan pantau rekap status iuran seluruh warga
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2.5 flex-wrap">
          <button
            type="button"
            @click="$emit('openAllBills')"
            class="px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[#007979] font-black text-xs shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:bg-white/60 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Buka rekap tagihan seluruh warga grup"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Rekap Tagihan Warga</span>
          </button>

          <span
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff]"
            :class="pendingVerificationCount > 0 ? 'bg-[#FFE2AF] text-[#E37434] font-black' : 'bg-[#eaf0f7] text-slate-600'"
          >
            {{ pendingVerificationCount }} Menunggu
          </span>
        </div>
      </div>

      <!-- Jika tidak ada pembayaran yang pending -->
      <div v-if="pendingVerificationCount === 0" class="p-6 rounded-2xl bg-white/40 text-center text-slate-500 text-xs font-semibold">
        Tidak ada pembayaran warga yang perlu dikonfirmasi saat ini. Semua transaksi sudah tuntas diverifikasi.
      </div>

      <!-- Jika ada pembayaran yang pending -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div
          v-for="b in pendingVerificationBills"
          :key="b.id"
          class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] border border-white/80 flex items-center justify-between gap-3"
        >
          <div class="flex items-center space-x-3 min-w-0">
            <div
              v-if="b.payments?.[0]?.proofImageUrl"
              @click="$emit('openVerify', b)"
              class="w-12 h-12 rounded-xl bg-white p-1 shadow-inner border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              title="Klik untuk periksa bukti"
            >
              <img
                :src="b.payments[0].proofImageUrl"
                alt="Bukti Transfer"
                class="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-1.5 flex-wrap">
                <span class="font-black text-sm text-slate-800 truncate">
                  {{ b.unit?.name || b.member?.user?.fullName || 'Warga' }}
                </span>
                <span class="px-1.5 py-0.2 rounded-md bg-[#007979]/10 text-[#007979] font-bold text-[10px]">
                  {{ b.payments?.[0]?.method === 'QRIS_DYNAMIC' ? 'QRIS' : 'Transfer' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {{ b.title }} • {{ b.period || 'Berjalan' }}
              </p>
              <div class="mt-1 text-xs font-black text-[#007979]">
                {{ formatRupiah(b.totalAmount) }}
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="$emit('openVerify', b)"
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white font-black text-xs shadow-[2px_2px_6px_rgba(0,121,121,0.35)] hover:brightness-105 active:scale-95 transition-all uppercase whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            Periksa & Konfirmasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
