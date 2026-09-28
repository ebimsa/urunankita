<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useGroups } from './composables/useGroups'
import { useNavigation } from './composables/useNavigation'

// Auth & Navigation State
const { user, isAuthenticated, fetchMe, logout } = useAuth()
const { openCreateModal, openJoinModal, openBillModal } = useGroups()
const { activeTab, setActiveTab } = useNavigation()
const isGroupActionDropdownOpen = ref(false)
const isAuthModalOpen = ref(false)
const authModalTab = ref<'LOGIN' | 'REGISTER'>('LOGIN')

const openAuthModal = (tab: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
  authModalTab.value = tab
  isAuthModalOpen.value = true
}

const handleAuthSuccess = () => {
  isAuthModalOpen.value = false
}

onMounted(async () => {
  await fetchMe()
})

// State menu mobile
const isMobileMenuOpen = ref(false)

// Tab mode struktur komunitas
const activeMode = ref<'PHYSICAL' | 'DIRECT'>('PHYSICAL')

// Tab simulasi pembayaran
const simTab = ref<'BILL' | 'QRIS' | 'HISTORY'>('BILL')
const paymentConfirmed = ref(false)

// Pencarian dan filter buku kas terbuka
const searchQuery = ref('')
const filterType = ref<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

// Data grup percontohan (mempertahankan warna asli & identitas)
const sampleGroups = [
  {
    id: '1',
    name: 'RT 04 / RW 08 Griya Asri',
    type: 'Unit Fisik (RT/RW)',
    totalUnits: 48,
    activeBills: 'Rp 7.200.000',
    collectionRate: '94%',
    status: 'Periode Berjalan',
    accentColor: '#007979',
    badgeBg: 'bg-[#007979]/10 text-[#007979]'
  },
  {
    id: '2',
    name: 'Kost Puri Kemuning Indah',
    type: 'Unit Fisik (Kost)',
    totalUnits: 18,
    activeBills: 'Rp 27.000.000',
    collectionRate: '100%',
    status: 'Tertib Administrasi',
    accentColor: '#E37434',
    badgeBg: 'bg-[#FFE2AF] text-[#E37434]'
  },
  {
    id: '3',
    name: 'Komunitas Futsal Garuda',
    type: 'Anggota Langsung',
    totalUnits: 24,
    activeBills: 'Rp 1.200.000',
    collectionRate: '88%',
    status: 'Periode Berjalan',
    accentColor: '#24B1B1',
    badgeBg: 'bg-[#24B1B1]/15 text-[#007979]'
  }
]

// Data mutasi kas
const ledgerItems = [
  { date: '26 Sep 2026', title: 'Iuran Bulanan Blok C-02 s/d C-08', type: 'INCOME', amount: 'Rp 1.050.000', category: 'Penerimaan Iuran' },
  { date: '25 Sep 2026', title: 'Honor Petugas Kebersihan & Satpam', type: 'EXPENSE', amount: 'Rp 2.400.000', category: 'Biaya Operasional' },
  { date: '23 Sep 2026', title: 'Perbaikan Lampu Penerangan Gang 4', type: 'EXPENSE', amount: 'Rp 380.000', category: 'Pemeliharaan' },
  { date: '20 Sep 2026', title: 'Iuran Bulanan Blok A-01 s/d A-06', type: 'INCOME', amount: 'Rp 900.000', category: 'Penerimaan Iuran' },
  { date: '18 Sep 2026', title: 'Pembelian Tempat Sampah Terpilah', type: 'EXPENSE', amount: 'Rp 450.000', category: 'Sarana Warga' },
  { date: '15 Sep 2026', title: 'Iuran Donasi Kas Sosial Warga', type: 'INCOME', amount: 'Rp 650.000', category: 'Dana Sosial' },
]

// Filtered ledger
const filteredLedger = computed(() => {
  return ledgerItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = filterType.value === 'ALL' || item.type === filterType.value
    return matchesSearch && matchesType
  })
})

const handlePaySimulation = () => {
  paymentConfirmed.value = true
  setTimeout(() => {
    paymentConfirmed.value = false
  }, 4000)
}
</script>

