<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatNumberWithDots } from '../../utils/formatters'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    initialType?: 'EXPENSE' | 'INCOME'
    loading?: boolean
    error?: string | null
    success?: string | null
  }>(),
  {
    initialType: 'EXPENSE',
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'submit',
    payload: {
      type: 'EXPENSE' | 'INCOME'
      amount: number
      category: string
      description: string
      entryDate?: string
    },
  ): void
}>()

const expenseCategories = [
  'Biaya Operasional',
  'Honor Satpam & Kebersihan',
  'Perbaikan & Pemeliharaan',
  'Sarana & Prasarana',
  'Konsumsi & Acara',
  'Lain-lain',
]

const incomeCategories = [
  'Iuran Sukarela',
  'Donasi Warga',
  'Sisa Kas Periode Lalu',
  'Sewa Lapangan / Fasilitas',
  'Dana Bantuan / Hibah',
  'Lain-lain',
]

const ledgerType = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const ledgerAmount = ref<number | null>(null)
const ledgerAmountFormatted = ref('')
const ledgerCategory = ref('')
const ledgerDescription = ref('')
const ledgerEntryDate = ref(new Date().toISOString().split('T')[0])
const localError = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      ledgerType.value = props.initialType || 'EXPENSE'
      ledgerAmount.value = null
      ledgerAmountFormatted.value = ''
      ledgerCategory.value =
        ledgerType.value === 'EXPENSE' ? expenseCategories[0] : incomeCategories[0]
      ledgerDescription.value = ''
      ledgerEntryDate.value = new Date().toISOString().split('T')[0]
      localError.value = null
    }
  },
)

const handleLedgerAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const rawValue = input.value.replace(/\D/g, '')
  if (!rawValue) {
    ledgerAmount.value = null
    ledgerAmountFormatted.value = ''
    input.value = ''
    return
  }
  const numericVal = parseInt(rawValue, 10)
  ledgerAmount.value = numericVal
  const formatted = formatNumberWithDots(numericVal)
  ledgerAmountFormatted.value = formatted
  input.value = formatted
}

const handleSubmit = () => {
  if (!ledgerAmount.value || ledgerAmount.value <= 0) {
    localError.value = 'Nominal transaksi harus lebih dari Rp 0.'
    return
  }
  if (!ledgerCategory.value.trim()) {
    localError.value = 'Kategori transaksi wajib diisi.'
    return
  }
  if (!ledgerDescription.value.trim()) {
    localError.value = 'Keterangan transaksi wajib diisi.'
    return
  }

  localError.value = null
  emit('submit', {
    type: ledgerType.value,
    amount: Math.round(Number(ledgerAmount.value)),
    category: ledgerCategory.value.trim(),
    description: ledgerDescription.value.trim(),
    entryDate: ledgerEntryDate.value ? new Date(ledgerEntryDate.value).toISOString() : undefined,
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

      <div class="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          class="relative w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-5 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-4 text-slate-800 my-8"
        >
          <!-- Modal Header -->
          <div class="flex items-start justify-between">
            <div>
              <div
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/10 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1 shadow-xs"
              >
                Pengurus Grup
              </div>
              <h3 class="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Catat Mutasi Kas
              </h3>
              <p class="text-xs text-slate-500 font-medium">
                Catat transaksi pengeluaran operasional atau pemasukan kas grup.
              </p>
            </div>
            <button
              type="button"
              @click="$emit('close')"
              class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Error & Success Alert -->
          <div
            v-if="error || localError"
            class="p-3 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
            {{ error || localError }}
          </div>
          <div
            v-if="success"
            class="p-3 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-emerald-900 mb-0.5">Sukses</span>
            {{ success }}
          </div>

          <!-- Form Body -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- 1. Tipe Transaksi: Pengeluaran vs Pemasukan -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Transaksi Kas
              </label>
              <div
                class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cbd7e5,inset_-2px_-2px_5px_#ffffff]"
              >
                <button
                  type="button"
                  @click="
                    ledgerType = 'EXPENSE';
                    ledgerCategory = expenseCategories[0]
                  "
                  class="py-2.5 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer"
                  :class="
                    ledgerType === 'EXPENSE'
                      ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white shadow-[0_2px_8px_rgba(227,116,52,0.35)]'
                      : 'text-slate-600 hover:text-slate-900'
                  "
                >
                  Pengeluaran (Kas Keluar)
                </button>
                <button
                  type="button"
                  @click="
                    ledgerType = 'INCOME';
                    ledgerCategory = incomeCategories[0]
                  "
                  class="py-2.5 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer"
                  :class="
                    ledgerType === 'INCOME'
                      ? 'bg-gradient-to-r from-[#007979] to-[#005a5a] text-white shadow-[0_2px_8px_rgba(0,121,121,0.35)]'
                      : 'text-slate-600 hover:text-slate-900'
                  "
                >
                  Pemasukan (Kas Masuk)
                </button>
              </div>
            </div>

            <!-- 2. Nominal dan Tanggal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Transaksi
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    :value="ledgerAmountFormatted"
                    @input="handleLedgerAmountInput"
                    type="text"
                    inputmode="numeric"
                    required
                    placeholder="0"
                    class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-black shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979] font-mono"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  v-model="ledgerEntryDate"
                  type="date"
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                />
              </div>
            </div>

            <!-- 3. Kategori Transaksi -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Kategori Transaksi
              </label>
              <!-- Preset pills -->
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="cat in ledgerType === 'EXPENSE' ? expenseCategories : incomeCategories"
                  :key="cat"
                  type="button"
                  @click="ledgerCategory = cat"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  :class="
                    ledgerCategory === cat
                      ? ledgerType === 'EXPENSE'
                        ? 'bg-[#E37434] text-white shadow-xs'
                        : 'bg-[#007979] text-white shadow-xs'
                      : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] hover:text-slate-900'
                  "
                >
                  {{ cat }}
                </button>
              </div>
              <!-- Input custom -->
              <input
                v-model="ledgerCategory"
                type="text"
                required
                placeholder="Ketik kategori..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              />
            </div>

            <!-- 4. Keterangan / Deskripsi -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Keterangan / Rincian
              </label>
              <textarea
                v-model="ledgerDescription"
                rows="2"
                required
                placeholder="Contoh: Pembelian 3 lampu jalan gang 2 dan kabel instalasi"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979] resize-none"
              ></textarea>
            </div>

            <!-- Tombol Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2 cursor-pointer"
              :class="
                ledgerType === 'EXPENSE'
                  ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)]'
                  : 'bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)]'
              "
            >
              {{
                loading
                  ? 'Menyimpan Catatan...'
                  : ledgerType === 'EXPENSE'
                    ? 'Simpan Pengeluaran Kas'
                    : 'Simpan Pemasukan Kas'
              }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
