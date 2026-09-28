<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDate } from '../../utils/formatters'

const props = defineProps<{
  activeMembership: any
  isPengurus: boolean
  user: any
  groupMembers: any[]
  membersLoading: boolean
  membersError: string | null
  memberActionLoading: string | null
}>()

defineEmits<{
  (e: 'goToDashboard'): void
  (e: 'approveMember', memberId: string): void
  (e: 'rejectMember', memberId: string): void
  (e: 'copyJoinCode', code: string): void
}>()

// Internal reactive search & filter
const memberSearchQuery = ref('')
const memberTabFilter = ref<'ALL' | 'PENDING'>('ALL')

const pendingMembersCount = computed(() => {
  return props.groupMembers.filter((m: any) => m.status === 'PENDING').length
})

const filteredGroupMembers = computed(() => {
  return props.groupMembers.filter((m: any) => {
    // Filter status tab
    if (memberTabFilter.value === 'PENDING' && m.status !== 'PENDING') {
      return false
    }

    // Filter search query
    const q = memberSearchQuery.value.trim().toLowerCase()
    if (!q) return true

    const fullNameMatch = m.user?.fullName?.toLowerCase().includes(q)
    const phoneMatch = m.user?.phone?.toLowerCase().includes(q)
    const unitMatch = m.unit?.name?.toLowerCase().includes(q)
    const roleMatch = m.role?.toLowerCase().includes(q)

    return fullNameMatch || phoneMatch || unitMatch || roleMatch
  })
})

const getMemberRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'bg-[#FFE2AF] text-[#E37434] font-black'
    case 'ADMIN':
      return 'bg-[#007979]/15 text-[#007979] font-black'
    default:
      return 'bg-slate-200/80 text-slate-700 font-bold'
  }
}

