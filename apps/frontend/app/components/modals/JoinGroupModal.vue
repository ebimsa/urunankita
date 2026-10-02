<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GroupPreview } from '../../composables/useGroups'

const props = defineProps<{
  isOpen: boolean
  lookupLoading?: boolean
  joinLoading?: boolean
  joinPreview: GroupPreview | null
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'lookup', code: string): void
  (e: 'join', payload: { joinCode: string; unitId?: string; unitName?: string }): void
}>()

const joinCode = ref('')
const unitSearchQuery = ref('')
const selectedUnit = ref<{ id?: string; name: string } | null>(null)
const isUnitDropdownOpen = ref(false)
const localError = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      joinCode.value = ''
      unitSearchQuery.value = ''
      selectedUnit.value = null
      isUnitDropdownOpen.value = false
      localError.value = null
    }
  },
)

// Computed untuk combobox unit
const filteredUnits = computed(() => {
  if (!props.joinPreview?.units) return []
  const q = unitSearchQuery.value.trim().toLowerCase()
  if (!q) return props.joinPreview.units
  return props.joinPreview.units.filter((u) => u.name.toLowerCase().includes(q))
})

const exactUnitMatch = computed(() => {
  if (!props.joinPreview?.units) return null
  const q = unitSearchQuery.value.trim().toLowerCase()
  if (!q) return null
  return props.joinPreview.units.find((u) => u.name.toLowerCase() === q) || null
})

const showAddNewUnitOption = computed(() => {
  const q = unitSearchQuery.value.trim()
  return q.length > 0 && !exactUnitMatch.value
})

const selectExistingUnit = (unit: { id: string; name: string }) => {
  selectedUnit.value = { id: unit.id, name: unit.name }
  unitSearchQuery.value = unit.name
  isUnitDropdownOpen.value = false
}

const selectNewUnit = (name: string) => {
  selectedUnit.value = { name: name.trim() }
  unitSearchQuery.value = name.trim()
  isUnitDropdownOpen.value = false
}

const onUnitInputChange = () => {
  isUnitDropdownOpen.value = true
  if (selectedUnit.value && selectedUnit.value.name !== unitSearchQuery.value) {
    selectedUnit.value = null
  }
}

const handleUnitBlur = () => {
  setTimeout(() => {
    isUnitDropdownOpen.value = false
  }, 200)
}

const handleLookupCode = () => {
  if (!joinCode.value.trim()) {
    localError.value = 'Silakan masukkan kode grup.'
    return
  }
  localError.value = null
  unitSearchQuery.value = ''
  selectedUnit.value = null
  isUnitDropdownOpen.value = false
  emit('lookup', joinCode.value.trim())
}

