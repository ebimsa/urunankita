<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  activeMembership: any
  isPengurus: boolean
  units: any[]
  unitsLoading: boolean
  unitsError: string | null
}>()

const emit = defineEmits<{
  (e: 'goToDashboard'): void
  (e: 'refreshUnits'): void
  (e: 'createUnit', payload: { name: string; description?: string }): void
  (e: 'createUnitsBulk', payload: { names: string[] }): void
  (e: 'deleteUnit', unitId: string): void
}>()

// Filter & Search
const unitSearchQuery = ref('')
const unitStatusFilter = ref<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL')

// Modals
const isSingleModalOpen = ref(false)
const isBulkModalOpen = ref(false)

// Single Unit Form
const singleName = ref('')
const singleDescription = ref('')
const singleSubmitting = ref(false)
const singleError = ref<string | null>(null)

// Bulk Unit Form
const bulkMode = ref<'RANGE' | 'MANUAL'>('RANGE')
const bulkPrefix = ref('Blok ')
const bulkStart = ref(1)
const bulkEnd = ref(10)
const bulkPadZero = ref(true)
const bulkManualText = ref('')
const bulkSubmitting = ref(false)
const bulkError = ref<string | null>(null)

// Deletion State
const deletingUnitId = ref<string | null>(null)

// Stats
const totalUnitsCount = computed(() => props.units.length)
const occupiedUnitsCount = computed(() => {
  return props.units.filter((u: any) => u.occupants && u.occupants.length > 0).length
})
const vacantUnitsCount = computed(() => {
  return totalUnitsCount.value - occupiedUnitsCount.value
})

// Filtered Units
const filteredUnits = computed(() => {
  return props.units.filter((u: any) => {
    const isOccupied = u.occupants && u.occupants.length > 0

    if (unitStatusFilter.value === 'OCCUPIED' && !isOccupied) return false
    if (unitStatusFilter.value === 'VACANT' && isOccupied) return false

    const q = unitSearchQuery.value.trim().toLowerCase()
    if (!q) return true

    const nameMatch = u.name.toLowerCase().includes(q)
    const descMatch = u.description && u.description.toLowerCase().includes(q)
    const occupantMatch = u.occupants?.some(
      (occ: any) =>
        occ.user?.fullName?.toLowerCase().includes(q) ||
        occ.user?.phone?.toLowerCase().includes(q)
    )

    return nameMatch || descMatch || occupantMatch
  })
})

