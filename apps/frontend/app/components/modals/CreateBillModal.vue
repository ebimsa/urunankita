<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatRupiah, formatNumberWithDots } from '../../utils/formatters'

const props = defineProps<{
  isOpen: boolean
  groupType: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'
  units: any[]
  members: any[]
  loading?: boolean
  error?: string | null
  success?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'submitRecurring',
    payload: {
      title: string
      frequency: 'MONTHLY' | 'YEARLY'
      items: Array<{ name: string; amount: number }>
    },
  ): void
  (
    e: 'submitOnce',
    payload: {
      title: string
      periodLabel: string
      applyToAll: boolean
      unitId?: string
      memberId?: string
      items: Array<{ name: string; amount: number }>
    },
  ): void
}>()

const billMode = ref<'RECURRING' | 'ONCE'>('RECURRING')
const localError = ref<string | null>(null)

// 1. State Mode Iuran Rutin
const recurringFrequency = ref<'MONTHLY' | 'YEARLY'>('MONTHLY')
const recurringTitle = ref('Iuran Kas & Kebersihan Lingkungan')
const recurringItems = ref<Array<{ name: string; amount: number }>>([
  { name: 'Kebersihan & Pengangkutan Sampah', amount: 35000 },
  { name: 'Keamanan Lingkungan & Satpam', amount: 45000 },
])

