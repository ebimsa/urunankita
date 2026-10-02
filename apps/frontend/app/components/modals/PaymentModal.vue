<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatRupiah } from '../../utils/formatters'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  isOpen: boolean
  bill: any
  paymentOptions: any
  detailLoading?: boolean
  submitting?: boolean
  error?: string | null
  success?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'submit',
    payload: {
      method: 'QRIS_DYNAMIC' | 'BANK_TRANSFER_MANUAL'
      proofImageUrl: string
      notes?: string
    },
  ): void
}>()

const toast = useToast()
const paymentMethodTab = ref<'QRIS' | 'BANK'>('QRIS')
const paymentProofImageUrl = ref<string | null>(null)
const paymentNotes = ref('')
const copiedAccount = ref(false)
const localError = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      paymentProofImageUrl.value = null
      paymentNotes.value = ''
      copiedAccount.value = false
      localError.value = null
    }
  },
)

watch(
  () => props.paymentOptions,
  (opts) => {
    if (opts) {
      if (opts.qris) {
        paymentMethodTab.value = 'QRIS'
      } else if (opts.bank) {
        paymentMethodTab.value = 'BANK'
      } else {
        paymentMethodTab.value = 'QRIS'
      }
    }
  },
  { immediate: true },
)

const copyAccountDetails = async (text?: string) => {
  if (!text) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copiedAccount.value = true
    toast.success('Detail transfer/rekening berhasil disalin!')
    setTimeout(() => {
      copiedAccount.value = false
    }, 2000)
  } catch (err) {
    toast.error('Gagal menyalin detail transfer')
    console.error('Failed to copy', err)
  }
}

const handleProofImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    localError.value = 'Ukuran bukti foto maksimal 5 MB'
    return
  }
  const reader = new FileReader()
  reader.onload = (uploadEvent) => {
    paymentProofImageUrl.value = uploadEvent.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeProofImage = () => {
  paymentProofImageUrl.value = null
}

const handleSubmit = () => {
  if (!paymentProofImageUrl.value) {
    localError.value = 'Harap unggah foto bukti transfer/pembayaran.'
    return
  }

  localError.value = null
  const method = paymentMethodTab.value === 'QRIS' ? 'QRIS_DYNAMIC' : 'BANK_TRANSFER_MANUAL'
  emit('submit', {
    method,
    proofImageUrl: paymentProofImageUrl.value,
    notes: paymentNotes.value.trim() || undefined,
  })
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
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#FFE2AF] text-[#E37434] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs"
              >
                Pembayaran Iuran
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Bayar Tagihan
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                {{ bill?.title }} • {{ bill?.period }}
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
            v-if="error || localError"
            class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
            {{ error || localError }}
          </div>
          <div
            v-if="success"
            class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-green-200 text-green-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-green-900 mb-0.5">Berhasil</span>
            {{ success }}
          </div>

          <div v-if="detailLoading" class="p-8 text-center text-slate-500 font-medium text-xs">
            Memuat detail tagihan dan metode transfer...
          </div>

          <form v-else @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Ringkasan Tagihan & Nominal -->
            <div
              class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-2"
            >
              <div class="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Unit / Anggota:</span>
                <span class="font-bold text-slate-800">
                  {{ bill?.unit?.name || bill?.member?.user?.fullName || 'Warga' }}
                </span>
              </div>
              <div v-if="bill?.items && bill.items.length > 0" class="pt-2 border-t border-slate-200/80 space-y-1">
                <div
                  v-for="item in bill.items"
                  :key="item.id"
                  class="flex items-center justify-between text-[11px] text-slate-500"
                >
                  <span>{{ item.name }}</span>
                  <span>{{ formatRupiah(item.amount) }}</span>
                </div>
              </div>
              <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">Total Tagihan:</span>
                <span class="text-lg font-black text-[#007979]">
                  {{ formatRupiah(bill?.totalAmount) }}
                </span>
              </div>
            </div>

            <!-- Pilihan Tab Metode Transfer jika keduanya tersedia -->
            <div
              v-if="paymentOptions?.qris && paymentOptions?.bank"
              class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
            >
              <button
                type="button"
                @click="paymentMethodTab = 'QRIS'"
                class="py-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer"
                :class="
                  paymentMethodTab === 'QRIS'
                    ? 'bg-[#007979] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                "
              >
                QRIS (Scan)
              </button>
              <button
                type="button"
                @click="paymentMethodTab = 'BANK'"
                class="py-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer"
                :class="
                  paymentMethodTab === 'BANK'
                    ? 'bg-[#007979] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                "
              >
                Transfer Rekening
              </button>
            </div>

            <!-- TAMPILAN 1: QRIS -->
            <div
              v-if="paymentMethodTab === 'QRIS' && paymentOptions?.qris"
              class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] border border-white/60 text-center space-y-3"
            >
              <div class="text-[11px] font-bold text-slate-600">
                Scan QRIS menggunakan Mobile Banking atau E-Wallet
              </div>
              <div class="p-3 rounded-2xl bg-white shadow-inner max-w-[210px] mx-auto border border-slate-200">
                <img
                  :src="paymentOptions.qris.imageUrl || paymentOptions.qris.qrDataUrl"
                  alt="QRIS Komunitas"
                  class="w-full h-auto object-contain rounded-xl"
                />
              </div>
              <div v-if="paymentOptions.qris.merchantName" class="text-xs font-black text-slate-800">
                {{ paymentOptions.qris.merchantName }}
              </div>
              <p class="text-[10px] text-slate-500 font-medium">
                Pastikan nominal transfer pas senilai
                <strong class="text-slate-800">{{ formatRupiah(bill?.totalAmount) }}</strong>
              </p>
            </div>

            <!-- TAMPILAN 2: TRANSFER REKENING / E-WALLET -->
            <div
              v-else-if="paymentMethodTab === 'BANK' && paymentOptions?.bank"
              class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] border border-white/60 space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">Tujuan Transfer Rekening:</span>
                <button
                  type="button"
                  @click="
                    copyAccountDetails(
                      paymentOptions.bank.accountDetails || paymentOptions.bank.accountNumber,
                    )
                  "
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#007979] text-[10px] font-black shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] transition-all cursor-pointer"
                >
                  {{ copiedAccount ? 'Tersalin!' : 'Salin Info' }}
                </button>
              </div>
              <div
                class="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed font-mono"
              >
                {{
                  paymentOptions.bank.accountDetails ||
                  `${paymentOptions.bank.bankName} ${paymentOptions.bank.accountNumber} a.n ${paymentOptions.bank.accountHolder}`
                }}
              </div>
            </div>

            <!-- NOTICE JIKA BELUM ADA METODE PEMBAYARAN -->
            <div
              v-else-if="!paymentOptions?.qris && !paymentOptions?.bank"
              class="p-4 rounded-2xl bg-slate-100 text-center text-xs font-semibold text-slate-600"
            >
              Pengurus belum menyetel rekening atau QRIS grup. Anda tetap dapat mengunggah bukti pembayaran jika telah transfer langsung.
            </div>

            <!-- FORM BUKTI PEMBAYARAN -->
            <div class="space-y-3 pt-1">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Unggah Bukti Transfer / Pembayaran <span class="text-[#E37434]">*</span>
                </label>
                <div
                  v-if="!paymentProofImageUrl"
                  class="p-4 rounded-2xl border-2 border-dashed border-slate-300 text-center bg-white/40"
                >
                  <label class="cursor-pointer flex flex-col items-center justify-center space-y-1">
                    <span class="text-xs font-bold text-[#007979]">Pilih Foto Bukti Transfer</span>
                    <span class="text-[10px] text-slate-400">Screenshot m-banking atau struk ATM (Maks 5 MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      @change="handleProofImageUpload"
                      class="hidden"
                    />
                  </label>
                </div>
                <div v-else class="text-center space-y-2">
                  <div
                    class="p-2 rounded-2xl bg-white shadow-inner max-w-[200px] mx-auto border border-slate-200"
                  >
                    <img
                      :src="paymentProofImageUrl"
                      alt="Bukti Transfer"
                      class="w-full h-auto max-h-40 object-contain rounded-xl"
                    />
                  </div>
                  <button
                    type="button"
                    @click="removeProofImage"
                    class="px-3 py-1 rounded-xl bg-[#eaf0f7] text-red-600 text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] cursor-pointer"
                  >
                    Hapus / Ganti Foto
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  v-model="paymentNotes"
                  type="text"
                  placeholder="Contoh: Transfer via BCA a.n Siti Aminah"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                />
              </div>

              <button
                type="submit"
                :disabled="submitting || !paymentProofImageUrl"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider cursor-pointer"
              >
                {{ submitting ? 'Mengirim Konfirmasi...' : 'Kirim Bukti Pembayaran' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