// Bulk Generated List Preview
const previewBulkNames = computed(() => {
  if (bulkMode.value === 'RANGE') {
    const start = Math.min(bulkStart.value, bulkEnd.value)
    const end = Math.max(bulkStart.value, bulkEnd.value)
    if (end - start > 100) return [] // Batas maksimal 100 unit sekali generate

    const result: string[] = []
    for (let i = start; i <= end; i++) {
      const numStr = bulkPadZero.value && i < 10 ? `0${i}` : `${i}`
      result.push(`${bulkPrefix.value}${numStr}`.trim())
    }
    return result
  } else {
    return bulkManualText.value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
})

// Handlers
const submitSingleUnit = async () => {
  if (!singleName.value.trim()) {
    singleError.value = 'Nama unit tidak boleh kosong'
    return
  }

  singleSubmitting.value = true
  singleError.value = null

  try {
    emit('createUnit', {
      name: singleName.value.trim(),
      description: singleDescription.value.trim() || undefined,
    })
    singleName.value = ''
    singleDescription.value = ''
    isSingleModalOpen.value = false
  } catch (err: any) {
    singleError.value = err.message || 'Gagal menambahkan unit'
  } finally {
    singleSubmitting.value = false
  }
}

const submitBulkUnits = async () => {
  const names = previewBulkNames.value
  if (names.length === 0) {
    bulkError.value = 'Daftar nama unit masih kosong'
    return
  }

  bulkSubmitting.value = true
  bulkError.value = null

  try {
    emit('createUnitsBulk', { names })
    bulkManualText.value = ''
    isBulkModalOpen.value = false
  } catch (err: any) {
    bulkError.value = err.message || 'Gagal menambahkan unit massal'
  } finally {
    bulkSubmitting.value = false
  }
}

const handleDeleteUnit = (unit: any) => {
  if (unit.occupants && unit.occupants.length > 0) {
    alert(`Unit "${unit.name}" masih berpenghuni. Pindahkan atau keluarkan warga terlebih dahulu.`)
    return
  }

  const confirmed = confirm(`Yakin ingin menghapus unit "${unit.name}"?`)
  if (!confirmed) return

  deletingUnitId.value = unit.id
  emit('deleteUnit', unit.id)
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
          Kelola Unit Hunian & Kavling
        </h3>
        <p class="text-xs text-slate-500 font-medium">
          Daftar rumah, kavling, atau kamar kost pada komunitas {{ activeMembership?.group.name }}
        </p>
      </div>

      <!-- Action Buttons (Khusus Pengurus) -->
      <div v-if="isPengurus" class="flex items-center space-x-2.5 flex-wrap">
        <button
          type="button"
          @click="isBulkModalOpen = true; bulkError = null"
          class="px-3.5 py-2.5 rounded-2xl bg-[#eaf0f7] text-[#007979] text-xs font-black shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:bg-white/60 transition-all flex items-center space-x-1.5 cursor-pointer"
          title="Buat beberapa unit sekaligus secara otomatis"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>+ Buat Massal (Bulk)</span>
        </button>

        <button
          type="button"
          @click="isSingleModalOpen = true; singleError = null"
          class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white text-xs font-black shadow-[3px_3px_8px_rgba(0,121,121,0.35)] active:scale-95 transition-all flex items-center space-x-1.5 hover:brightness-105 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Tambah Unit</span>
        </button>
      </div>
    </div>

    <!-- Error message if any -->
    <div v-if="unitsError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
      {{ unitsError }}
    </div>

    <!-- Three Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Card 1: Total Unit -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Total Unit Terdaftar
        </div>
        <div class="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          {{ totalUnitsCount }} <span class="text-sm font-semibold text-slate-500">Unit</span>
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Kapasitas kavling/rumah di grup ini
        </div>
      </div>

      <!-- Card 2: Unit Terisi -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Unit Berpenghuni
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#007979] tracking-tight">
          {{ occupiedUnitsCount }} <span class="text-sm font-semibold text-teal-700">Terisi</span>
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Telah dihuni oleh warga aktif terdaftar
        </div>
      </div>

      <!-- Card 3: Unit Kosong -->
      <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 transition-all hover:-translate-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
          Unit Kosong
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#E37434] tracking-tight">
          {{ vacantUnitsCount }} <span class="text-sm font-semibold text-orange-700">Kosong</span>
        </div>
        <div class="mt-2 text-[11px] font-medium text-slate-500">
          Kavling belum berpenghuni / belum klaim
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
            v-model="unitSearchQuery"
            type="text"
            placeholder="Cari nama unit, nomor blok, nama penghuni..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
          />
        </div>

        <!-- Filter Chips -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            @click="unitStatusFilter = 'ALL'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="unitStatusFilter === 'ALL'
              ? 'bg-[#007979] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Semua ({{ units.length }})
          </button>
          <button
            type="button"
            @click="unitStatusFilter = 'OCCUPIED'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="unitStatusFilter === 'OCCUPIED'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-[#eaf0f7] text-[#007979] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Terisi ({{ occupiedUnitsCount }})
          </button>
          <button
            type="button"
            @click="unitStatusFilter = 'VACANT'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="unitStatusFilter === 'VACANT'
              ? 'bg-[#E37434] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-[#E37434] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Kosong ({{ vacantUnitsCount }})
          </button>
        </div>
      </div>

      <div class="text-[11px] text-slate-500 font-semibold flex items-center justify-between pt-1 border-t border-slate-200/60">
        <span>Menampilkan {{ filteredUnits.length }} dari {{ units.length }} unit</span>
        <span v-if="unitSearchQuery" class="text-[#007979] font-bold">Filter pencarian aktif</span>
      </div>
    </div>

    <!-- Units Grid Area Card -->
    <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 space-y-4">
      <!-- Loading State Skeleton -->
      <div v-if="unitsLoading" class="py-4">
        <SkeletonLoader variant="card" :count="4" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUnits.length === 0" class="p-12 text-center text-slate-500 font-medium text-xs space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center mx-auto text-slate-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p v-if="unitSearchQuery">Tidak ada unit yang cocok dengan pencarian "{{ unitSearchQuery }}".</p>
        <p v-else-if="unitStatusFilter === 'VACANT'">Tidak ada unit kosong saat ini. Seluruh unit sudah terisi.</p>
        <p v-else>Belum ada unit terdaftar. Pengurus dapat menambahkan unit baru menggunakan tombol di atas.</p>
      </div>

      <!-- Units Grid List -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="unit in filteredUnits"
          :key="unit.id"
          class="p-4 sm:p-5 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] border border-white/70 flex flex-col justify-between space-y-3 hover:-translate-y-0.5 transition-all"
        >
          <!-- Top Row: Unit Name & Delete Action -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center space-x-2.5">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0"
                :class="unit.occupants && unit.occupants.length > 0
                  ? 'bg-gradient-to-br from-[#007979] to-[#005a5a]'
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div class="min-w-0">
                <h4 class="font-black text-sm sm:text-base text-slate-800 truncate">
                  {{ unit.name }}
                </h4>
                <p v-if="unit.description" class="text-[11px] text-slate-500 font-medium truncate">
                  {{ unit.description }}
                </p>
              </div>
            </div>

            <!-- Delete Button (Only pengurus, only if vacant) -->
            <button
              v-if="isPengurus"
              type="button"
              :disabled="unit.occupants && unit.occupants.length > 0"
              @click="handleDeleteUnit(unit)"
              class="w-8 h-8 rounded-xl bg-[#eaf0f7] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              :class="unit.occupants && unit.occupants.length > 0
                ? 'text-slate-300'
                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2]'"
              :title="unit.occupants && unit.occupants.length > 0 ? 'Unit masih berpenghuni, tidak dapat dihapus' : 'Hapus unit'"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <!-- Bottom Row: Occupancy Information -->
          <div class="pt-2 border-t border-slate-200/60">
            <!-- If Occupied -->
            <div v-if="unit.occupants && unit.occupants.length > 0" class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">Penghuni:</span>
                <span class="px-2 py-0.5 rounded-md bg-[#007979]/10 text-[#007979] font-black text-[10px]">
                  Terisi
                </span>
              </div>
              <div v-for="occ in unit.occupants" :key="occ.id" class="flex items-center justify-between text-xs pt-1">
                <span class="font-bold text-slate-800 truncate">{{ occ.user?.fullName }}</span>
                <span v-if="occ.user?.phone" class="text-[11px] text-slate-500 font-mono">{{ occ.user.phone }}</span>
              </div>
            </div>

            <!-- If Vacant -->
            <div v-else class="flex items-center justify-between text-xs py-1">
              <span class="text-slate-400 font-medium">Status Hunian:</span>
              <span class="px-2 py-0.5 rounded-md bg-[#FFE2AF] text-[#E37434] font-black text-[10px]">
                Kosong
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: TAMBAH UNIT SATUAN -->
    <transition name="fade">
      <div
        v-if="isSingleModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      >
        <div
          class="w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 shadow-[10px_10px_30px_#cad5e2,-10px_-10px_30px_#ffffff] border border-white/80 space-y-4"
        >
          <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h4 class="font-black text-slate-800 text-base">Tambah Unit Hunian Satuan</h4>
            <button
              @click="isSingleModalOpen = false"
              type="button"
              class="w-8 h-8 rounded-full bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div v-if="singleError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {{ singleError }}
          </div>

          <form @submit.prevent="submitSingleUnit" class="space-y-4">
            <div>
              <label class="block text-xs font-black text-slate-700 mb-1">
                Nama Unit / Nomor Kavling <span class="text-red-500">*</span>
              </label>
              <input
                v-model="singleName"
                type="text"
                placeholder="Contoh: Blok B-05 atau Kamar 201"
                required
                class="w-full px-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              />
            </div>

            <div>
              <label class="block text-xs font-black text-slate-700 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                v-model="singleDescription"
                type="text"
                placeholder="Contoh: Rumah pojok sisi timur"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              />
            </div>

            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                @click="isSingleModalOpen = false"
                class="px-4 py-2 rounded-xl bg-[#eaf0f7] text-xs font-bold text-slate-600 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="singleSubmitting"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white text-xs font-black shadow-[2px_2px_6px_rgba(0,121,121,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {{ singleSubmitting ? 'Menyimpan...' : 'Simpan Unit' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- MODAL 2: GENERATOR UNIT MASSAL (BULK) -->
    <transition name="fade">
      <div
        v-if="isBulkModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      >
        <div
          class="w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-6 shadow-[10px_10px_30px_#cad5e2,-10px_-10px_30px_#ffffff] border border-white/80 space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h4 class="font-black text-slate-800 text-base">Buat Unit Hunian Sekaligus (Bulk)</h4>
              <p class="text-[11px] text-slate-500 font-medium">Hemat waktu membuat banyak unit dengan generator otomatis</p>
            </div>
            <button
              @click="isBulkModalOpen = false"
              type="button"
              class="w-8 h-8 rounded-full bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div v-if="bulkError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {{ bulkError }}
          </div>

          <!-- Mode Toggle: Rentang Otomatis vs Daftar Manual -->
          <div class="flex rounded-2xl bg-[#eaf0f7] p-1 shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]">
            <button
              type="button"
              @click="bulkMode = 'RANGE'"
              class="flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
              :class="bulkMode === 'RANGE' ? 'bg-[#007979] text-white shadow-xs' : 'text-slate-600'"
            >
              Penomoran Otomatis (Rentang)
            </button>
            <button
              type="button"
              @click="bulkMode = 'MANUAL'"
              class="flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
              :class="bulkMode === 'MANUAL' ? 'bg-[#007979] text-white shadow-xs' : 'text-slate-600'"
            >
              Input Manual (Daftar Nama)
            </button>
          </div>

          <form @submit.prevent="submitBulkUnits" class="space-y-4">
            <!-- Mode 1: Rentang Otomatis -->
            <div v-if="bulkMode === 'RANGE'" class="space-y-3">
              <div>
                <label class="block text-xs font-black text-slate-700 mb-1">
                  Awalan / Prefix Unit
                </label>
                <input
                  v-model="bulkPrefix"
                  type="text"
                  placeholder="Misal: Blok A- atau Kamar "
                  class="w-full px-4 py-2 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-black text-slate-700 mb-1">Nomor Mulai</label>
                  <input
                    v-model.number="bulkStart"
                    type="number"
                    min="1"
                    class="w-full px-4 py-2 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-black text-slate-700 mb-1">Nomor Akhir</label>
                  <input
                    v-model.number="bulkEnd"
                    type="number"
                    min="1"
                    class="w-full px-4 py-2 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                  />
                </div>
              </div>

              <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  v-model="bulkPadZero"
                  type="checkbox"
                  class="rounded text-[#007979] focus:ring-[#007979]"
                />
                <span>Format 2 digit dengan angka nol di depan (contoh: 01, 02, ..., 09)</span>
              </label>
            </div>

            <!-- Mode 2: Input Manual -->
            <div v-else class="space-y-2">
              <label class="block text-xs font-black text-slate-700">
                Ketik nama unit (pisahkan dengan koma atau baris baru)
              </label>
              <textarea
                v-model="bulkManualText"
                rows="4"
                placeholder="Contoh:&#10;Blok A1&#10;Blok A2&#10;Blok A3"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              ></textarea>
            </div>

            <!-- Preview Card -->
            <div class="p-3.5 rounded-2xl bg-white/60 border border-slate-200/80 space-y-2">
              <div class="flex items-center justify-between text-xs font-black text-slate-700">
                <span>Pratinjau Hasil Unit yang Dibuat:</span>
                <span class="text-[#007979]">{{ previewBulkNames.length }} Unit</span>
              </div>
              <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                <span
                  v-for="(name, idx) in previewBulkNames"
                  :key="idx"
                  class="px-2 py-0.5 rounded-md bg-[#eaf0f7] text-slate-700 font-mono text-[10px] shadow-xs"
                >
                  {{ name }}
                </span>
                <span v-if="previewBulkNames.length === 0" class="text-xs text-slate-400 italic">
                  Belum ada unit yang akan dibuat
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                @click="isBulkModalOpen = false"
                class="px-4 py-2 rounded-xl bg-[#eaf0f7] text-xs font-bold text-slate-600 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="bulkSubmitting || previewBulkNames.length === 0"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white text-xs font-black shadow-[2px_2px_6px_rgba(0,121,121,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {{ bulkSubmitting ? 'Memproses...' : `Buat ${previewBulkNames.length} Unit Sekarang` }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>