const getMemberRoleLabel = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'Ketua / Pemilik'
    case 'ADMIN':
      return 'Pengurus / Bendahara'
    case 'MEMBER':
      return 'Warga / Penghuni'
    default:
      return role
  }
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
          Daftar Anggota & Warga Komunitas
        </h3>
        <p class="text-xs text-slate-500 font-medium">
          {{ groupMembers.length }} anggota terdaftar dalam grup {{ activeMembership?.group.name }}
        </p>
      </div>

      <!-- Quick Action: Salin Kode Gabung -->
      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="$emit('copyJoinCode', activeMembership?.group.joinCode)"
          class="px-3.5 py-2 rounded-2xl bg-[#eaf0f7] text-[#007979] font-black text-xs shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] hover:bg-white/60 transition-all flex items-center space-x-1.5 cursor-pointer"
          title="Salin kode gabung grup untuk dibagikan ke warga baru"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Kode: <strong class="font-mono">{{ activeMembership?.group.joinCode }}</strong></span>
        </button>
      </div>
    </div>

    <!-- Error message if any -->
    <div v-if="membersError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
      {{ membersError }}
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
            v-model="memberSearchQuery"
            type="text"
            placeholder="Cari nama warga, nomor unit, nomor HP, peran..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
          />
        </div>

        <!-- Filter Chips (Semua vs Menunggu Persetujuan) -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            @click="memberTabFilter = 'ALL'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            :class="memberTabFilter === 'ALL'
              ? 'bg-[#007979] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            Semua Warga ({{ groupMembers.length }})
          </button>
          <button
            v-if="pendingMembersCount > 0 || isPengurus"
            type="button"
            @click="memberTabFilter = 'PENDING'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5"
            :class="memberTabFilter === 'PENDING'
              ? 'bg-[#E37434] text-white shadow-xs'
              : 'bg-[#eaf0f7] text-[#E37434] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2]'"
          >
            <span>Menunggu Persetujuan</span>
            <span
              v-if="pendingMembersCount > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
              :class="memberTabFilter === 'PENDING' ? 'bg-white text-[#E37434]' : 'bg-[#FFE2AF] text-[#E37434]'"
            >
              {{ pendingMembersCount }}
            </span>
          </button>
        </div>
      </div>

      <div class="text-[11px] text-slate-500 font-semibold flex items-center justify-between pt-1 border-t border-slate-200/60">
        <span>Menampilkan {{ filteredGroupMembers.length }} dari {{ groupMembers.length }} anggota</span>
        <span v-if="memberSearchQuery" class="text-[#007979] font-bold">Filter pencarian aktif</span>
      </div>
    </div>

    <!-- Members List Area Card -->
    <div class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 space-y-3">
      <!-- Loading State -->
      <div v-if="membersLoading" class="p-12 text-center text-slate-500 font-medium text-xs">
        Memuat daftar anggota...
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGroupMembers.length === 0" class="p-12 text-center text-slate-500 font-medium text-xs space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center mx-auto text-slate-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p v-if="memberSearchQuery">Tidak ada anggota yang cocok dengan kata kunci "{{ memberSearchQuery }}".</p>
        <p v-else-if="memberTabFilter === 'PENDING'">Tidak ada pengajuan anggota baru yang menunggu persetujuan saat ini.</p>
        <p v-else>Belum ada anggota terdaftar dalam grup ini.</p>
      </div>

      <!-- Member List Items -->
      <div v-else class="space-y-3">
        <div
          v-for="m in filteredGroupMembers"
          :key="m.id"
          class="p-4 sm:p-5 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:-translate-y-0.5 transition-all"
        >
          <!-- Member Info Left -->
          <div class="flex items-center space-x-3.5 min-w-0">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007979] to-[#005a5a] text-white flex-shrink-0 flex items-center justify-center font-black text-sm shadow-[2px_2px_5px_rgba(0,121,121,0.3)]">
              {{ m.user?.fullName?.charAt(0) || 'U' }}
            </div>

            <div class="min-w-0">
              <div class="flex items-center space-x-2 flex-wrap">
                <span class="font-black text-sm sm:text-base text-slate-800 truncate">
                  {{ m.user?.fullName }}
                </span>
                <span v-if="m.user?.id === user?.id" class="px-2 py-0.5 rounded-md bg-[#007979]/10 text-[#007979] font-black text-[10px]">
                  Anda
                </span>
                <span
                  class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase"
                  :class="getMemberRoleBadgeClass(m.role)"
                >
                  {{ getMemberRoleLabel(m.role) }}
                </span>
              </div>

              <div class="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-1 flex-wrap">
                <span v-if="m.unit" class="text-slate-700 font-bold">
                  Unit: {{ m.unit.name }}
                </span>
                <span v-if="m.unit && m.user?.phone">•</span>
                <span v-if="m.user?.phone">{{ m.user.phone }}</span>
                <span v-if="m.user?.phone && m.joinedAt">•</span>
                <span v-if="m.joinedAt">Bergabung {{ formatDate(m.joinedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Member Status & Actions Right -->
          <div class="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
            <!-- If status is PENDING -->
            <template v-if="m.status === 'PENDING'">
              <span class="px-3 py-1 rounded-xl bg-[#FFE2AF] text-[#E37434] text-[11px] font-black uppercase shadow-[inset_1px_1px_2px_#dfc79b]">
                Menunggu Persetujuan
              </span>

              <template v-if="isPengurus">
                <button
                  type="button"
                  :disabled="memberActionLoading === m.id"
                  @click="$emit('approveMember', m.id)"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs shadow-[2px_2px_5px_rgba(5,150,105,0.3)] active:scale-95 transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  title="Setujui warga ini bergabung"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ memberActionLoading === m.id ? '...' : 'Setujui' }}</span>
                </button>

                <button
                  type="button"
                  :disabled="memberActionLoading === m.id"
                  @click="$emit('rejectMember', m.id)"
                  class="px-3 py-2 rounded-xl bg-[#eaf0f7] text-rose-600 font-black text-xs shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  title="Tolak permohonan gabung"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Tolak</span>
                </button>
              </template>
            </template>

            <!-- If status is APPROVED -->
            <template v-else>
              <span class="px-3 py-1 rounded-xl bg-[#007979]/10 text-[#007979] text-[11px] font-black uppercase">
                Aktif
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
