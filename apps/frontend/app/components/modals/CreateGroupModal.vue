<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { name: string; type: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'; description?: string }): void
}>()

const name = ref('')
const type = ref<'PHYSICAL_UNIT' | 'DIRECT_MEMBER'>('PHYSICAL_UNIT')
const description = ref('')
const localError = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      name.value = ''
      type.value = 'PHYSICAL_UNIT'
      description.value = ''
      localError.value = null
    }
  },
)

const handleSubmit = () => {
  if (!name.value.trim()) {
    localError.value = 'Nama grup wajib diisi.'
    return
  }
  localError.value = null
  emit('submit', {
    name: name.value.trim(),
    type: type.value,
    description: description.value.trim() || undefined,
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
                Inisiasi Baru
              </div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">
                Buat Grup Baru
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Anda otomatis menjadi Pengurus (Owner) grup ini.
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

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Grup / Lingkungan
              </label>
              <input
                v-model="name"
                type="text"
                required
                placeholder="Contoh: RT 04 Griya Asri atau Kost Kemuning"
                class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Model Struktur Penagihan
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="type = 'PHYSICAL_UNIT'"
                  :class="[
                    'p-3 rounded-2xl text-left border transition-all cursor-pointer',
                    type === 'PHYSICAL_UNIT'
                      ? 'bg-white border-[#007979] shadow-[2px_2px_6px_rgba(0,121,121,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_2px_2px_4px_#cbd7e5]'
                  ]"
                >
                  <span
                    class="block text-xs font-black"
                    :class="type === 'PHYSICAL_UNIT' ? 'text-[#007979]' : 'text-slate-700'"
                  >
                    Unit Fisik
                  </span>
                  <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                    Perumahan, RT/RW, Indekos (per nomor rumah/kamar)
                  </span>
                </button>

                <button
                  type="button"
                  @click="type = 'DIRECT_MEMBER'"
                  :class="[
                    'p-3 rounded-2xl text-left border transition-all cursor-pointer',
                    type === 'DIRECT_MEMBER'
                      ? 'bg-white border-[#007979] shadow-[2px_2px_6px_rgba(0,121,121,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_2px_2px_4px_#cbd7e5]'
                  ]"
                >
                  <span
                    class="block text-xs font-black"
                    :class="type === 'DIRECT_MEMBER' ? 'text-[#007979]' : 'text-slate-700'"
                  >
                    Anggota Langsung
                  </span>
                  <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                    Klub Olahraga, Paguyuban, Arisan (per orang)
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Deskripsi Singkat (Opsional)
              </label>
              <input
                v-model="description"
                type="text"
                placeholder="Contoh: Iuran kebersihan dan kas bulanan warga"
                class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider cursor-pointer"
            >
              {{ loading ? 'Menerbitkan Grup...' : 'Terbitkan Grup Baru' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
