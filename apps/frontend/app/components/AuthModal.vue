<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps<{
  isOpen: boolean
  initialTab?: 'LOGIN' | 'REGISTER'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const { login, register, loading, error } = useAuth()

const activeTab = ref<'LOGIN' | 'REGISTER'>(props.initialTab || 'LOGIN')

// Form Login
const loginIdentifier = ref('')
const loginPassword = ref('')

// Form Register
const regFullName = ref('')
const regPhone = ref('')
const regEmail = ref('')
const regPassword = ref('')

watch(
  () => props.initialTab,
  (val) => {
    if (val) activeTab.value = val
  }
)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      error.value = null
    }
  }
)

const handleLogin = async () => {
  if (!loginIdentifier.value || !loginPassword.value) {
    error.value = 'Silakan isi identifier (email/no HP) dan kata sandi.'
    return
  }

  const ok = await login(loginIdentifier.value, loginPassword.value)
  if (ok) {
    emit('success')
    emit('close')
  }
}

const handleRegister = async () => {
  if (!regFullName.value || !regPhone.value || !regPassword.value) {
    error.value = 'Nama lengkap, nomor HP/WhatsApp, dan kata sandi wajib diisi.'
    return
  }

  const ok = await register(
    regFullName.value,
    regPhone.value,
    regPassword.value,
    regEmail.value || undefined
  )
  if (ok) {
    emit('success')
    emit('close')
  }
}

const fillPreset = (type: 'RT' | 'WARGA') => {
  activeTab.value = 'LOGIN'
  if (type === 'RT') {
    loginIdentifier.value = 'budi@urunankita.id'
    loginPassword.value = 'password123'
  } else {
    loginIdentifier.value = '08198765432'
    loginPassword.value = 'password123'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop Overlay (Clean Dark Dimming, No Glow) -->
      <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click="emit('close')"
      ></div>

    <div class="flex min-h-full items-center justify-center p-4">
      <!-- Container Modal: Clean Drop Shadow without White Glow -->
      <div
        class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800"
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {{ activeTab === 'LOGIN' ? 'Masuk' : 'Daftar Akun Baru' }}
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              Kelola iuran dan pembukuan mandiri grup Anda.
            </p>
          </div>

          <button
            type="button"
            @click="emit('close')"
            class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434] transition-all border border-slate-200/60"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <!-- Neumorphic Tab Switcher (Inset Pill Group) -->
        <div class="flex p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_3px_3px_6px_#cbd7e5,inset_-3px_-3px_6px_#ffffff]">
          <button
            type="button"
            @click="activeTab = 'LOGIN'; error = null"
            :class="[
              'flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 text-center',
              activeTab === 'LOGIN'
                ? 'bg-gradient-to-r from-[#007979] to-[#005a5a] text-white shadow-[0_2px_8px_rgba(0,121,121,0.35)]'
                : 'text-slate-600 hover:text-[#007979]'
            ]"
          >
            Masuk Akun
          </button>
          <button
            type="button"
            @click="activeTab = 'REGISTER'; error = null"
            :class="[
              'flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 text-center',
              activeTab === 'REGISTER'
                ? 'bg-gradient-to-r from-[#007979] to-[#005a5a] text-white shadow-[0_2px_8px_rgba(0,121,121,0.35)]'
                : 'text-slate-600 hover:text-[#007979]'
            ]"
          >
            Daftar Baru
          </button>
        </div>

        <!-- Alert Kendala / Error -->
        <div
          v-if="error"
          class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-[2px_2px_6px_#cad5e2,-2px_-2px_6px_#ffffff]"
        >
          <span class="font-black block uppercase text-[10px] tracking-wider text-red-900 mb-0.5">Kendala</span>
          {{ error }}
        </div>

        <!-- TAB 1: FORM LOGIN -->
        <form v-if="activeTab === 'LOGIN'" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Email atau No. Handphone / WhatsApp
            </label>
            <input
              v-model="loginIdentifier"
              type="text"
              autocomplete="username"
              required
              placeholder="Contoh: budi@urunankita.id atau 08198765432"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <input
              v-model="loginPassword"
              type="password"
              autocomplete="current-password"
              required
              placeholder="Masukkan kata sandi akun"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <!-- Quick Presets Demo (Neumorphic Inset Panel) -->
          <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff]">
            <span class="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Pintasan Uji Coba Cepat:
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="fillPreset('RT')"
                class="p-2.5 rounded-xl bg-[#eaf0f7] shadow-sm border border-slate-200/80 active:shadow-[inset_1px_1px_3px_#cad5e2] text-left transition-all hover:text-[#007979]"
              >
                <span class="text-xs font-black text-slate-800 block">Pak RT Budi</span>
                <span class="text-[10px] text-slate-500 block font-medium">Pengurus (Owner)</span>
              </button>
              <button
                type="button"
                @click="fillPreset('WARGA')"
                class="p-2.5 rounded-xl bg-[#eaf0f7] shadow-sm border border-slate-200/80 active:shadow-[inset_1px_1px_3px_#cad5e2] text-left transition-all hover:text-[#007979]"
              >
                <span class="text-xs font-black text-slate-800 block">Joko Susilo</span>
                <span class="text-[10px] text-slate-500 block font-medium">Warga (Blok A-01)</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
          >
            {{ loading ? 'Memverifikasi...' : 'Masuk Sekarang' }}
          </button>
        </form>

        <!-- TAB 2: FORM REGISTER -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap
            </label>
            <input
              v-model="regFullName"
              type="text"
              required
              placeholder="Contoh: Joko Susilo"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor Handphone / WhatsApp
            </label>
            <input
              v-model="regPhone"
              type="tel"
              required
              placeholder="Contoh: 08198765432"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Alamat Email (Opsional)
            </label>
            <input
              v-model="regEmail"
              type="email"
              placeholder="Contoh: warga@gmail.com"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <input
              v-model="regPassword"
              type="password"
              required
              minlength="6"
              placeholder="Minimal 6 karakter"
              class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
          >
            {{ loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru' }}
          </button>
        </form>

        <!-- Footer Info -->
        <p class="text-center text-[11px] text-slate-500 font-medium pt-1">
          Sistem kas & iuran mandiri tanpa potongan transaksi.
        </p>
      </div>
    </div>
  </div>
  </Teleport>
</template>
