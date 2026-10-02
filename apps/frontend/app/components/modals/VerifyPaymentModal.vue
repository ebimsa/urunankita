<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatRupiah } from '../../utils/formatters'

const props = defineProps<{
  isOpen: boolean
  bill: any
  loading?: boolean
  error?: string | null
  success?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'approve'): void
  (e: 'reject', notes: string): void
}>()

const verifyRejectNotes = ref('')
const showRejectInput = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      verifyRejectNotes.value = ''
      showRejectInput.value = false
    }
  },
)

const handleReject = () => {
  emit('reject', verifyRejectNotes.value.trim())
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
          class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800"
        >
          <div class="flex items-start justify-between">
            <div>
              <div
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1 shadow-xs"
              >
                Verifikasi Kas Masuk
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Periksa Bukti Pembayaran
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Cocokkan mutasi kas masuk dengan bukti transfer yang diunggah warga.
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

          <!-- Pesan Error / Sukses -->
          <div
            v-if="error"
            class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
            {{ error }}
          </div>
          <div
            v-if="success"
            class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-green-200 text-green-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-green-900 mb-0.5">Berhasil</span>
            {{ success }}
          </div>

          <!-- Detail Data Tagihan & Warga -->
          <div
            class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-2 text-xs"
          >
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Warga / Unit:</span>
              <span class="font-bold text-slate-800">
                {{ bill?.unit?.name || bill?.member?.user?.fullName || 'Warga' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Tagihan:</span>
              <span class="font-bold text-slate-800">
                {{ bill?.title }} ({{ bill?.period }})
              </span>
            </div>
            <div class="flex justify-between pt-1 border-t border-slate-200">
              <span class="text-slate-700 font-bold">Nominal:</span>
              <span class="font-black text-[#007979] text-sm">
                {{ formatRupiah(bill?.totalAmount) }}
              </span>
            </div>
            <div v-if="bill?.payments?.[0]?.notes" class="pt-1 border-t border-slate-200">
              <span class="text-slate-500 block font-medium">Catatan Warga:</span>
              <span class="italic text-slate-700">{{ bill.payments[0].notes }}</span>
            </div>
          </div>

          <!-- Foto Bukti Transfer -->
          <div class="space-y-2 text-center">
            <span class="block text-xs font-bold text-slate-700 text-left">Foto Bukti Transfer:</span>
            <div
              v-if="bill?.payments?.[0]?.proofImageUrl"
              class="p-2 rounded-2xl bg-white shadow-inner max-w-[260px] mx-auto border border-slate-200"
            >
              <img
                :src="bill.payments[0].proofImageUrl"
                alt="Bukti Transfer Warga"
                class="w-full h-auto max-h-56 object-contain rounded-xl"
              />
            </div>
            <div v-else class="p-6 rounded-2xl bg-white/50 text-slate-400 text-xs italic">
              Tidak ada lampiran foto bukti.
            </div>
          </div>

          <!-- Form Penolakan (Jika diklik tolak) -->
          <div v-if="showRejectInput" class="space-y-2 pt-2 border-t border-slate-200">
            <label class="block text-xs font-bold text-red-700">
              Alasan Penolakan (akan dibaca oleh warga):
            </label>
            <textarea
              v-model="verifyRejectNotes"
              rows="2"
              placeholder="Contoh: Bukti transfer buram / nominal tidak sesuai"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
            <div class="flex space-x-2">
              <button
                type="button"
                @click="handleReject"
                :disabled="loading"
                class="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
              <button
                type="button"
                @click="showRejectInput = false"
                class="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>

          <!-- Tombol Aksi Utama -->
          <div v-else class="space-y-2 pt-1">
            <button
              type="button"
              @click="$emit('approve')"
              :disabled="loading"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider cursor-pointer"
            >
              {{ loading ? 'Memproses...' : 'Setujui Pembayaran (Lunas)' }}
            </button>

            <button
              type="button"
              @click="showRejectInput = true"
              :disabled="loading"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 text-center transition-colors cursor-pointer"
            >
              Tolak Pembayaran Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