const recurringTotalAmount = computed(() => {
  return recurringItems.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

const addRecurringItem = () => {
  recurringItems.value.push({ name: '', amount: 0 })
}

const removeRecurringItem = (idx: number) => {
  if (recurringItems.value.length > 1) {
    recurringItems.value.splice(idx, 1)
  }
}

const handleRecurringAmountInput = (e: Event, item: { name: string; amount: number }) => {
  const input = e.target as HTMLInputElement
  const rawValue = input.value.replace(/\D/g, '')
  if (!rawValue) {
    item.amount = 0
    input.value = ''
    return
  }
  const numericVal = parseInt(rawValue, 10)
  item.amount = numericVal
  input.value = formatNumberWithDots(numericVal)
}

const applyRecurringPreset = (type: 'RT' | 'KOST' | 'PAGUYUBAN') => {
  if (type === 'RT') {
    recurringFrequency.value = 'MONTHLY'
    recurringTitle.value = 'Iuran Kas & Kebersihan Lingkungan'
    recurringItems.value = [
      { name: 'Kebersihan & Sampah', amount: 35000 },
      { name: 'Keamanan & Satpam', amount: 45000 },
      { name: 'Kas Sosial Warga', amount: 20000 },
    ]
  } else if (type === 'KOST') {
    recurringFrequency.value = 'MONTHLY'
    recurringTitle.value = 'Iuran Sewa Kost & Fasilitas'
    recurringItems.value = [
      { name: 'Sewa Kamar', amount: 850000 },
      { name: 'Wi-Fi & Listrik Standar', amount: 150000 },
    ]
  } else if (type === 'PAGUYUBAN') {
    recurringFrequency.value = 'MONTHLY'
    recurringTitle.value = 'Iuran Kas Komunitas'
    recurringItems.value = [{ name: 'Kas Bulanan Wajib Anggota', amount: 50000 }]
  }
}

// 2. State Mode Sekali Bayar
const onceTitle = ref('Patungan Pengadaan CCTV & Portal Otomatis')
const oncePeriodLabel = ref('Sekali Bayar / Proyek CCTV')
const onceTargetType = ref<'ALL' | 'SINGLE'>('ALL')
const onceTargetUnitId = ref('')
const onceTargetMemberId = ref('')
const onceItems = ref<Array<{ name: string; amount: number }>>([
  { name: 'Biaya Unit Kamera CCTV & NVR', amount: 65000 },
  { name: 'Instalasi & Tiang Kabel', amount: 35000 },
])

const onceTotalAmount = computed(() => {
  return onceItems.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

const addOnceItem = () => {
  onceItems.value.push({ name: '', amount: 0 })
}

const removeOnceItem = (idx: number) => {
  if (onceItems.value.length > 1) {
    onceItems.value.splice(idx, 1)
  }
}

const handleOnceAmountInput = (e: Event, item: { name: string; amount: number }) => {
  const input = e.target as HTMLInputElement
  const rawValue = input.value.replace(/\D/g, '')
  if (!rawValue) {
    item.amount = 0
    input.value = ''
    return
  }
  const numericVal = parseInt(rawValue, 10)
  item.amount = numericVal
  input.value = formatNumberWithDots(numericVal)
}

const applyOncePreset = (type: 'CCTV' | 'EVENT' | 'REGISTRASI') => {
  if (type === 'CCTV') {
    onceTitle.value = 'Patungan Pengadaan CCTV & Portal Otomatis'
    oncePeriodLabel.value = 'Sekali Bayar / Proyek CCTV'
    onceTargetType.value = 'ALL'
    onceItems.value = [
      { name: 'Biaya Unit Kamera CCTV & NVR', amount: 65000 },
      { name: 'Instalasi & Tiang Kabel', amount: 35000 },
    ]
  } else if (type === 'EVENT') {
    onceTitle.value = 'Iuran Kegiatan Peringatan HUT RI 17 Agustus'
    oncePeriodLabel.value = 'Insidental / Perayaan 17 Agustus'
    onceTargetType.value = 'ALL'
    onceItems.value = [
      { name: 'Hadiah Lomba & Panggung Warga', amount: 35000 },
      { name: 'Konsumsi & Doorprize', amount: 25000 },
    ]
  } else if (type === 'REGISTRASI') {
    onceTitle.value = 'Uang Registrasi / Pangkal Anggota Baru'
    oncePeriodLabel.value = 'Sekali Bayar / Pendaftaran'
    onceTargetType.value = 'SINGLE'
    onceItems.value = [
      { name: 'Uang Pangkal / Pendaftaran', amount: 100000 },
      { name: 'Seragam / Kartu Tanda Anggota', amount: 50000 },
    ]
  }
}

// Inisialisasi target unit/member saat modal dibuka
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      localError.value = null
      if (props.units.length > 0 && !onceTargetUnitId.value) {
        onceTargetUnitId.value = props.units[0].id
      }
      if (props.members.length > 0 && !onceTargetMemberId.value) {
        onceTargetMemberId.value = props.members[0].id
      }
    }
  },
)

const handleSaveRecurringRule = () => {
  if (!recurringTitle.value.trim()) {
    localError.value = 'Judul iuran rutin wajib diisi.'
    return
  }

  if (recurringItems.value.length === 0 || recurringTotalAmount.value <= 0) {
    localError.value = 'Minimal harus ada 1 komponen biaya dengan nominal lebih dari Rp 0.'
    return
  }

  for (const item of recurringItems.value) {
    if (!item.name.trim()) {
      localError.value = 'Nama tiap komponen biaya wajib diisi.'
      return
    }
  }

  localError.value = null
  emit('submitRecurring', {
    title: recurringTitle.value.trim(),
    frequency: recurringFrequency.value,
    items: recurringItems.value.map((i) => ({
      name: i.name.trim(),
      amount: Number(i.amount),
    })),
  })
}

const handleCreateOnceBill = () => {
  if (!onceTitle.value.trim()) {
    localError.value = 'Judul tagihan insidental wajib diisi.'
    return
  }

  if (onceItems.value.length === 0 || onceTotalAmount.value <= 0) {
    localError.value = 'Minimal harus ada 1 komponen biaya dengan nominal lebih dari Rp 0.'
    return
  }

  for (const item of onceItems.value) {
    if (!item.name.trim()) {
      localError.value = 'Nama tiap komponen biaya wajib diisi.'
      return
    }
  }

  localError.value = null
  const isMassal = onceTargetType.value === 'ALL'
  const targetUnitId =
    !isMassal && props.groupType === 'PHYSICAL_UNIT' ? onceTargetUnitId.value : undefined
  const targetMemberId =
    !isMassal && props.groupType === 'DIRECT_MEMBER' ? onceTargetMemberId.value : undefined

  emit('submitOnce', {
    title: onceTitle.value.trim(),
    periodLabel: oncePeriodLabel.value.trim() || 'Sekali Bayar',
    applyToAll: isMassal,
    unitId: targetUnitId,
    memberId: targetMemberId,
    items: onceItems.value.map((i) => ({
      name: i.name.trim(),
      amount: Number(i.amount),
    })),
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
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#E37434]/15 text-[#E37434] text-[10px] font-black tracking-wider uppercase mb-1 shadow-xs"
              >
                Pengurus Komunitas
              </div>
              <h3 class="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Set & Terbitkan Tagihan Baru
              </h3>
              <p class="text-xs text-slate-500 font-medium">
                Atur kewajiban kas bulanan, tahunan, atau sekali bayar (insidental).
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

          <!-- TAB NAVIGATOR: Mode Iuran Rutin vs Sekali Bayar -->
          <div
            class="grid grid-cols-2 p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cbd7e5,inset_-2px_-2px_5px_#ffffff]"
          >
            <button
              type="button"
              @click="billMode = 'RECURRING'"
              class="py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              :class="
                billMode === 'RECURRING'
                  ? 'bg-gradient-to-r from-[#007979] to-[#24B1B1] text-white shadow-[2px_2px_6px_rgba(0,121,121,0.35)]'
                  : 'text-slate-600 hover:text-[#007979]'
              "
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Iuran Rutin (Akumulatif)</span>
            </button>
            <button
              type="button"
              @click="billMode = 'ONCE'"
              class="py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              :class="
                billMode === 'ONCE'
                  ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white shadow-[2px_2px_6px_rgba(227,116,52,0.35)]'
                  : 'text-slate-600 hover:text-[#E37434]'
              "
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Sekali Bayar (Insidental)</span>
            </button>
          </div>

          <!-- ============================================== -->
          <!-- 1. FORM MODE: IURAN RUTIN (AKUMULATIF)         -->
          <!-- ============================================== -->
          <form v-if="billMode === 'RECURRING'" @submit.prevent="handleSaveRecurringRule" class="space-y-4">
            <!-- Pilihan Template Cepat Rutin -->
            <div>
              <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Template Cepat:
              </span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  @click="applyRecurringPreset('RT')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all cursor-pointer"
                >
                  Iuran RT Standar
                </button>
                <button
                  type="button"
                  @click="applyRecurringPreset('KOST')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all cursor-pointer"
                >
                  Kost Mahasiswa
                </button>
                <button
                  type="button"
                  @click="applyRecurringPreset('PAGUYUBAN')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all cursor-pointer"
                >
                  Kas Paguyuban
                </button>
              </div>
            </div>

            <!-- Frekuensi Rutin: Bulanan vs Tahunan -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Frekuensi Siklus Iuran
              </label>
              <div
                class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#eaf0f7] shadow-[inset_1.5px_1.5px_3px_#cbd7e5,inset_-1.5px_-1.5px_3px_#ffffff]"
              >
                <button
                  type="button"
                  @click="recurringFrequency = 'MONTHLY'"
                  class="py-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer"
                  :class="
                    recurringFrequency === 'MONTHLY'
                      ? 'bg-white text-[#007979] shadow-[1.5px_1.5px_4px_#cad5e2]'
                      : 'text-slate-600'
                  "
                >
                  Bulanan (Tiap Bulan)
                </button>
                <button
                  type="button"
                  @click="recurringFrequency = 'YEARLY'"
                  class="py-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer"
                  :class="
                    recurringFrequency === 'YEARLY'
                      ? 'bg-white text-[#007979] shadow-[1.5px_1.5px_4px_#cad5e2]'
                      : 'text-slate-600'
                  "
                >
                  Tahunan (Tiap Tahun)
                </button>
              </div>
            </div>

            <!-- Judul Iuran Rutin -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Nama / Judul Iuran Rutin
              </label>
              <input
                v-model="recurringTitle"
                type="text"
                placeholder="Contoh: Iuran Kas & Kebersihan Lingkungan"
                class="w-full px-4 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              />
            </div>

            <!-- Rincian Komponen Biaya Rutin -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">
                  Rincian Komponen Biaya (per {{ recurringFrequency === 'MONTHLY' ? 'Bulan' : 'Tahun' }})
                </label>
                <button
                  type="button"
                  @click="addRecurringItem"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#007979] font-black text-[11px] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center space-x-1 hover:text-[#24B1B1] cursor-pointer"
                >
                  <span>+ Tambah Komponen</span>
                </button>
              </div>

              <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                <div v-for="(item, idx) in recurringItems" :key="idx" class="flex items-center space-x-2">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Nama biaya (cth: Kebersihan)"
                    class="flex-1 px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] border border-white/60 focus:outline-none focus:ring-1 focus:ring-[#007979]"
                  />
                  <div class="w-32 relative">
                    <span class="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      :value="formatNumberWithDots(item.amount)"
                      @input="handleRecurringAmountInput($event, item)"
                      type="text"
                      inputmode="numeric"
                      placeholder="0"
                      class="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] border border-white/60 focus:outline-none focus:ring-1 focus:ring-[#007979] text-right font-mono"
                    />
                  </div>
                  <button
                    v-if="recurringItems.length > 1"
                    type="button"
                    @click="removeRecurringItem(idx)"
                    class="w-7 h-7 rounded-lg bg-[#eaf0f7] text-slate-400 hover:text-red-600 shadow-[2px_2px_4px_#cad5e2] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center text-xs shrink-0 cursor-pointer"
                    title="Hapus baris"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Total Nominal Rutin -->
              <div
                class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex items-center justify-between"
              >
                <span class="text-xs font-bold text-slate-600">
                  Total Tarif per {{ recurringFrequency === 'MONTHLY' ? 'Bulan' : 'Tahun' }}:
                </span>
                <span class="font-mono font-black text-sm text-[#007979]">
                  {{ formatRupiah(recurringTotalAmount) }}
                </span>
              </div>
            </div>

            <!-- Tombol Simpan Aturan Rutin -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,80,80,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2 cursor-pointer"
            >
              {{ loading ? 'Menerapkan Aturan...' : 'Terapkan Aturan Tarif Rutin' }}
            </button>
          </form>

          <!-- ============================================== -->
          <!-- 2. FORM MODE: SEKALI BAYAR (INSIDENTAL)        -->
          <!-- ============================================== -->
          <form v-else @submit.prevent="handleCreateOnceBill" class="space-y-4">
            <!-- Pilihan Template Cepat Sekali Bayar -->
            <div>
              <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Template Cepat:
              </span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  @click="applyOncePreset('CCTV')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all cursor-pointer"
                >
                  Patungan CCTV
                </button>
                <button
                  type="button"
                  @click="applyOncePreset('EVENT')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all cursor-pointer"
                >
                  Acara 17 Agustus
                </button>
                <button
                  type="button"
                  @click="applyOncePreset('REGISTRASI')"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all cursor-pointer"
                >
                  Uang Registrasi
                </button>
              </div>
            </div>

            <!-- Judul Tagihan Insidental -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Judul Kegiatan / Proyek
              </label>
              <input
                v-model="onceTitle"
                type="text"
                placeholder="Contoh: Patungan Pengadaan CCTV & Portal Otomatis"
                class="w-full px-4 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#E37434]"
              />
            </div>

            <!-- Target Penerbitan (Massal vs Satuan) -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Target Penerbitan
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="onceTargetType = 'ALL'"
                  class="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                  :class="
                    onceTargetType === 'ALL'
                      ? 'bg-white border-[#E37434] shadow-[2px_2px_6px_rgba(227,116,52,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_1px_1px_3px_#cbd7e5]'
                  "
                >
                  <span
                    class="block text-xs font-black"
                    :class="onceTargetType === 'ALL' ? 'text-[#E37434]' : 'text-slate-700'"
                  >
                    Massal (Seluruh {{ groupType === 'PHYSICAL_UNIT' ? 'Unit' : 'Warga' }})
                  </span>
                  <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                    Diterbitkan ke semua warga grup
                  </span>
                </button>

                <button
                  type="button"
                  @click="onceTargetType = 'SINGLE'"
                  class="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                  :class="
                    onceTargetType === 'SINGLE'
                      ? 'bg-white border-[#E37434] shadow-[2px_2px_6px_rgba(227,116,52,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_1px_1px_3px_#cbd7e5]'
                  "
                >
                  <span
                    class="block text-xs font-black"
                    :class="onceTargetType === 'SINGLE' ? 'text-[#E37434]' : 'text-slate-700'"
                  >
                    Satuan (1 {{ groupType === 'PHYSICAL_UNIT' ? 'Unit' : 'Orang' }})
                  </span>
                  <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                    Khusus 1 unit / anggota tertentu
                  </span>
                </button>
              </div>

              <!-- Dropdown Pilih 1 Target jika memilih Satuan -->
              <div v-if="onceTargetType === 'SINGLE'" class="mt-2.5 animate-fadeIn">
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Pilih {{ groupType === 'PHYSICAL_UNIT' ? 'Unit Hunian' : 'Anggota' }} Tujuan:
                </label>
                <select
                  v-if="groupType === 'PHYSICAL_UNIT'"
                  v-model="onceTargetUnitId"
                  class="w-full px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#E37434]"
                >
                  <option v-for="u in units" :key="u.id" :value="u.id">
                    {{ u.name }} {{ u.description ? `(${u.description})` : '' }}
                  </option>
                </select>
                <select
                  v-else
                  v-model="onceTargetMemberId"
                  class="w-full px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#E37434]"
                >
                  <option v-for="m in members" :key="m.id" :value="m.id">
                    {{ m.user?.fullName }} ({{ m.role }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Rincian Komponen Biaya Sekali Bayar -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">
                  Rincian Komponen Biaya
                </label>
                <button
                  type="button"
                  @click="addOnceItem"
                  class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#E37434] font-black text-[11px] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center space-x-1 hover:text-[#e87b38] cursor-pointer"
                >
                  <span>+ Tambah Komponen</span>
                </button>
              </div>

              <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                <div v-for="(item, idx) in onceItems" :key="idx" class="flex items-center space-x-2">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Nama biaya (cth: Kamera CCTV)"
                    class="flex-1 px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] border border-white/60 focus:outline-none focus:ring-1 focus:ring-[#E37434]"
                  />
                  <div class="w-32 relative">
                    <span class="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      :value="formatNumberWithDots(item.amount)"
                      @input="handleOnceAmountInput($event, item)"
                      type="text"
                      inputmode="numeric"
                      placeholder="0"
                      class="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] border border-white/60 focus:outline-none focus:ring-1 focus:ring-[#E37434] text-right font-mono"
                    />
                  </div>
                  <button
                    v-if="onceItems.length > 1"
                    type="button"
                    @click="removeOnceItem(idx)"
                    class="w-7 h-7 rounded-lg bg-[#eaf0f7] text-slate-400 hover:text-red-600 shadow-[2px_2px_4px_#cad5e2] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center text-xs shrink-0 cursor-pointer"
                    title="Hapus baris"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Total Nominal Sekali Bayar -->
              <div
                class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex items-center justify-between"
              >
                <span class="text-xs font-bold text-slate-600">Total Nominal per Lembar:</span>
                <span class="font-mono font-black text-sm text-[#E37434]">
                  {{ formatRupiah(onceTotalAmount) }}
                </span>
              </div>
            </div>

            <!-- Tombol Terbitkan Sekali Bayar -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2 cursor-pointer"
            >
              {{ loading ? 'Menerbitkan Tagihan...' : 'Terbitkan Tagihan Sekali Bayar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