<template>
  <div class="min-h-screen bg-[#eaf0f7] text-slate-800 antialiased font-sans selection:bg-[#24B1B1] selection:text-white">
    
    <!-- Header / Navbar: Neumorphic Mobile-First Floating Bar -->
    <header class="sticky top-0 z-50 bg-[#eaf0f7]/95 backdrop-blur-md border-b border-white/60 shadow-[0_4px_18px_rgba(205,215,227,0.45)]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        <!-- Logo -->
        <a href="#" class="flex items-center space-x-2.5 sm:space-x-3 group">
          <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#f58342] to-[#ce6326] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] transition-transform duration-200 group-hover:scale-105">
            e
          </div>
          <div>
            <span class="text-lg sm:text-2xl font-black tracking-tight text-slate-800 leading-none">
              eYuran
            </span>
            <p class="hidden xs:block text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5">Sistem Kas & Iuran Grup</p>
          </div>
        </a>

        <!-- Desktop Navigation: Neumorphic Inset Pill Group (Hanya Saat Belum Login) -->
        <nav v-if="!isAuthenticated" class="hidden md:flex items-center space-x-1.5 p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_3px_3px_6px_#cbd7e5,inset_-3px_-3px_6px_#ffffff]">
          <a
            href="#fitur"
            class="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl transition-all duration-200 hover:text-[#007979] hover:shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]"
          >
            Keunggulan
          </a>
          <a
            href="#model"
            class="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl transition-all duration-200 hover:text-[#007979] hover:shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]"
          >
            Model Struktur
          </a>
          <a
            href="#pembukuan"
            class="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl transition-all duration-200 hover:text-[#007979] hover:shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]"
          >
            Transparansi Kas
          </a>
          <a
            href="#demo"
            class="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl transition-all duration-200 hover:text-[#007979] hover:shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]"
          >
            Daftar Grup
          </a>
        </nav>

        <!-- Desktop Actions: Neumorphic Soft UI -->
        <div class="hidden md:flex items-center space-x-3">
          <template v-if="!isAuthenticated">
            <button
              @click="openAuthModal('LOGIN')"
              class="px-6 py-2.5 text-xs font-black text-white rounded-xl bg-gradient-to-r from-[#e87b38] to-[#d46522] shadow-[4px_4px_12px_rgba(227,116,52,0.38),-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(150,60,10,0.5)] transition-all duration-200 hover:brightness-105 flex items-center space-x-1.5"
            >
              <span>Masuk</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              @click="openAuthModal('REGISTER')"
              class="px-5 py-2.5 text-xs font-bold text-[#007979] rounded-xl bg-[#eaf0f7] shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] transition-all hover:text-[#24B1B1]"
            >
              Daftar
            </button>
          </template>

          <template v-else>
            <!-- Nama User -->
            <div class="px-3.5 py-2 text-xs font-bold text-slate-700 rounded-xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff]">
              {{ user?.fullName }}
            </div>

            <!-- Tombol + Opsi Grup (Desktop) -->
            <div class="relative">
              <button
                @click="isGroupActionDropdownOpen = !isGroupActionDropdownOpen"
                type="button"
                class="w-10 h-10 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2] border border-white/80 flex items-center justify-center text-[#007979] hover:text-[#24B1B1] hover:scale-105 active:scale-95 transition-all focus:outline-none"
                title="Aksi Grup"
                aria-label="Tambah atau Gabung Grup"
              >
                <svg class="w-5 h-5 transition-transform duration-200" :class="{ 'rotate-45 text-[#E37434]': isGroupActionDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <!-- Dropdown Menu Sheet (Desktop) -->
              <transition name="slide-fade">
                <div
                  v-if="isGroupActionDropdownOpen"
                  class="absolute right-0 top-full mt-2.5 w-60 z-50 rounded-3xl bg-[#eaf0f7] p-2.5 shadow-[10px_10px_30px_rgba(180,195,215,0.75),-6px_-6px_20px_#ffffff] border border-white/80 space-y-1"
                >

                  <!-- Opsi 1: Gabung Grup -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openJoinModal()"
                    class="w-full flex items-center space-x-3 p-2.5 rounded-2xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-8 h-8 rounded-xl bg-[#007979]/10 text-[#007979] flex items-center justify-center group-hover:bg-[#007979] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Gabung Grup</p>
                      <p class="text-[10px] text-slate-500 font-medium">Pakai kode dari pengurus</p>
                    </div>
                  </button>

                  <!-- Opsi 2: Buat Grup Baru -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openCreateModal()"
                    class="w-full flex items-center space-x-3 p-2.5 rounded-2xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-8 h-8 rounded-xl bg-[#FFE2AF] text-[#E37434] flex items-center justify-center group-hover:bg-[#E37434] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Buat Grup Baru</p>
                      <p class="text-[10px] text-slate-500 font-medium">RT/RW, Kost, Paguyuban</p>
                    </div>
                  </button>

                  <!-- Opsi 3: Set Tagihan Baru -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openBillModal()"
                    class="w-full flex items-center space-x-3 p-2.5 rounded-2xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-8 h-8 rounded-xl bg-[#24B1B1]/15 text-[#007979] flex items-center justify-center group-hover:bg-[#007979] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Set Tagihan Baru</p>
                      <p class="text-[10px] text-slate-500 font-medium">Bulanan, tahunan, insidental</p>
                    </div>
                  </button>
                </div>
              </transition>

              <!-- Backdrop overlay click outside -->
              <div
                v-if="isGroupActionDropdownOpen"
                @click="isGroupActionDropdownOpen = false"
                class="fixed inset-0 z-40"
              ></div>
            </div>

            <button
              @click="logout()"
              class="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_6px_#cad5e2,-2px_-2px_6px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:text-[#E37434] transition-all"
            >
              Keluar
            </button>
          </template>
        </div>

        <!-- Mobile Controls (Quick Action + Neumorphic Menu Toggle) -->
        <div class="flex items-center space-x-2 md:hidden">
          <template v-if="!isAuthenticated">
            <button
              @click="openAuthModal('LOGIN')"
              class="px-4 py-2 text-xs font-black text-white rounded-xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[2px_2px_7px_rgba(227,116,52,0.35),-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_rgba(150,55,10,0.5)] transition-all flex items-center space-x-1"
            >
              <span>Masuk</span>
            </button>

            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="w-10 h-10 rounded-xl bg-[#eaf0f7] text-slate-700 shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center transition-all focus:outline-none"
              :aria-expanded="isMobileMenuOpen"
              aria-label="Navigasi Menu"
            >
              <svg v-if="!isMobileMenuOpen" class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="w-5 h-5 text-[#E37434]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </template>
          <template v-else>
            <!-- Nama User (Mobile) -->
            <div class="max-w-[100px] sm:max-w-[140px] px-2.5 py-1.5 text-xs font-bold text-slate-700 rounded-xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5] truncate">
              {{ user?.fullName }}
            </div>

            <!-- Tombol + Opsi Grup (Mobile) -->
            <div class="relative">
              <button
                @click="isGroupActionDropdownOpen = !isGroupActionDropdownOpen"
                type="button"
                class="w-9 h-9 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] border border-white/80 flex items-center justify-center text-[#007979] hover:text-[#24B1B1] transition-all focus:outline-none"
                title="Aksi Grup"
                aria-label="Tambah atau Gabung Grup"
              >
                <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-45 text-[#E37434]': isGroupActionDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <!-- Dropdown Menu Sheet (Mobile) -->
              <transition name="slide-fade">
                <div
                  v-if="isGroupActionDropdownOpen"
                  class="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl bg-[#eaf0f7] p-2 shadow-[8px_8px_24px_rgba(180,195,215,0.8),-4px_-4px_16px_#ffffff] border border-white/80 space-y-1"
                >

                  <!-- Opsi 1: Gabung Grup -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openJoinModal()"
                    class="w-full flex items-center space-x-2.5 p-2 rounded-xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-7 h-7 rounded-lg bg-[#007979]/10 text-[#007979] flex items-center justify-center group-hover:bg-[#007979] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Gabung Grup</p>
                      <p class="text-[10px] text-slate-500 font-medium">Pakai kode pengurus</p>
                    </div>
                  </button>

                  <!-- Opsi 2: Buat Grup Baru -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openCreateModal()"
                    class="w-full flex items-center space-x-2.5 p-2 rounded-xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-7 h-7 rounded-lg bg-[#FFE2AF] text-[#E37434] flex items-center justify-center group-hover:bg-[#E37434] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Buat Grup Baru</p>
                      <p class="text-[10px] text-slate-500 font-medium">RT/RW, Kost, Paguyuban</p>
                    </div>
                  </button>

                  <!-- Opsi 3: Set Tagihan Baru -->
                  <button
                    type="button"
                    @click="isGroupActionDropdownOpen = false; openBillModal()"
                    class="w-full flex items-center space-x-2.5 p-2 rounded-xl transition-all text-left hover:bg-white/60 active:shadow-[inset_1px_1px_3px_#cad5e2] group"
                  >
                    <div class="w-7 h-7 rounded-lg bg-[#24B1B1]/15 text-[#007979] flex items-center justify-center group-hover:bg-[#007979] group-hover:text-white transition-colors flex-shrink-0">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-black text-slate-800">Set Tagihan Baru</p>
                      <p class="text-[10px] text-slate-500 font-medium">Bulanan, tahunan, insidental</p>
                    </div>
                  </button>
                </div>
              </transition>

              <!-- Backdrop overlay click outside -->
              <div
                v-if="isGroupActionDropdownOpen"
                @click="isGroupActionDropdownOpen = false"
                class="fixed inset-0 z-40"
              ></div>
            </div>

            <button
              @click="logout()"
              class="px-2.5 py-1.5 text-xs font-bold text-slate-600 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:text-[#E37434] transition-all"
            >
              Keluar
            </button>
          </template>
        </div>

      </div>

      <!-- Backdrop Overlay -->
      <transition name="fade">
        <div
          v-if="isMobileMenuOpen"
          @click="isMobileMenuOpen = false"
          class="fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
        ></div>
      </transition>

      <!-- Floating Neumorphic Mobile Menu Sheet -->
      <transition name="slide-fade">
        <div
          v-if="isMobileMenuOpen"
          class="fixed top-18 left-3 right-3 z-50 md:hidden"
        >
          <div class="rounded-3xl bg-[#eaf0f7] p-4 sm:p-5 shadow-[10px_10px_30px_rgba(180,195,215,0.7),-6px_-6px_20px_#ffffff] border border-white/80 space-y-3.5">
            
            <!-- Menu Navigation Links with Icons -->
            <div class="space-y-1.5">
              <a
                @click="isMobileMenuOpen = false"
                href="#fitur"
                class="flex items-center justify-between p-3 rounded-2xl transition-all duration-150 hover:bg-white/40 active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] text-[#007979] flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-extrabold text-slate-800">Keunggulan</p>
                    <p class="text-[10px] text-slate-500 font-medium">Landasan kas mandiri tanpa potongan</p>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                @click="isMobileMenuOpen = false"
                href="#model"
                class="flex items-center justify-between p-3 rounded-2xl transition-all duration-150 hover:bg-white/40 active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] text-[#007979] flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-extrabold text-slate-800">Model Struktur</p>
                    <p class="text-[10px] text-slate-500 font-medium">Skema Unit Fisik & Anggota Langsung</p>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                @click="isMobileMenuOpen = false"
                href="#pembukuan"
                class="flex items-center justify-between p-3 rounded-2xl transition-all duration-150 hover:bg-white/40 active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] text-[#007979] flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-extrabold text-slate-800">Transparansi Kas</p>
                    <p class="text-[10px] text-slate-500 font-medium">Buku kas terbuka & mutasi real-time</p>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                @click="isMobileMenuOpen = false"
                href="#demo"
                class="flex items-center justify-between p-3 rounded-2xl transition-all duration-150 hover:bg-white/40 active:shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] text-[#007979] flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-extrabold text-slate-800">Daftar Grup</p>
                    <p class="text-[10px] text-slate-500 font-medium">Portofolio RT/RW, Kost, & Olahraga</p>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <!-- Mobile Auth & Action Buttons: Neumorphic Soft UI -->
            <div class="pt-3 border-t border-slate-200/80 space-y-2.5">
              <template v-if="!isAuthenticated">
                <button
                  @click="isMobileMenuOpen = false; openAuthModal('LOGIN')"
                  class="w-full py-3.5 text-xs font-black text-white rounded-xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[4px_4px_12px_rgba(227,116,52,0.38)] active:shadow-[inset_2px_2px_5px_rgba(150,55,10,0.5)] flex items-center justify-center space-x-2"
                >
                  <span>Masuk</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  @click="isMobileMenuOpen = false; openAuthModal('REGISTER')"
                  class="w-full py-3 text-xs font-bold text-[#007979] rounded-xl bg-[#eaf0f7] shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff] active:shadow-[inset_2px_2px_4px_#cad5e2] text-center"
                >
                  Daftar Akun Baru
                </button>
              </template>
              <template v-else>
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] text-slate-800 font-black text-xs text-center">
                  {{ user?.fullName }}
                </div>
                <button
                  @click="isMobileMenuOpen = false; logout()"
                  class="w-full py-2.5 text-xs font-bold bg-[#eaf0f7] text-slate-600 rounded-xl shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] text-center hover:text-[#E37434] transition-all"
                >
                  Keluar Akun
                </button>
              </template>
            </div>

          </div>
        </div>
      </transition>
    </header>

    <!-- Dashboard Grup (Hanya Saat Sudah Login) -->
    <main v-if="isAuthenticated" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <DashboardView />
    </main>

    <!-- Konten Beranda Publik (Hanya Saat Belum Login) -->
    <div v-else>
      <!-- Hero Section: Mobile-First Layout -->
      <section class="relative py-10 sm:py-16 lg:py-20 overflow-hidden">
      <!-- Ambient light effect -->
      <div class="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#24B1B1]/10 to-transparent blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FFE2AF]/25 to-transparent blur-3xl pointer-events-none"></div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <!-- Hero Copy Left Column -->
          <div class="lg:col-span-7 flex flex-col justify-between space-y-6 sm:space-y-8">
            <div>
              <h1 class="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-800 tracking-tight leading-[1.2] mb-5">
                Kelola Iuran dan Pembukuan Grup secara <span class="text-[#007979]">Praktis & Transparan</span>
              </h1>
              
              <p class="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-medium mb-7 max-w-xl">
                Solusi administrasi keuangan mandiri untuk perumahan, RT/RW, indekos, serta kelompok olahraga. Pembayaran langsung diterima oleh bendahara melalui QRIS dinamis tanpa potongan transaksi dan tanpa perantara penampung dana.
              </p>

              <!-- Neumorphic CTA Buttons -->
              <div class="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-stretch sm:items-center">
                <button
                  @click="isAuthenticated ? (currentView = 'DASHBOARD') : openAuthModal('LOGIN')"
                  class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white font-black text-sm rounded-2xl shadow-[6px_6px_16px_rgba(227,116,52,0.4),-4px_-4px_12px_#ffffff] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{{ isAuthenticated ? 'Buka Dashboard Grup' : 'Masuk' }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <a
                  href="#model"
                  class="w-full sm:w-auto px-7 py-3.5 bg-[#eaf0f7] text-[#007979] font-extrabold text-sm rounded-2xl shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] active:shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] hover:text-[#24B1B1] hover:scale-[1.01] transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Pelajari Skema</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
            </div>

            <!-- Tiga Kartu Sorotan Mini Neumorphic -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] transition-all duration-200 hover:-translate-y-0.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007979] to-[#005a5a] text-white flex items-center justify-center mb-2.5 shadow-[2px_2px_6px_rgba(0,121,121,0.3),-2px_-2px_5px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="font-extrabold text-slate-800 text-xs mb-1">Tanpa Potongan</p>
                <p class="text-[11px] text-slate-500 leading-snug">Dana 100% diterima penuh oleh bendahara.</p>
              </div>

              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] transition-all duration-200 hover:-translate-y-0.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E37434] to-[#c6581b] text-white flex items-center justify-center mb-2.5 shadow-[2px_2px_6px_rgba(227,116,52,0.3),-2px_-2px_5px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p class="font-extrabold text-slate-800 text-xs mb-1">QRIS Dinamis P2P</p>
                <p class="text-[11px] text-slate-500 leading-snug">Langsung transfer ke bendahara via scan QRIS atau rekening bank.</p>
              </div>

              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] transition-all duration-200 hover:-translate-y-0.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#24B1B1] to-[#1a9595] text-white flex items-center justify-center mb-2.5 shadow-[2px_2px_6px_rgba(36,177,177,0.3),-2px_-2px_5px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p class="font-extrabold text-[#007979] text-xs mb-1">Buku Kas Terbuka</p>
                <p class="text-[11px] text-slate-500 leading-snug">Setiap pengeluaran dapat diaudit setiap saat oleh warga.</p>
              </div>
            </div>
          </div>

          <!-- Hero Right Column: Clean Neumorphic Interactive Simulation Card (Tanpa Bar HP) -->
          <div class="lg:col-span-5 w-full flex justify-center">
            
            <div class="w-full max-w-md rounded-3xl p-5 sm:p-6 bg-[#eaf0f7] shadow-[8px_8px_22px_#cad5e2,-8px_-8px_22px_#ffffff] border border-white/60">
              
              <!-- Card Top Header -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E37434] to-[#ce6326] text-white flex items-center justify-center font-black text-sm shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff]">
                    e
                  </div>
                  <div>
                    <p class="text-xs font-black text-slate-800">Blok B-07 / Griya Asri</p>
                    <p class="text-[11px] text-slate-500 font-medium">Periode September 2026</p>
                  </div>
                </div>
                <span class="text-[11px] font-black px-3 py-1 rounded-xl bg-[#FFE2AF] text-[#007979] shadow-[inset_1px_1px_2px_#dfc79b,inset_-1px_-1px_2px_#ffffff]">
                  Tagihan Aktif
                </span>
              </div>

              <!-- Segmented Controls / Tabs -->
              <div class="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] mb-4 text-xs">
                <button
                  @click="simTab = 'BILL'"
                  :class="[
                    'py-2 rounded-xl transition-all duration-200 text-center font-bold',
                    simTab === 'BILL'
                      ? 'bg-[#eaf0f7] text-slate-800 shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]'
                      : 'text-slate-500 hover:text-slate-800'
                  ]"
                >
                  Rincian
                </button>
                <button
                  @click="simTab = 'QRIS'"
                  :class="[
                    'py-2 rounded-xl transition-all duration-200 text-center font-bold',
                    simTab === 'QRIS'
                      ? 'bg-[#eaf0f7] text-slate-800 shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]'
                      : 'text-slate-500 hover:text-slate-800'
                  ]"
                >
                  QRIS
                </button>
                <button
                  @click="simTab = 'HISTORY'"
                  :class="[
                    'py-2 rounded-xl transition-all duration-200 text-center font-bold',
                    simTab === 'HISTORY'
                      ? 'bg-[#eaf0f7] text-slate-800 shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]'
                      : 'text-slate-500 hover:text-slate-800'
                  ]"
                >
                  Riwayat
                </button>
              </div>

              <!-- TAB 1: Rincian Tagihan -->
              <div v-if="simTab === 'BILL'" class="space-y-4">
                <!-- Rincian Biaya (Soft Neumorphic Inset Well) -->
                <div class="rounded-2xl p-4 bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cbd7e5,inset_-2px_-2px_5px_#ffffff] space-y-2.5 text-xs">
                  <div class="flex justify-between items-center text-slate-600">
                    <span>Iuran Keamanan Lingkungan</span>
                    <span class="font-bold text-slate-800">Rp 75.000</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-600">
                    <span>Pengelolaan Sampah</span>
                    <span class="font-bold text-slate-800">Rp 45.000</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-600">
                    <span>Kas Sosial Warga</span>
                    <span class="font-bold text-slate-800">Rp 30.000</span>
                  </div>
                  <div class="flex justify-between items-center text-[#007979] pt-2 border-t border-slate-300/60 font-bold">
                    <span class="text-[11px]">Total Tagihan Pokok</span>
                    <span>Rp 150.000</span>
                  </div>
                </div>

                <!-- Total Nominal Raised Neumorphic Card -->
                <div class="rounded-2xl p-4 bg-gradient-to-br from-[#ffffff] to-[#e8eff8] shadow-[5px_5px_14px_#cad5e2,-5px_-5px_14px_#ffffff] border border-white/70 text-center">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Tagihan Periode Ini</span>
                  <p class="text-2xl sm:text-3xl font-black text-[#007979] tracking-tight my-0.5">Rp 150.000</p>
                  <p class="text-[11px] text-slate-500 font-medium">QRIS Dinamis Instan atau Rekening Bank Pengurus</p>
                </div>

                <!-- Tombol Aksi Taktil 3D -->
                <div>
                  <button
                    v-if="!paymentConfirmed"
                    @click="handlePaySimulation"
                    class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white text-xs sm:text-sm font-black shadow-[4px_4px_12px_rgba(227,116,52,0.4),-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(150,55,10,0.5)] transition-all flex items-center justify-center space-x-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>Simulasikan Pembayaran QRIS</span>
                  </button>
                  <div
                    v-else
                    class="w-full py-3 px-4 rounded-2xl bg-[#007979] text-white text-xs font-bold text-center shadow-[inset_2px_2px_5px_rgba(0,50,50,0.4)] flex items-center justify-center space-x-2 animate-fadeIn"
                  >
                    <svg class="w-4 h-4 text-[#FFE2AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pembayaran Terverifikasi & Masuk Kas!</span>
                  </div>
                </div>
              </div>

              <!-- TAB 2: QRIS Dynamic Preview -->
              <div v-else-if="simTab === 'QRIS'" class="py-3 text-center space-y-3">
                <div class="w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-3xl p-3 bg-white shadow-[6px_6px_14px_#cad5e2,-6px_-6px_14px_#ffffff] flex flex-col items-center justify-center">
                  <!-- QR Mockup -->
                  <div class="w-34 h-34 sm:w-36 sm:h-36 bg-[#eaf0f7] rounded-2xl p-2.5 shadow-[inset_2px_2px_4px_#c8d4e2,inset_-2px_-2px_4px_#ffffff] flex flex-col justify-between items-center relative">
                    <div class="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>

                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>

                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>

                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                      <div class="bg-transparent"></div>
                      <div class="bg-slate-800 rounded-sm"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="w-8 h-8 rounded-lg bg-[#E37434] text-white font-black text-xs flex items-center justify-center shadow-md">
                        e
                      </div>
                    </div>
                  </div>
                </div>
                <p class="text-xs font-bold text-slate-700">Scan via Mobile Banking & E-Wallet</p>
                <p class="text-[11px] text-slate-500">QRIS Statis/Dinamis langsung ke kas bendahara.</p>
              </div>

              <!-- TAB 3: Riwayat Pembayaran -->
              <div v-else class="space-y-2.5 py-1">
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between text-xs">
                  <div>
                    <p class="font-bold text-slate-800">Iuran Agustus 2026</p>
                    <p class="text-[10px] text-slate-500">10 Agu 2026 - Lunas</p>
                  </div>
                  <span class="text-[10px] font-black text-[#007979] bg-[#24B1B1]/15 px-2.5 py-1 rounded-lg">Rp 150.000</span>
                </div>
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between text-xs">
                  <div>
                    <p class="font-bold text-slate-800">Iuran Juli 2026</p>
                    <p class="text-[10px] text-slate-500">08 Jul 2026 - Lunas</p>
                  </div>
                  <span class="text-[10px] font-black text-[#007979] bg-[#24B1B1]/15 px-2.5 py-1 rounded-lg">Rp 150.000</span>
                </div>
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between text-xs">
                  <div>
                    <p class="font-bold text-slate-800">Iuran Juni 2026</p>
                    <p class="text-[10px] text-slate-500">05 Jun 2026 - Lunas</p>
                  </div>
                  <span class="text-[10px] font-black text-[#007979] bg-[#24B1B1]/15 px-2.5 py-1 rounded-lg">Rp 150.000</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>

    <!-- Bagian Tiga Pilar Utama: Keunggulan -->
    <section id="fitur" class="py-12 sm:py-16 lg:py-20 bg-[#eaf0f7]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="max-w-2xl mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-3">
            Tiga Landasan Utama Tata Kelola Kas Mandiri
          </h2>
          <p class="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
            Menghapus kesalahpahaman administrasi dan menyederhanakan tugas bendahara grup tanpa perantara penampung dana.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <!-- Card 1: Deep Teal Accent (#007979) -->
          <div class="rounded-3xl p-6 sm:p-8 bg-[#eaf0f7] shadow-[8px_8px_20px_#cad5e2,-8px_-8px_20px_#ffffff] hover:shadow-[12px_12px_26px_#c2cedd,-12px_-12px_26px_#ffffff] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex items-center justify-center mb-5 sm:mb-6 text-[#007979] font-black text-lg transition-transform duration-300 group-hover:scale-105">
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#007979] to-[#005a5a] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_6px_rgba(0,121,121,0.4)]">
                  01
                </div>
              </div>
              
              <h3 class="text-lg sm:text-xl font-black text-slate-800 mb-2.5 group-hover:text-[#007979] transition-colors">
                Tanpa Biaya Transaksi Platform
              </h3>
              
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Sistem tidak memotong dana sepeser pun. Seluruh pembayaran dialirkan murni antara warga dengan rekening resmi pengurus grup melalui QRIS dinamis.
              </p>
            </div>

            <div class="mt-6 sm:mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span class="text-xs font-black text-[#007979]">Efisiensi Kas 100%</span>
            </div>
          </div>

          <!-- Card 2: Cyan Teal Accent (#24B1B1) -->
          <div class="rounded-3xl p-6 sm:p-8 bg-[#eaf0f7] shadow-[8px_8px_20px_#cad5e2,-8px_-8px_20px_#ffffff] hover:shadow-[12px_12px_26px_#c2cedd,-12px_-12px_26px_#ffffff] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex items-center justify-center mb-5 sm:mb-6 text-[#24B1B1] font-black text-lg transition-transform duration-300 group-hover:scale-105">
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#24B1B1] to-[#1a9595] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_6px_rgba(36,177,177,0.4)]">
                  02
                </div>
              </div>
              
              <h3 class="text-lg sm:text-xl font-black text-slate-800 mb-2.5 group-hover:text-[#24B1B1] transition-colors">
                QRIS Dinamis & Konfirmasi Cepat
              </h3>
              
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Warga cukup scan QRIS langsung dari aplikasi perbankan atau e-wallet. Notifikasi pembayaran dan bukti transfer terverifikasi rapi tanpa perlu rekap manual.
              </p>
            </div>

            <div class="mt-6 sm:mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span class="text-xs font-black text-[#24B1B1]">Konfirmasi Praktis</span>
            </div>
          </div>

          <!-- Card 3: Terracotta Orange Accent (#E37434) -->
          <div class="rounded-3xl p-6 sm:p-8 bg-[#eaf0f7] shadow-[8px_8px_20px_#cad5e2,-8px_-8px_20px_#ffffff] hover:shadow-[12px_12px_26px_#c2cedd,-12px_-12px_26px_#ffffff] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex items-center justify-center mb-5 sm:mb-6 text-[#E37434] font-black text-lg transition-transform duration-300 group-hover:scale-105">
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E37434] to-[#ce6326] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_6px_rgba(227,116,52,0.4)]">
                  03
                </div>
              </div>
              
              <h3 class="text-lg sm:text-xl font-black text-slate-800 mb-2.5 group-hover:text-[#E37434] transition-colors">
                Buku Kas & Riwayat Audit Terbuka
              </h3>
              
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Setiap rupiah pengeluaran dapat dilampiri nota belanja digital. Seluruh mutasi kas tercatat permanen untuk pertanggungjawaban terbuka kepada warga.
              </p>
            </div>

            <div class="mt-6 sm:mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span class="text-xs font-black text-[#E37434]">Transparansi Menyeluruh</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Model Struktur Grup: Dua Skema -->
    <section id="model" class="py-12 sm:py-16 lg:py-20 bg-[#eaf0f7]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-3">
            Dua Model Struktur Fleksibel
          </h2>
          <p class="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
            Pilih cara pengelompokan yang paling sesuai dengan karakteristik lingkungan warga atau grup Anda.
          </p>
        </div>

        <!-- Neumorphic Segmented Control Switcher (Mobile First Responsive) -->
        <div class="flex justify-center mb-8 sm:mb-10">
          <div class="w-full sm:w-auto p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_4px_4px_8px_#cbd7e5,inset_-4px_-4px_8px_#ffffff] flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-2">
            <button
              @click="activeMode = 'PHYSICAL'"
              :class="[
                'w-full sm:w-auto px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2',
                activeMode === 'PHYSICAL'
                  ? 'bg-gradient-to-r from-[#007979] to-[#006060] text-white shadow-[4px_4px_12px_rgba(0,121,121,0.38),-3px_-3px_8px_#ffffff]'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Mode Unit Fisik (Hunian & Kost)</span>
            </button>
            <button
              @click="activeMode = 'DIRECT'"
              :class="[
                'w-full sm:w-auto px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2',
                activeMode === 'DIRECT'
                  ? 'bg-gradient-to-r from-[#E37434] to-[#ce6326] text-white shadow-[4px_4px_12px_rgba(227,116,52,0.38),-3px_-3px_8px_#ffffff]'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Mode Anggota Langsung (Personal)</span>
            </button>
          </div>
        </div>

        <!-- Content Panel: Unit Fisik Mode -->
        <div v-if="activeMode === 'PHYSICAL'" class="rounded-3xl p-6 sm:p-10 bg-[#eaf0f7] shadow-[10px_10px_24px_#cad5e2,-10px_-10px_24px_#ffffff] transition-all">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div class="lg:col-span-7 space-y-4 sm:space-y-6">
              <span class="inline-block px-3.5 py-1.5 rounded-full text-xs font-black bg-[#FFE2AF] text-[#007979] shadow-[inset_1px_1px_3px_#dfc79b]">
                Karakteristik Skema Unit Fisik
              </span>
              
              <h3 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                Tagihan Melekat pada Rumah, Ruko, atau Kamar Indekos
              </h3>
              
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Sangat tepat untuk RT, RW, klaster perumahan mandiri, dan indekos. Catatan pembayaran dan riwayat tunggakan tetap melekat pada nomor unit meskipun penghuni rumah atau penyewa kamar berganti.
              </p>

              <div class="space-y-2.5 sm:space-y-3">
                <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] text-xs text-slate-700 flex items-start space-x-3">
                  <div class="w-5 h-5 rounded-lg bg-[#007979] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <span class="font-extrabold text-slate-800">Kontinuitas Data:</span> Arsip iuran tidak hilang saat rumah dikontrakkan atau dihuni orang baru.
                  </div>
                </div>
                <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] text-xs text-slate-700 flex items-start space-x-3">
                  <div class="w-5 h-5 rounded-lg bg-[#007979] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <span class="font-extrabold text-slate-800">Pengelompokan Rapi:</span> Format terstruktur seperti "Blok A-05" atau "Kamar 102".
                  </div>
                </div>
              </div>
            </div>

            <!-- Neumorphic Preview Card Kanan -->
            <div class="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[#eaf0f7] shadow-[inset_3px_3px_8px_#cbd7e5,inset_-3px_-3px_8px_#ffffff] space-y-3.5">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <p class="text-xs font-black text-[#007979] uppercase tracking-wider">Pratinjau Pengelolaan Unit</p>
                <span class="text-[10px] font-bold text-slate-500">2 Unit Ditampilkan</span>
              </div>

              <!-- Unit 1 -->
              <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex justify-between items-center text-xs">
                <div>
                  <p class="font-extrabold text-slate-800">Rumah Blok C-05</p>
                  <p class="text-[11px] text-slate-500">Penghuni: Bpk. Hendrawan</p>
                </div>
                <span class="font-bold text-[#007979] bg-[#FFE2AF] px-3 py-1 rounded-xl shadow-[inset_1px_1px_2px_#dfc79b]">
                  Lunas Oktober
                </span>
              </div>

              <!-- Unit 2 -->
              <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex justify-between items-center text-xs">
                <div>
                  <p class="font-extrabold text-slate-800">Rumah Blok C-06</p>
                  <p class="text-[11px] text-slate-500">Penghuni: Ibu Ratih S.</p>
                </div>
                <span class="font-bold text-white bg-[#E37434] px-3 py-1 rounded-xl shadow-[2px_2px_5px_rgba(227,116,52,0.3)]">
                  Menunggu Bayar
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Content Panel: Anggota Langsung Mode -->
        <div v-else class="rounded-3xl p-6 sm:p-10 bg-[#eaf0f7] shadow-[10px_10px_24px_#cad5e2,-10px_-10px_24px_#ffffff] transition-all">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div class="lg:col-span-7 space-y-4 sm:space-y-6">
              <span class="inline-block px-3.5 py-1.5 rounded-full text-xs font-black bg-[#FFE2AF] text-[#E37434] shadow-[inset_1px_1px_3px_#dfc79b]">
                Karakteristik Anggota Langsung
              </span>
              
              <h3 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                Tagihan Tertuju Langsung ke Individu Personal
              </h3>
              
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Sangat tepat untuk perkumpulan olahraga, arisan, alumni, dan komunitas hobi. Penagihan langsung dialokasikan ke nomor kontak masing-masing anggota tanpa bergantung pada alamat hunian fisik.
              </p>

              <div class="space-y-2.5 sm:space-y-3">
                <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] text-xs text-slate-700 flex items-start space-x-3">
                  <div class="w-5 h-5 rounded-lg bg-[#E37434] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <span class="font-extrabold text-slate-800">Fleksibilitas Iuran:</span> Mendukung iuran bulanan tetap maupun iuran insidental per acara.
                  </div>
                </div>
                <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] text-xs text-slate-700 flex items-start space-x-3">
                  <div class="w-5 h-5 rounded-lg bg-[#E37434] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                  <div>
                    <span class="font-extrabold text-slate-800">Keaktifan Personal:</span> Riwayat kehadiran dan kepatuhan iuran tiap anggota tercatat rapi.
                  </div>
                </div>
              </div>
            </div>

            <!-- Neumorphic Preview Card Kanan -->
            <div class="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[#eaf0f7] shadow-[inset_3px_3px_8px_#cbd7e5,inset_-3px_-3px_8px_#ffffff] space-y-3.5">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <p class="text-xs font-black text-[#E37434] uppercase tracking-wider">Pratinjau Anggota Grup</p>
                <span class="text-[10px] font-bold text-slate-500">2 Anggota Ditampilkan</span>
              </div>

              <!-- Member 1 -->
              <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex justify-between items-center text-xs">
                <div>
                  <p class="font-extrabold text-slate-800">Dimas Pratama</p>
                  <p class="text-[11px] text-slate-500">Iuran Sewa Lapangan 28 Sep</p>
                </div>
                <span class="font-bold text-[#007979] bg-[#FFE2AF] px-3 py-1 rounded-xl shadow-[inset_1px_1px_2px_#dfc79b]">
                  Lunas
                </span>
              </div>

              <!-- Member 2 -->
              <div class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[5px_5px_12px_#cad5e2,-5px_-5px_12px_#ffffff] flex justify-between items-center text-xs">
                <div>
                  <p class="font-extrabold text-slate-800">Fajar Nugroho</p>
                  <p class="text-[11px] text-slate-500">Iuran Sewa Lapangan 28 Sep</p>
                </div>
                <span class="font-bold text-white bg-[#E37434] px-3 py-1 rounded-xl shadow-[2px_2px_5px_rgba(227,116,52,0.3)]">
                  Belum Konfirmasi
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- Bagian Transparansi Kas: Buku Kas Terbuka -->
    <section id="pembukuan" class="py-12 sm:py-16 lg:py-20 bg-[#eaf0f7]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
              Buku Kas Terbuka & Real-time
            </h2>
            <p class="text-slate-600 text-sm sm:text-base font-medium">
              Seluruh mutasi penerimaan iuran dan belanja operasional dapat dipantau oleh setiap anggota secara transparan.
            </p>
          </div>
          
          <!-- Status Kas (Tanpa Titik) -->
          <div class="px-4 py-2.5 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] text-xs font-extrabold text-[#007979] self-start md:self-auto">
            Surplus Kas Terverifikasi
          </div>
        </div>

        <!-- Filter Controls (Neumorphic Inset Search Bar + Filter Pills) -->
        <div class="p-3.5 sm:p-4 rounded-3xl bg-[#eaf0f7] shadow-[6px_6px_16px_#cad5e2,-6px_-6px_16px_#ffffff] mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          
          <!-- Inset Search Input -->
          <div class="w-full sm:w-80 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari transaksi atau kategori..."
              class="w-full py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 bg-[#eaf0f7] rounded-xl shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border-none focus:outline-none focus:ring-1 focus:ring-[#007979]"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Type Filters -->
          <div class="flex items-center space-x-2 justify-start sm:justify-end overflow-x-auto pb-1 sm:pb-0">
            <button
              @click="filterType = 'ALL'"
              :class="[
                'px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap',
                filterType === 'ALL'
                  ? 'bg-[#eaf0f7] text-[#007979] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]'
                  : 'text-slate-600 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] hover:text-slate-900'
              ]"
            >
              Semua
            </button>
            <button
              @click="filterType = 'INCOME'"
              :class="[
                'px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap',
                filterType === 'INCOME'
                  ? 'bg-[#007979] text-white shadow-[inset_2px_2px_4px_rgba(0,60,60,0.5)]'
                  : 'text-[#007979] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff]'
              ]"
            >
              Pemasukan
            </button>
            <button
              @click="filterType = 'EXPENSE'"
              :class="[
                'px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap',
                filterType === 'EXPENSE'
                  ? 'bg-[#E37434] text-white shadow-[inset_2px_2px_4px_rgba(150,55,10,0.5)]'
                  : 'text-[#E37434] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff]'
              ]"
            >
              Pengeluaran
            </button>
          </div>

        </div>

        <!-- Tabel Mutasi Kas Neumorphic (Mobile Scrollable) -->
        <div class="rounded-3xl p-2 bg-[#eaf0f7] shadow-[8px_8px_20px_#cad5e2,-8px_-8px_20px_#ffffff] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm min-w-[560px]">
              <thead class="text-slate-500 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 sm:px-6">Tanggal</th>
                  <th class="py-3.5 px-4 sm:px-6">Kategori</th>
                  <th class="py-3.5 px-4 sm:px-6">Keterangan Transaksi</th>
                  <th class="py-3.5 px-4 sm:px-6 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 text-slate-800 font-medium">
                <tr
                  v-for="(item, index) in filteredLedger"
                  :key="index"
                  class="hover:bg-white/40 transition-colors"
                >
                  <td class="py-3.5 px-4 sm:px-6 text-xs text-slate-500 font-bold whitespace-nowrap">{{ item.date }}</td>
                  <td class="py-3.5 px-4 sm:px-6">
                    <span
                      :class="[
                        'inline-block px-3 py-1 rounded-xl text-xs font-bold shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]',
                        item.type === 'INCOME' ? 'bg-[#FFE2AF] text-[#007979]' : 'bg-slate-200 text-slate-700'
                      ]"
                    >
                      {{ item.category }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 font-bold text-slate-800 text-xs sm:text-sm">{{ item.title }}</td>
                  <td
                    :class="[
                      'py-3.5 px-4 sm:px-6 text-right font-black text-xs sm:text-sm whitespace-nowrap',
                      item.type === 'INCOME' ? 'text-[#007979]' : 'text-[#E37434]'
                    ]"
                  >
                    {{ item.type === 'INCOME' ? '+ ' + item.amount : '- ' + item.amount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>

    <!-- Daftar Grup Terdaftar: Neumorphic Grid Cards -->
    <section id="demo" class="py-12 sm:py-16 lg:py-20 bg-[#eaf0f7]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="mb-8 sm:mb-10">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2">
            Daftar Grup Terdaftar
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 font-medium">
            Pilih grup untuk meninjau pembukuan dan memantau kepatuhan pembayaran berjalan.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div
            v-for="group in sampleGroups"
            :key="group.id"
            class="rounded-3xl p-6 sm:p-7 bg-[#eaf0f7] shadow-[8px_8px_20px_#cad5e2,-8px_-8px_20px_#ffffff] hover:shadow-[12px_12px_24px_#c2cedd,-12px_-12px_24px_#ffffff] transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div class="flex items-center justify-between mb-4">
                <span :class="['text-xs font-bold px-3 py-1 rounded-xl shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]', group.badgeBg]">
                  {{ group.type }}
                </span>
                <span class="text-[10px] font-extrabold text-slate-600 bg-[#eaf0f7] px-2.5 py-1 rounded-xl shadow-[3px_3px_6px_#cad5e2,-3px_-3px_6px_#ffffff]">
                  {{ group.status }}
                </span>
              </div>

              <h3 class="text-lg sm:text-xl font-black text-slate-800 mb-4 group-hover:text-[#007979] transition-colors">
                {{ group.name }}
              </h3>

              <!-- Inset Stats Box -->
              <div class="space-y-2.5 text-xs text-slate-700 mb-6 p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff]">
                <div class="flex justify-between">
                  <span class="font-medium text-slate-500">Jumlah Unit/Anggota</span>
                  <span class="font-extrabold text-slate-800">{{ group.totalUnits }} Terdaftar</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium text-slate-500">Total Tagihan Periode Ini</span>
                  <span class="font-extrabold text-slate-800">{{ group.activeBills }}</span>
                </div>
                <div class="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span class="font-medium text-slate-500">Tingkat Kepatuhan</span>
                  <span class="font-black text-[#007979] text-sm">{{ group.collectionRate }}</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span class="text-slate-500 font-semibold">Buku Kas Terbuka</span>
              <span class="text-[#E37434] font-extrabold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Dashboard</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Call to Action Banner -->
    <section class="py-12 sm:py-16 lg:py-20 bg-[#eaf0f7]">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl sm:rounded-[36px] p-6 sm:p-12 lg:p-14 bg-gradient-to-br from-[#007979] to-[#005a5a] text-white shadow-[12px_12px_28px_#c2cedd,-12px_-12px_28px_#ffffff] relative overflow-hidden text-center">
          
          <div class="relative z-10 max-w-3xl mx-auto">
            <h2 class="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
              Wujudkan Pengelolaan Kas Grup yang Tertib dan Terpercaya
            </h2>
            <p class="text-xs sm:text-sm lg:text-base text-[#FFE2AF] font-medium leading-relaxed mb-7 max-w-2xl mx-auto">
              Mulai atur sistem iuran lingkungan atau grup Anda hari ini. Sangat mudah digunakan oleh pengurus tanpa memerlukan perangkat kasir khusus.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-3.5 sm:gap-4">
              <button class="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white font-black text-xs sm:text-sm rounded-2xl shadow-[6px_6px_16px_rgba(0,40,40,0.4),-3px_-3px_10px_rgba(255,255,255,0.2)] active:shadow-[inset_2px_2px_5px_rgba(150,55,10,0.5)] hover:scale-[1.01] transition-all">
                Masuk
              </button>
              <button class="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white/10 hover:bg-white/15 text-white font-black text-xs sm:text-sm rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm active:scale-95 transition-all">
                Pelajari Panduan Pengurus
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
    </div>

    <!-- Footer: Soft Neumorphic Tone -->
    <footer class="bg-[#eaf0f7] py-10 sm:py-12 text-xs border-t border-slate-200/80">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E37434] to-[#ce6326] text-white flex items-center justify-center font-black text-sm shadow-[3px_3px_7px_#cad5e2,-3px_-3px_7px_#ffffff]">
            e
          </div>
          <div>
            <span class="font-black text-base text-slate-800">eYuran</span>
            <span class="text-slate-500 font-medium ml-2">— Platform Penagihan dan Kas Grup Mandiri</span>
          </div>
        </div>

        <p class="text-slate-500 font-medium text-center sm:text-right">© 2026 eYuran. Seluruh hak cipta dilindungi.</p>
      </div>
    </footer>

    <!-- Modal Autentikasi Color-Blocking -->
    <AuthModal
      :is-open="isAuthModalOpen"
      :initial-tab="authModalTab"
      @close="isAuthModalOpen = false"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

*,
*::before,
*::after,
html,
body,
button,
input,
optgroup,
select,
textarea,
h1, h2, h3, h4, h5, h6, p, span, a, div, table, th, td {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
}

html {
  scroll-behavior: smooth;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}

/* Mobile Menu Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.7, 0, 0.84, 0);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
