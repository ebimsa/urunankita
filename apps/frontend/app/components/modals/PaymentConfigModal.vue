<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  config?: any
  loading?: boolean
  saving?: boolean
  error?: string | null
  success?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'save',
    payload: {
      qrisEnabled: boolean
      qrisImageUrl?: string
      merchantName?: string
      bankEnabled: boolean
      accountDetails?: string
    },
  ): void
}>()

const configQrisEnabled = ref(false)
const configQrisImageUrl = ref<string | null>(null)
const configMerchantName = ref('')
const configBankEnabled = ref(false)
const configAccountDetails = ref('')
const localError = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.config) {
      configQrisEnabled.value = props.config.qrisEnabled || false
      configQrisImageUrl.value = props.config.qrisImageUrl || null
      configMerchantName.value = props.config.merchantName || ''
      configBankEnabled.value = props.config.bankEnabled || false
      configAccountDetails.value = props.config.accountDetails || props.config.instructions || ''
      localError.value = null
    }
  },
)

watch(
  () => props.config,
  (cfg) => {
    if (cfg) {
      configQrisEnabled.value = cfg.qrisEnabled || false
      configQrisImageUrl.value = cfg.qrisImageUrl || null
      configMerchantName.value = cfg.merchantName || ''
      configBankEnabled.value = cfg.bankEnabled || false
      configAccountDetails.value = cfg.accountDetails || cfg.instructions || ''
    }
  },
  { deep: true },
)

const handleQrisImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    localError.value = 'Ukuran gambar QRIS maksimal 5 MB'
    return
  }
  const reader = new FileReader()
  reader.onload = (uploadEvent) => {
    configQrisImageUrl.value = uploadEvent.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeQrisImage = () => {
  configQrisImageUrl.value = null
}

const handleSave = () => {
  localError.value = null
  emit('save', {
    qrisEnabled: configQrisEnabled.value,
    qrisImageUrl: configQrisImageUrl.value || undefined,
    merchantName: configMerchantName.value.trim() || undefined,
    bankEnabled: configBankEnabled.value,
    accountDetails: configAccountDetails.value.trim() || undefined,
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
          class="relative w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800"
        >
          <div class="flex items-start justify-between">
            <div>
              <div
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#24B1B1]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs"
              >
                Pengaturan Transfer
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Tujuan Transfer Pembayaran
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Atur rekening bank atau upload gambar QRIS untuk tujuan pembayaran warga.
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

          <div v-if="loading" class="p-8 text-center text-slate-500 font-medium text-xs">
            Memuat pengaturan pembayaran...
          </div>

          <form v-else @submit.prevent="handleSave" class="space-y-4">
            <!-- OPSI 1: GAMBAR QRIS -->
            <div
              class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <input
                    id="enableQris"
                    v-model="configQrisEnabled"
                    type="checkbox"
                    class="w-4 h-4 rounded text-[#007979] focus:ring-[#007979] border-slate-300 cursor-pointer"
                  />
                  <label for="enableQris" class="text-xs font-black text-slate-800 cursor-pointer">
                    Aktifkan Pembayaran QRIS (Gambar)
                  </label>
                </div>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-white/70">
                  Scan Barcode
                </span>
              </div>

              <div v-if="configQrisEnabled" class="space-y-3 pt-2 border-t border-slate-200/60">
                <!-- Upload / Preview QRIS -->
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">
                    Foto / Gambar QRIS Bendahara
                  </label>

                  <div
                    v-if="!configQrisImageUrl"
                    class="text-center p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-white/40"
                  >
                    <label class="cursor-pointer flex flex-col items-center justify-center space-y-1">
                      <span class="text-xs font-bold text-[#007979]">Pilih Gambar QRIS</span>
                      <span class="text-[10px] text-slate-400">Format PNG/JPG (Maks 5 MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        @change="handleQrisImageUpload"
                        class="hidden"
                      />
                    </label>
                  </div>

                  <div v-else class="text-center space-y-2">
                    <div
                      class="p-2 rounded-2xl bg-white shadow-inner max-w-[200px] mx-auto border border-slate-200"
                    >
                      <img
                        :src="configQrisImageUrl"
                        alt="QRIS Preview"
                        class="w-full h-auto max-h-48 object-contain rounded-xl"
                      />
                    </div>
                    <div class="flex justify-center space-x-2">
                      <label
                        class="cursor-pointer px-3 py-1 rounded-xl bg-[#eaf0f7] text-[#007979] text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2]"
                      >
                        Ganti Gambar
                        <input
                          type="file"
                          accept="image/*"
                          @change="handleQrisImageUpload"
                          class="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        @click="removeQrisImage"
                        class="px-3 py-1 rounded-xl bg-[#eaf0f7] text-red-600 text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Nama Merchant / Usaha -->
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama Merchant di QRIS (Opsional)
                  </label>
                  <input
                    v-model="configMerchantName"
                    type="text"
                    placeholder="Contoh: KAS RT 04 / WARGA GRIYA"
                    class="w-full px-3.5 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                  />
                </div>
              </div>
            </div>

            <!-- OPSI 2: TEKS KETERANGAN REKENING -->
            <div
              class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <input
                    id="enableBank"
                    v-model="configBankEnabled"
                    type="checkbox"
                    class="w-4 h-4 rounded text-[#007979] focus:ring-[#007979] border-slate-300 cursor-pointer"
                  />
                  <label for="enableBank" class="text-xs font-black text-slate-800 cursor-pointer">
                    Aktifkan Transfer Rekening / E-Wallet (Teks)
                  </label>
                </div>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-white/70">
                  Salin No. Rek
                </span>
              </div>

              <div v-if="configBankEnabled" class="space-y-2 pt-2 border-t border-slate-200/60">
                <label class="block text-[11px] font-bold text-slate-600">
                  Keterangan Nomor Rekening / E-Wallet
                </label>
                <textarea
                  v-model="configAccountDetails"
                  rows="3"
                  placeholder="Contoh:&#10;BCA: 5220-3918-23 a.n Budi Pratama (Kas RT)&#10;Bisa juga transfer ke GoPay: 0812-3456-7890"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979] resize-none"
                ></textarea>
                <p class="text-[10px] text-slate-500 font-medium">
                  Keterangan ini akan langsung tampil di layar warga dengan tombol salin otomatis.
                </p>
              </div>
            </div>

            <!-- Tombol Simpan -->
            <button
              type="submit"
              :disabled="saving"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider cursor-pointer"
            >
              {{ saving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Pembayaran' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