const handleJoinSubmit = () => {
  if (!props.joinPreview) return

  let finalUnitId: string | undefined = undefined
  let finalUnitName: string | undefined = undefined

  if (props.joinPreview.type === 'PHYSICAL_UNIT') {
    const query = unitSearchQuery.value.trim()
    if (!query) {
      localError.value = 'Nomor atau nama unit hunian wajib diisi.'
      return
    }

    if (selectedUnit.value?.id) {
      finalUnitId = selectedUnit.value.id
    } else {
      const match = props.joinPreview.units?.find(
        (u) => u.name.toLowerCase() === query.toLowerCase(),
      )
      if (match) {
        finalUnitId = match.id
      } else {
        finalUnitName = query
      }
    }
  }

  localError.value = null
  emit('join', {
    joinCode: props.joinPreview.joinCode,
    unitId: finalUnitId,
    unitName: finalUnitName,
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
                class="inline-block px-2.5 py-0.5 rounded-lg bg-[#24B1B1]/20 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs"
              >
                Registrasi Warga
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Gabung Grup
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Masukkan kode gabung (Join Code) dari pengurus RT / Kost Anda.
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

          <div
            v-if="error || localError"
            class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs"
          >
            <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
            {{ error || localError }}
          </div>

          <!-- Input Kode Gabung & Tombol Cari -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Kode Gabung Grup
              </label>
              <div class="flex space-x-2">
                <input
                  v-model="joinCode"
                  type="text"
                  placeholder="Contoh: RT-J6CM"
                  @keyup.enter="handleLookupCode"
                  class="flex-1 px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none uppercase font-mono tracking-wider"
                />
                <button
                  type="button"
                  @click="handleLookupCode"
                  :disabled="lookupLoading"
                  class="px-5 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_2px_8px_rgba(0,121,121,0.35)] active:scale-95 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {{ lookupLoading ? 'Mencari...' : 'Cari' }}
                </button>
              </div>
            </div>

            <!-- Preview Grup jika ditemukan -->
            <div
              v-if="joinPreview"
              class="p-4 rounded-2xl bg-white border border-[#24B1B1]/40 shadow-[4px_4px_10px_#cad5e2] space-y-3 animate-fadeIn"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase block">Grup Ditemukan:</span>
                  <h4 class="font-black text-slate-800 text-sm">{{ joinPreview.name }}</h4>
                </div>
                <span class="px-2.5 py-1 rounded-lg bg-[#FFE2AF] text-[#007979] text-[10px] font-black">
                  {{ joinPreview.type === 'PHYSICAL_UNIT' ? 'Unit Fisik' : 'Anggota Langsung' }}
                </span>
              </div>

              <!-- Jika bertipe PHYSICAL_UNIT, combobox pencarian / tambah unit baru -->
              <div v-if="joinPreview.type === 'PHYSICAL_UNIT'" class="space-y-2 relative">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-700">
                    Nomor / Unit Hunian Anda:
                  </label>
                  <span
                    v-if="selectedUnit?.id"
                    class="text-[10px] font-bold text-[#007979] bg-[#007979]/10 px-2 py-0.5 rounded-md"
                  >
                    Unit Terdaftar
                  </span>
                  <span
                    v-else-if="unitSearchQuery.trim() && !exactUnitMatch"
                    class="text-[10px] font-bold text-[#e87b38] bg-[#e87b38]/10 px-2 py-0.5 rounded-md"
                  >
                    Unit Baru
                  </span>
                </div>

                <div class="relative">
                  <input
                    v-model="unitSearchQuery"
                    type="text"
                    @focus="isUnitDropdownOpen = true"
                    @input="onUnitInputChange"
                    @blur="handleUnitBlur"
                    placeholder="Ketik nomor unit (cth: Blok A-01, 204)..."
                    class="w-full px-4 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                  />

                  <!-- Floating suggestions dropdown -->
                  <div
                    v-if="isUnitDropdownOpen"
                    class="absolute left-0 right-0 top-full mt-1.5 z-20 max-h-52 overflow-y-auto rounded-2xl bg-[#eaf0f7] border border-white/80 shadow-[6px_6px_14px_#cad5e2,-6px_-6px_14px_#ffffff] p-2 space-y-1"
                  >
                    <!-- Opsi tambah unit baru jika belum ada exact match -->
                    <div
                      v-if="showAddNewUnitOption"
                      @mousedown.prevent="selectNewUnit(unitSearchQuery)"
                      class="px-3 py-2 rounded-xl bg-white hover:bg-[#007979]/5 text-xs font-bold text-[#007979] cursor-pointer border border-[#24B1B1]/40 transition-all flex items-center justify-between shadow-xs"
                    >
                      <span class="truncate">+ Daftarkan Sebagai Unit Baru: "{{ unitSearchQuery.trim() }}"</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#FFE2AF] text-[#007979] font-black shrink-0 ml-2">Baru</span>
                    </div>

                    <!-- Unit terdaftar yang cocok dengan pencarian -->
                    <template v-if="filteredUnits.length > 0">
                      <div class="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Pilih Dari Unit Terdaftar
                      </div>
                      <div
                        v-for="u in filteredUnits"
                        :key="u.id"
                        @mousedown.prevent="selectExistingUnit(u)"
                        class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-white/80 cursor-pointer transition-colors flex items-center justify-between"
                        :class="{ 'bg-white shadow-[2px_2px_6px_#cad5e2] text-[#007979]': selectedUnit?.id === u.id }"
                      >
                        <span class="truncate">{{ u.name }}</span>
                        <span v-if="u.description" class="text-[10px] text-slate-400 font-normal shrink-0 ml-2">
                          {{ u.description }}
                        </span>
                      </div>
                    </template>

                    <!-- Empty state jika grup belum ada unit terdaftar dan belum ketik apa-apa -->
                    <div
                      v-else-if="!showAddNewUnitOption"
                      class="px-3 py-3 text-center text-xs text-slate-500 font-medium"
                    >
                      Belum ada unit terdaftar di grup ini. Ketik nomor unit Anda di atas untuk mendaftarkannya.
                    </div>
                  </div>
                </div>

                <p class="text-[10px] text-slate-500 font-medium">
                  Ketik untuk mencari unit yang sudah ada, atau ketik nomor unit baru jika belum terdaftar.
                </p>
              </div>

              <p class="text-[11px] text-slate-500 font-medium">
                Setelah mengirim, status keanggotaan Anda akan berstatus <strong>Menunggu Persetujuan</strong> pengurus.
              </p>

              <button
                type="button"
                @click="handleJoinSubmit"
                :disabled="joinLoading"
                class="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_12px_rgba(227,116,52,0.35)] active:scale-95 disabled:opacity-50 text-center uppercase tracking-wider cursor-pointer"
              >
                {{ joinLoading ? 'Mengirim Permohonan...' : 'Kirim Permohonan Gabung' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
