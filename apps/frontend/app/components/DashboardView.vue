<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useGroups, type GroupPreview } from '../composables/useGroups'
import { useNavigation } from '../composables/useNavigation'
import { useToast } from '../composables/useToast'
import OverviewView from './dashboard/OverviewView.vue'
import LedgerView from './dashboard/LedgerView.vue'
import MembersView from './dashboard/MembersView.vue'
import UnitsView from './dashboard/UnitsView.vue'
import CreateGroupModal from './modals/CreateGroupModal.vue'
import JoinGroupModal from './modals/JoinGroupModal.vue'
import CreateBillModal from './modals/CreateBillModal.vue'
import RecordLedgerModal from './modals/RecordLedgerModal.vue'
import PaymentConfigModal from './modals/PaymentConfigModal.vue'
import PaymentModal from './modals/PaymentModal.vue'
import VerifyPaymentModal from './modals/VerifyPaymentModal.vue'
import AllBillsModal from './modals/AllBillsModal.vue'
import ReceiptModal from './modals/ReceiptModal.vue'

const toast = useToast()
const { user } = useAuth()
const { activeTab, setActiveTab } = useNavigation()
const {
  myGroups,
  fetchMyGroups,
  createGroup,
  previewGroup,
  joinGroup,
  leaveGroup,
  getGroupLedger,
  getMyBills,
  isCreateModalOpen,
  isJoinModalOpen,
  isBillModalOpen,
  openBillModal,
  createBill,
  getGroupUnits,
  createUnit,
  createUnitsBulk,
  deleteUnit,
  getGroupMembers,
  updateMemberRole,
  removeMember,
  approveGroupMember,
  rejectGroupMember,
  recordLedgerExpense,
  recordLedgerIncome,
  deleteLedgerEntry,
  getGroupBills,
  getPaymentConfig,
  updatePaymentConfig,
  getBillDetail,
  submitPayment,
  verifyPayment,
} = useGroups()

const selectedGroupIndex = ref(0)
const isGroupDropdownOpen = ref(false)
const ledgerData = ref<any>(null)
const myBills = ref<any[]>([])
const allGroupBills = ref<any[]>([])
const loadingData = ref(false)
const copiedJoinCode = ref(false)

const myUnpaidBillsTotal = computed(() => {
  return myBills.value
    .filter((b: any) => b.status === 'UNPAID')
    .reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0)
})

const myUnpaidBillsCount = computed(() => {
  return myBills.value.filter((b: any) => b.status === 'UNPAID').length
})

const myPendingVerificationBillsCount = computed(() => {
  return myBills.value.filter((b: any) => b.status === 'PENDING_VERIFICATION').length
})

const myPendingVerificationBillsTotal = computed(() => {
  return myBills.value
    .filter((b: any) => b.status === 'PENDING_VERIFICATION')
    .reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0)
})

const activeMembership = computed(() => {
  if (myGroups.value && myGroups.value.length > 0) {
    return myGroups.value[selectedGroupIndex.value] || myGroups.value[0]
  }
  return null
})

const currentGroupId = computed(() => {
  return activeMembership.value?.groupId || activeMembership.value?.group?.id || ''
})

const isPengurus = computed(() => {
  return (
    activeMembership.value?.status === 'APPROVED' &&
    (activeMembership.value?.role === 'OWNER' || activeMembership.value?.role === 'ADMIN')
  )
})

const isPendingApproval = computed(() => {
  return activeMembership.value?.status === 'PENDING'
})

const pendingVerificationCount = computed(() => {
  return allGroupBills.value.filter((b: any) => b.status === 'PENDING_VERIFICATION').length
})

const pendingVerificationBills = computed(() => {
  return allGroupBills.value.filter((b: any) => b.status === 'PENDING_VERIFICATION')
})

const copyJoinCode = async (code?: string) => {
  if (!code) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copiedJoinCode.value = true
    toast.success('Kode grup berhasil disalin!')
    setTimeout(() => {
      copiedJoinCode.value = false
    }, 2000)
  } catch (err) {
    toast.error('Gagal menyalin kode grup')
    console.error('Failed to copy join code', err)
  }
}

// Polling status persetujuan keanggotaan
let pollInterval: ReturnType<typeof setInterval> | null = null

const startPollingMembership = () => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(async () => {
    if (!isPendingApproval.value) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      return
    }
    await fetchMyGroups()
    if (!isPendingApproval.value) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      await loadGroupDetails()
      toast.success('Selamat! Keanggotaan kamu telah disetujui 🎉')
    }
  }, 30000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const leavingGroup = ref(false)
const handleLeaveGroup = async (targetMembership?: any) => {
  const target = targetMembership || activeMembership.value
  if (!target || leavingGroup.value) return
  const actionText = target.status === 'PENDING' ? 'membatalkan keanggotaan dari' : 'keluar dari'
  const confirmed = confirm(`Yakin ingin ${actionText} grup "${target.group.name}"?`)
  if (!confirmed) return

  leavingGroup.value = true
  try {
    await leaveGroup(target.groupId)
    toast.success(
      target.status === 'PENDING'
        ? 'Keanggotaan berhasil dibatalkan.'
        : `Berhasil keluar dari grup "${target.group.name}".`,
    )
    isGroupDropdownOpen.value = false
    await fetchMyGroups()
    selectedGroupIndex.value = 0
  } catch (err: any) {
    toast.error(err?.data?.message || 'Gagal memproses.')
  } finally {
    leavingGroup.value = false
  }
}

const loadGroupDetails = async () => {
  if (!currentGroupId.value) return
  loadingData.value = true
  const gId = currentGroupId.value

  try {
    const promises: Promise<any>[] = [
      getGroupLedger(gId),
      getMyBills(gId),
      loadGroupMembersList(),
      loadUnitsList(),
    ]
    if (isPengurus.value) {
      promises.push(getGroupBills(gId))
    }

    const [ledger, bills, _members, _units, allBills] = await Promise.all(promises)
    ledgerData.value = ledger
    myBills.value = bills || []
    if (allBills) {
      allGroupBills.value = allBills || []
    }
  } finally {
    loadingData.value = false
  }
}

watch(selectedGroupIndex, async () => {
  stopPolling()
  if (isPendingApproval.value) {
    startPollingMembership()
  } else {
    await loadGroupDetails()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'MEMBERS' && currentGroupId.value) {
    loadGroupMembersList()
  } else if (newTab === 'UNITS' && currentGroupId.value) {
    loadUnitsList()
  }
})

onMounted(async () => {
  await fetchMyGroups()
  if (myGroups.value.length > 0) {
    if (isPendingApproval.value) {
      startPollingMembership()
    } else {
      await loadGroupDetails()
    }
  }
})

onUnmounted(() => {
  stopPolling()
})

// ==========================================
// 1. MODAL BUAT GRUP
// ==========================================
const createLoading = ref(false)
const createError = ref<string | null>(null)

const handleCreateGroup = async (payload: {
  name: string
  type: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'
  description?: string
}) => {
  createLoading.value = true
  createError.value = null

  try {
    await createGroup(payload)
    isCreateModalOpen.value = false
    selectedGroupIndex.value = 0
    await loadGroupDetails()
  } catch (err: any) {
    createError.value = err.message || 'Gagal membuat grup.'
  } finally {
    createLoading.value = false
  }
}

// ==========================================
// 2. MODAL GABUNG GRUP
// ==========================================
const joinPreview = ref<GroupPreview | null>(null)
const lookupLoading = ref(false)
const joinLoading = ref(false)
const joinError = ref<string | null>(null)

const handleLookupCode = async (code: string) => {
  lookupLoading.value = true
  joinError.value = null
  joinPreview.value = null

  try {
    const preview = await previewGroup(code)
    joinPreview.value = preview
  } catch (err: any) {
    joinError.value = err.message || 'Kode grup tidak ditemukan.'
  } finally {
    lookupLoading.value = false
  }
}

const handleJoinGroup = async (payload: {
  joinCode: string
  unitId?: string
  unitName?: string
}) => {
  joinLoading.value = true
  joinError.value = null

  try {
    await joinGroup(payload)
    joinPreview.value = null
    isJoinModalOpen.value = false
    selectedGroupIndex.value = 0
    await loadGroupDetails()
  } catch (err: any) {
    joinError.value = err.message || 'Gagal bergabung dengan grup.'
  } finally {
    joinLoading.value = false
  }
}

// ==========================================
// 3. MODAL SET TAGIHAN
// ==========================================
const billLoading = ref(false)
const billError = ref<string | null>(null)
const billSuccess = ref<string | null>(null)
const groupUnitsList = ref<any[]>([])
const groupMembersList = ref<any[]>([])

watch(isBillModalOpen, async (val) => {
  if (val && activeMembership.value) {
    billError.value = null
    billSuccess.value = null
    const gId = currentGroupId.value
    if (activeMembership.value.group.type === 'PHYSICAL_UNIT') {
      const units = await getGroupUnits(gId)
      groupUnitsList.value = units
    } else {
      const members = await getGroupMembers(gId)
      groupMembersList.value = members
    }
  }
})

const handleSaveRecurringRule = async (payload: {
  title: string
  frequency: 'MONTHLY' | 'YEARLY'
  items: Array<{ name: string; amount: number }>
}) => {
  billLoading.value = true
  billError.value = null

  try {
    const periodLabel =
      payload.frequency === 'MONTHLY' ? 'Iuran Rutin Bulanan' : 'Iuran Rutin Tahunan'

    await createBill(currentGroupId.value, {
      title: payload.title,
      period: periodLabel,
      applyToAll: true,
      items: payload.items,
    })

    billSuccess.value = 'Aturan tarif iuran rutin berhasil diterapkan untuk seluruh warga!'
    await loadGroupDetails()

    setTimeout(() => {
      isBillModalOpen.value = false
      billSuccess.value = null
    }, 1200)
  } catch (err: any) {
    billError.value = err.message || 'Gagal menerapkan aturan iuran rutin.'
  } finally {
    billLoading.value = false
  }
}

const handleCreateOnceBill = async (payload: {
  title: string
  periodLabel: string
  applyToAll: boolean
  unitId?: string
  memberId?: string
  items: Array<{ name: string; amount: number }>
}) => {
  billLoading.value = true
  billError.value = null

  try {
    await createBill(currentGroupId.value, {
      title: payload.title,
      period: payload.periodLabel,
      applyToAll: payload.applyToAll,
      unitId: payload.unitId,
      memberId: payload.memberId,
      items: payload.items,
    })

    billSuccess.value = 'Tagihan sekali bayar berhasil diterbitkan!'
    await loadGroupDetails()

    setTimeout(() => {
      isBillModalOpen.value = false
      billSuccess.value = null
    }, 1200)
  } catch (err: any) {
    billError.value = err.message || 'Gagal menerbitkan tagihan sekali bayar.'
  } finally {
    billLoading.value = false
  }
}

// ==========================================
// 4. MODAL CATAT MUTASI KAS
// ==========================================
const isLedgerModalOpen = ref(false)
const ledgerModalType = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const ledgerLoading = ref(false)
const ledgerError = ref<string | null>(null)
const ledgerSuccess = ref<string | null>(null)

const openLedgerModal = (type: 'EXPENSE' | 'INCOME' = 'EXPENSE') => {
  ledgerModalType.value = type
  ledgerError.value = null
  ledgerSuccess.value = null
  isLedgerModalOpen.value = true
}

const handleRecordLedger = async (payload: {
  type: 'EXPENSE' | 'INCOME'
  amount: number
  category: string
  description: string
  entryDate?: string
}) => {
  if (!activeMembership.value) return
  ledgerLoading.value = true
  ledgerError.value = null

  try {
    if (payload.type === 'EXPENSE') {
      await recordLedgerExpense(currentGroupId.value, payload)
    } else {
      await recordLedgerIncome(currentGroupId.value, payload)
    }

    ledgerSuccess.value = `Catatan ${payload.type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'} berhasil disimpan!`
    await loadGroupDetails()

    setTimeout(() => {
      isLedgerModalOpen.value = false
      ledgerSuccess.value = null
    }, 1200)
  } catch (err: any) {
    ledgerError.value = err.message || 'Gagal menyimpan catatan kas.'
  } finally {
    ledgerLoading.value = false
  }
}

const handleDeleteLedgerEntry = async (entryId: string) => {
  if (!currentGroupId.value) return
  const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus catatan kas ini?')
  if (!confirmDelete) return

  try {
    await deleteLedgerEntry(currentGroupId.value, entryId)
    await loadGroupDetails()
    toast.success('Catatan kas berhasil dihapus!')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus catatan kas')
  }
}

// ==========================================
// 5. MANAJEMEN ANGGOTA GRUP
// ==========================================
const groupMembers = ref<any[]>([])
const membersLoading = ref(false)
const membersError = ref<string | null>(null)
const memberActionLoading = ref<string | null>(null)

const loadGroupMembersList = async () => {
  if (!currentGroupId.value) return
  membersLoading.value = true
  membersError.value = null
  try {
    const data = await getGroupMembers(currentGroupId.value)
    groupMembers.value = data || []
  } catch (err: any) {
    membersError.value = err.message || 'Gagal memuat daftar anggota'
  } finally {
    membersLoading.value = false
  }
}

const handleApproveMember = async (memberId: string) => {
  if (!currentGroupId.value) return
  memberActionLoading.value = memberId
  try {
    await approveGroupMember(currentGroupId.value, memberId)
    await loadGroupMembersList()
    await loadGroupDetails()
    toast.success('Pengajuan warga berhasil disetujui!')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyetujui anggota')
  } finally {
    memberActionLoading.value = null
  }
}

const handleRejectMember = async (memberId: string) => {
  if (!currentGroupId.value) return
  const confirmReject = window.confirm(
    'Apakah Anda yakin ingin menolak pengajuan bergabung warga ini?',
  )
  if (!confirmReject) return

  memberActionLoading.value = memberId
  try {
    await rejectGroupMember(currentGroupId.value, memberId)
    await loadGroupMembersList()
    await loadGroupDetails()
    toast.info('Pengajuan bergabung warga telah ditolak')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menolak anggota')
  } finally {
    memberActionLoading.value = null
  }
}

const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
  if (!currentGroupId.value) return
  memberActionLoading.value = memberId
  try {
    await updateMemberRole(currentGroupId.value, memberId, newRole)
    await loadGroupMembersList()
    toast.success(`Peran anggota berhasil diubah menjadi ${newRole === 'ADMIN' ? 'Pengurus / Bendahara' : 'Warga Biasa'}`)
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengubah peran anggota')
  } finally {
    memberActionLoading.value = null
  }
}

const handleRemoveMember = async (memberId: string) => {
  if (!currentGroupId.value) return
  memberActionLoading.value = memberId
  try {
    await removeMember(currentGroupId.value, memberId)
    await loadGroupMembersList()
    await loadGroupDetails()
    toast.success('Anggota berhasil dikeluarkan dari komunitas')
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengeluarkan anggota')
  } finally {
    memberActionLoading.value = null
  }
}

// ==========================================
// 5B. MANAJEMEN UNIT HUNIAN & KAVLING
// ==========================================
const groupUnits = ref<any[]>([])
const unitsLoading = ref(false)
const unitsError = ref<string | null>(null)

const loadUnitsList = async () => {
  if (!currentGroupId.value) return
  unitsLoading.value = true
  unitsError.value = null
  try {
    const data = await getGroupUnits(currentGroupId.value)
    groupUnits.value = data || []
  } catch (err: any) {
    unitsError.value = err.message || 'Gagal memuat daftar unit'
  } finally {
    unitsLoading.value = false
  }
}

const handleCreateUnit = async (payload: { name: string; description?: string }) => {
  if (!currentGroupId.value) return
  try {
    await createUnit(currentGroupId.value, payload)
    toast.success(`Unit "${payload.name}" berhasil ditambahkan!`)
    await loadUnitsList()
    await loadGroupDetails()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menambahkan unit')
  }
}

const handleCreateUnitsBulk = async (payload: { names: string[] }) => {
  if (!currentGroupId.value) return
  try {
    const res = await createUnitsBulk(currentGroupId.value, payload)
    toast.success(res?.message || `${payload.names.length} unit berhasil ditambahkan!`)
    await loadUnitsList()
    await loadGroupDetails()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menambahkan unit massal')
  }
}

const handleDeleteUnit = async (unitId: string) => {
  if (!currentGroupId.value) return
  try {
    await deleteUnit(currentGroupId.value, unitId)
    toast.success('Unit berhasil dihapus')
    await loadUnitsList()
    await loadGroupDetails()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus unit')
  }
}

// ==========================================
// 6. MODAL PENGATURAN TUJUAN TRANSFER
// ==========================================
const isPaymentConfigModalOpen = ref(false)
const paymentConfigData = ref<any>(null)
const configLoading = ref(false)
const configSaving = ref(false)
const configError = ref<string | null>(null)
const configSuccess = ref<string | null>(null)

const openPaymentConfigModal = async () => {
  if (!currentGroupId.value) return
  configLoading.value = true
  configError.value = null
  configSuccess.value = null
  isPaymentConfigModalOpen.value = true

  try {
    const cfg = await getPaymentConfig(currentGroupId.value)
    paymentConfigData.value = cfg
  } catch (err: any) {
    configError.value = err.message || 'Gagal memuat konfigurasi pembayaran'
  } finally {
    configLoading.value = false
  }
}

const handleSavePaymentConfig = async (payload: any) => {
  if (!currentGroupId.value) return
  configSaving.value = true
  configError.value = null
  configSuccess.value = null

  try {
    await updatePaymentConfig(currentGroupId.value, payload)
    configSuccess.value = 'Tujuan transfer pembayaran berhasil disimpan!'
    paymentConfigData.value = { ...paymentConfigData.value, ...payload }
    setTimeout(() => {
      isPaymentConfigModalOpen.value = false
      configSuccess.value = null
    }, 1200)
  } catch (err: any) {
    configError.value = err.message || 'Gagal menyimpan konfigurasi pembayaran'
  } finally {
    configSaving.value = false
  }
}

// ==========================================
// 7. MODAL PEMBAYARAN TAGIHAN (WARGA)
// ==========================================
const isPaymentModalOpen = ref(false)
const selectedBillForPayment = ref<any>(null)
const billPaymentOptions = ref<any>(null)
const paymentDetailLoading = ref(false)
const paymentSubmitting = ref(false)
const paymentModalError = ref<string | null>(null)
const paymentModalSuccess = ref<string | null>(null)

const openPaymentModal = async (bill: any) => {
  selectedBillForPayment.value = bill
  paymentModalError.value = null
  paymentModalSuccess.value = null
  isPaymentModalOpen.value = true
  paymentDetailLoading.value = true

  try {
    const detail = await getBillDetail(currentGroupId.value, bill.id)
    billPaymentOptions.value = detail.paymentOptions
  } catch (err: any) {
    paymentModalError.value = err.message || 'Gagal memuat detail tagihan'
  } finally {
    paymentDetailLoading.value = false
  }
}

const handleSubmitPayment = async (payload: {
  method: 'QRIS_DYNAMIC' | 'BANK_TRANSFER_MANUAL'
  proofImageUrl: string
  notes?: string
}) => {
  if (!selectedBillForPayment.value || !currentGroupId.value) return

  paymentSubmitting.value = true
  paymentModalError.value = null
  paymentModalSuccess.value = null

  try {
    await submitPayment(currentGroupId.value, selectedBillForPayment.value.id, payload)
    paymentModalSuccess.value =
      'Konfirmasi pembayaran berhasil dikirim! Menunggu verifikasi pengurus.'
    await loadGroupDetails()

    setTimeout(() => {
      isPaymentModalOpen.value = false
      paymentModalSuccess.value = null
    }, 1500)
  } catch (err: any) {
    paymentModalError.value = err.message || 'Gagal mengirim pembayaran.'
  } finally {
    paymentSubmitting.value = false
  }
}

// ==========================================
// 8. MODAL VERIFIKASI PEMBAYARAN (PENGURUS)
// ==========================================
const isVerifyModalOpen = ref(false)
const selectedBillForVerification = ref<any>(null)
const verifyActionLoading = ref(false)
const verifyError = ref<string | null>(null)
const verifySuccess = ref<string | null>(null)

const openVerifyModal = (bill: any) => {
  selectedBillForVerification.value = bill
  verifyError.value = null
  verifySuccess.value = null
  isVerifyModalOpen.value = true
}

const handleApprovePayment = async () => {
  if (!selectedBillForVerification.value || !currentGroupId.value) return
  const payment = selectedBillForVerification.value.payments?.[0]
  if (!payment) {
    verifyError.value = 'Data pembayaran tidak ditemukan'
    return
  }

  verifyActionLoading.value = true
  verifyError.value = null

  try {
    await verifyPayment(currentGroupId.value, selectedBillForVerification.value.id, payment.id, {
      status: 'SUCCESS',
    })
    verifySuccess.value =
      'Pembayaran disetujui! Status tagihan Lunas dan otomatis tercatat di Buku Kas.'
    await loadGroupDetails()

    setTimeout(() => {
      isVerifyModalOpen.value = false
      verifySuccess.value = null
    }, 1500)
  } catch (err: any) {
    verifyError.value = err.message || 'Gagal memverifikasi pembayaran'
  } finally {
    verifyActionLoading.value = false
  }
}

const handleRejectPayment = async (notes: string) => {
  if (!selectedBillForVerification.value || !currentGroupId.value) return
  const payment = selectedBillForVerification.value.payments?.[0]
  if (!payment) {
    verifyError.value = 'Data pembayaran tidak ditemukan'
    return
  }

  verifyActionLoading.value = true
  verifyError.value = null

  try {
    await verifyPayment(currentGroupId.value, selectedBillForVerification.value.id, payment.id, {
      status: 'REJECTED',
      notes: notes || undefined,
    })
    verifySuccess.value = 'Pembayaran ditolak. Lembar tagihan kembali berstatus belum bayar.'
    await loadGroupDetails()

    setTimeout(() => {
      isVerifyModalOpen.value = false
      verifySuccess.value = null
    }, 1500)
  } catch (err: any) {
    verifyError.value = err.message || 'Gagal menolak pembayaran'
  } finally {
    verifyActionLoading.value = false
  }
}

// ==========================================
// 9. MODAL REKAP TAGIHAN SELURUH WARGA
// ==========================================
const isAllBillsModalOpen = ref(false)

// ==========================================
// 10. MODAL KWITANSI BUKTI PEMBAYARAN RESMI
// ==========================================
const isReceiptModalOpen = ref(false)
const selectedBillForReceipt = ref<any>(null)

const openReceiptModal = (bill: any) => {
  selectedBillForReceipt.value = bill
  isReceiptModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn">
    <!-- STATE 1: JIKA PENGGUNA BELUM TERGABUNG GRUP APA PUN -->
    <div
      v-if="!activeMembership && !loadingData"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-8 sm:p-12 text-center space-y-6"
    >
      <div class="max-w-md mx-auto">
        <div
          class="inline-block px-3 py-1 rounded-full bg-[#FFE2AF] text-[#E37434] text-xs font-bold uppercase tracking-wider shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] mb-3"
        >
          Belum Ada Grup
        </div>
        <h3 class="text-xl sm:text-2xl font-black text-slate-800 mb-2">
          Mulai Pengalaman Bersama urunankita
        </h3>
        <p class="text-sm font-medium text-slate-600 mb-6">
          Anda belum terdaftar di grup mana pun. Pilih salah satu opsi di bawah untuk memulai:
        </p>
      </div>

      <!-- Dua Pilihan Kartu Taktil -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto text-left">
        <!-- Opsi A: Gabung Grup -->
        <div
          @click="isJoinModalOpen = true; joinError = null; joinPreview = null"
          class="p-6 rounded-3xl bg-[#eaf0f7] shadow-[6px_6px_14px_#cad5e2,-6px_-6px_14px_#ffffff] border border-white/80 cursor-pointer hover:-translate-y-1 transition-all space-y-3"
        >
          <div
            class="w-10 h-10 rounded-2xl bg-[#007979] text-white font-black flex items-center justify-center text-sm shadow-[2px_2px_5px_rgba(0,121,121,0.3)]"
          >
            1
          </div>
          <h4 class="font-black text-base text-slate-800">
            Gabung Grup yang Ada
          </h4>
          <p class="text-xs text-slate-500 font-medium leading-relaxed">
            Punya kode gabung dari pengurus RT, Kost, atau grup olahraga Anda? Masukkan kode untuk bergabung.
          </p>
          <button
            type="button"
            class="w-full py-2.5 px-4 rounded-xl text-xs font-black text-[#007979] bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] text-center cursor-pointer"
          >
            Masukkan Kode Gabung
          </button>
        </div>

        <!-- Opsi B: Buat Grup Baru -->
        <div
          @click="isCreateModalOpen = true; createError = null"
          class="p-6 rounded-3xl bg-[#eaf0f7] shadow-[6px_6px_14px_#cad5e2,-6px_-6px_14px_#ffffff] border border-white/80 cursor-pointer hover:-translate-y-1 transition-all space-y-3"
        >
          <div
            class="w-10 h-10 rounded-2xl bg-[#E37434] text-white font-black flex items-center justify-center text-sm shadow-[2px_2px_5px_rgba(227,116,52,0.3)]"
          >
            2
          </div>
          <h4 class="font-black text-base text-slate-800">
            Buat Grup Baru
          </h4>
          <p class="text-xs text-slate-500 font-medium leading-relaxed">
            Sebagai pengurus RT/RW, pemilik kost, atau ketua paguyuban, Anda dapat langsung membuat grup penagihan mandiri.
          </p>
          <button
            type="button"
            class="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[2px_2px_6px_rgba(227,116,52,0.3)] active:shadow-[inset_1px_1px_3px_rgba(150,55,10,0.5)] text-center cursor-pointer"
          >
            Buat Grup Saya
          </button>
        </div>
      </div>
    </div>

    <!-- STATE 2: JIKA SUDAH TERGABUNG GRUP AKTIF -->
    <div v-else class="space-y-6 sm:space-y-8">
      <!-- Group Info & Mobile-First Dropdown Selector Card -->
      <div
        class="relative z-30 rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-4 sm:p-5"
      >
        <!-- Header Row: Identitas Grup & Switcher -->
        <div class="flex items-center justify-between gap-3">
          <!-- Avatar & Nama Grup -->
          <div
            @click="myGroups.length > 1 && (isGroupDropdownOpen = !isGroupDropdownOpen)"
            class="flex items-center space-x-3 min-w-0 flex-1"
            :class="myGroups.length > 1 ? 'cursor-pointer group' : ''"
          >
            <div
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#007979] to-[#005a5a] text-white flex-shrink-0 flex items-center justify-center font-black text-sm sm:text-base shadow-[2px_2px_6px_rgba(0,121,121,0.3)] transition-transform group-hover:scale-105"
            >
              {{ activeMembership?.group.name.charAt(0) || 'G' }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-1.5 mb-0.5">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Grup Aktif
                </span>
                <span
                  v-if="myGroups.length > 1"
                  class="text-[9px] font-extrabold text-[#007979] bg-[#007979]/10 px-1.5 py-0.2 rounded-md"
                >
                  {{ myGroups.length }} Grup
                </span>
              </div>
              <h2 class="text-sm sm:text-base font-black text-slate-800 truncate leading-snug">
                {{ activeMembership?.group.name }}
              </h2>
              <p class="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit Fisik' : 'Anggota Langsung' }}
                <span v-if="activeMembership?.unit" class="text-slate-700 font-bold">
                  • {{ activeMembership?.unit.name }}</span
                >
              </p>
            </div>
          </div>

          <!-- Sisi Kanan: Role Badge & Tombol Ganti Grup -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <span
              v-if="activeMembership?.status === 'PENDING'"
              class="px-2.5 py-1 rounded-xl bg-[#FFE2AF] text-[#E37434] text-[10px] sm:text-[11px] font-extrabold uppercase shadow-[inset_1px_1px_2px_#dfc79b]"
            >
              Menunggu Persetujuan
            </span>
            <span
              v-else
              class="px-2.5 py-1 rounded-xl bg-[#FFE2AF] text-[#007979] text-[10px] sm:text-[11px] font-extrabold uppercase shadow-[inset_1px_1px_2px_#dfc79b]"
            >
              {{ activeMembership?.role }}
            </span>

            <!-- Tombol Tukar Grup (Icon Tuker) -->
            <button
              v-if="myGroups.length > 1"
              @click="isGroupDropdownOpen = !isGroupDropdownOpen"
              type="button"
              class="w-9 h-9 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] flex items-center justify-center text-slate-600 transition-all hover:text-[#007979] cursor-pointer"
              title="Tukar Grup"
              aria-label="Tukar Grup"
            >
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180 text-[#007979]': isGroupDropdownOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bottom Row: Bar Kode Gabung, Tombol Navigasi, & Salin Kode -->
        <div
          v-if="!isPendingApproval"
          class="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5"
        >
          <div class="flex items-center space-x-2 min-w-0">
            <span class="text-[11px] font-bold text-slate-500">Kode Gabung:</span>
            <span
              class="px-2.5 py-0.5 rounded-lg bg-[#eaf0f7] shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] font-mono font-black text-xs sm:text-sm text-[#007979] tracking-wider select-all"
            >
              {{ activeMembership?.group.joinCode }}
            </span>
          </div>

          <!-- Tombol Navigasi: Unit Hunian (Khusus grup berbasis unit fisik) -->
          <button
            v-if="activeMembership?.group.type === 'PHYSICAL_UNIT' && activeTab !== 'UNITS'"
            @click="setActiveTab('UNITS')"
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black text-[#007979] hover:text-[#24B1B1] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Kelola Unit Hunian & Kavling"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Unit Hunian</span>
          </button>

          <!-- Tombol Navigasi: Anggota -->
          <button
            v-if="activeTab !== 'MEMBERS'"
            @click="setActiveTab('MEMBERS')"
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black text-[#007979] hover:text-[#24B1B1] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Lihat Daftar Anggota & Warga Komunitas"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Anggota</span>
          </button>

          <!-- Tombol Navigasi: Buku Kas -->
          <button
            v-if="activeTab !== 'LEDGER'"
            @click="setActiveTab('LEDGER')"
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black text-[#007979] hover:text-[#24B1B1] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Buka Halaman Transparansi Buku Kas"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Buku Kas</span>
          </button>

          <!-- Tombol Navigasi: Iuran & Tagihan -->
          <button
            v-if="activeTab !== 'DASHBOARD'"
            @click="setActiveTab('DASHBOARD')"
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black text-[#007979] hover:text-[#24B1B1] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Kembali ke Halaman Iuran & Tagihan"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Iuran & Tagihan</span>
          </button>

          <!-- Tombol Salin Kode -->
          <button
            @click="copyJoinCode(activeMembership?.group.joinCode)"
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer"
            :class="copiedJoinCode ? 'text-emerald-600' : 'text-[#007979] hover:text-[#24B1B1]'"
          >
            <svg v-if="!copiedJoinCode" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ copiedJoinCode ? 'Tersalin!' : 'Salin Kode' }}</span>
          </button>
        </div>

        <!-- Floating Dropdown Menu Sheet (Saat memilih grup) -->
        <transition name="slide-fade">
          <div
            v-if="isGroupDropdownOpen"
            class="absolute left-0 right-0 top-full mt-2.5 z-50 rounded-3xl bg-[#eaf0f7] p-2.5 shadow-[10px_10px_30px_rgba(180,195,215,0.8),-6px_-6px_20px_#ffffff] border border-white/80 space-y-1.5 max-h-72 overflow-y-auto"
          >
            <div
              class="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 flex justify-between items-center"
            >
              <span>Daftar Grup Anda</span>
              <span class="text-[#007979] font-bold">Pilih untuk beralih</span>
            </div>

            <div
              v-for="(membership, idx) in myGroups"
              :key="membership.id"
              class="w-full min-h-[48px] flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all"
              :class="
                selectedGroupIndex === idx
                  ? 'bg-white shadow-[2px_2px_6px_#cad5e2,-2px_-2px_6px_#ffffff]'
                  : 'hover:bg-white/40 active:shadow-[inset_1px_1px_3px_#cad5e2]'
              "
            >
              <!-- Area Klik untuk Beralih Grup -->
              <div
                @click="selectedGroupIndex = idx; isGroupDropdownOpen = false"
                class="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1 cursor-pointer"
              >
                <div
                  class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs shadow-xs"
                  :class="selectedGroupIndex === idx ? 'bg-[#007979] text-white' : 'bg-slate-200 text-slate-600'"
                >
                  {{ membership.group.name.charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs sm:text-sm font-black text-slate-800 truncate">
                    {{ membership.group.name }}
                  </p>
                  <p class="text-[10px] text-slate-500 font-medium">
                    Peran: <span class="font-bold text-slate-700">{{ membership.role }}</span>
                    <span v-if="membership.status === 'PENDING'" class="text-[#E37434] font-bold">
                      (Menunggu Persetujuan)</span
                    >
                    <span v-if="membership.unit"> • Unit: {{ membership.unit.name }}</span>
                    <span class="text-slate-400"> • </span>
                    <span class="font-mono text-[#007979] font-bold">Kode: {{ membership.group.joinCode }}</span>
                  </p>
                </div>
              </div>

              <!-- Sisi Kanan: Status Centang & Tombol Keluar Grup -->
              <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
                <div
                  v-if="selectedGroupIndex === idx"
                  class="w-5 h-5 rounded-md bg-[#007979]/10 text-[#007979] flex items-center justify-center"
                  title="Grup Sedang Aktif"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <button
                  v-if="membership.role !== 'OWNER'"
                  @click.stop="handleLeaveGroup(membership)"
                  type="button"
                  class="w-7 h-7 rounded-xl bg-[#eaf0f7] text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center transition-all cursor-pointer"
                  :title="membership.status === 'PENDING' ? 'Batalkan Permohonan' : 'Keluar dari Grup'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Backdrop overlay untuk menutup dropdown saat klik di luar -->
        <div
          v-if="isGroupDropdownOpen"
          @click="isGroupDropdownOpen = false"
          class="fixed inset-0 z-30"
        ></div>
      </div>

      <!-- ============================================================== -->
      <!-- HALAMAN PENDING: MENUNGGU PERSETUJUAN PENGURUS                 -->
      <!-- ============================================================== -->
      <div
        v-if="isPendingApproval"
        class="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-8"
      >
        <div
          class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] flex items-center justify-center mb-6"
        >
          <svg class="w-10 h-10 sm:w-12 sm:h-12 text-[#E37434]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-2">Menunggu Persetujuan</h2>

        <p class="text-sm text-slate-500 font-medium max-w-sm mb-1">
          Permintaan bergabungmu ke grup
          <span class="font-black text-slate-700">{{ activeMembership?.group.name }}</span>
          sudah diterima.
        </p>
        <p class="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
          Tunggu pengurus menyetujui keanggotaanmu. Halaman ini akan otomatis terbuka saat disetujui.
        </p>

        <div
          class="w-full max-w-xs bg-[#eaf0f7] rounded-2xl shadow-[inset_4px_4px_8px_#cad5e2,inset_-4px_-4px_8px_#ffffff] p-4 mb-6 text-left space-y-2.5"
        >
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400 font-medium">Kode Grup</span>
            <span class="font-mono font-black text-[#007979] text-sm">{{ activeMembership?.group.joinCode }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400 font-medium">Tipe Komunitas</span>
            <span class="font-bold text-slate-700">
              {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit Fisik' : 'Anggota Langsung' }}
            </span>
          </div>
          <div v-if="activeMembership?.unit" class="flex justify-between items-center text-xs">
            <span class="text-slate-400 font-medium">Unit Hunian</span>
            <span class="font-bold text-slate-700">{{ activeMembership.unit.name }}</span>
          </div>
        </div>

        <button
          @click="handleLeaveGroup"
          :disabled="leavingGroup"
          type="button"
          class="px-6 py-2.5 rounded-2xl bg-[#eaf0f7] text-xs sm:text-sm font-black text-red-500 hover:text-red-700 shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_#cad5e2] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {{ leavingGroup ? 'Membatalkan...' : 'Batalkan Keanggotaan' }}
        </button>
      </div>

      <!-- SKELETON LOADER SAAT DATA GRUP SEDANG DIMUAT -->
      <div v-else-if="!isPendingApproval && loadingData && !ledgerData" class="space-y-6">
        <SkeletonLoader variant="metrics" />
        <SkeletonLoader variant="card" :count="1" />
      </div>

      <!-- SUB-HALAMAN 1: IURAN & TAGIHAN (DASHBOARD) -->
      <OverviewView
        v-else-if="!isPendingApproval && activeTab === 'DASHBOARD'"
        :active-membership="activeMembership"
        :is-pengurus="isPengurus"
        :my-bills="myBills"
        :my-unpaid-bills-total="myUnpaidBillsTotal"
        :my-unpaid-bills-count="myUnpaidBillsCount"
        :my-pending-verification-bills-count="myPendingVerificationBillsCount"
        :my-pending-verification-bills-total="myPendingVerificationBillsTotal"
        :ledger-data="ledgerData"
        :pending-verification-bills="pendingVerificationBills"
        :pending-verification-count="pendingVerificationCount"
        @open-payment="openPaymentModal"
        @open-payment-config="openPaymentConfigModal"
        @open-bill-modal="openBillModal"
        @open-verify="openVerifyModal"
        @open-all-bills="isAllBillsModalOpen = true"
        @go-to-ledger="setActiveTab('LEDGER')"
        @view-receipt="openReceiptModal"
      />

      <!-- SUB-HALAMAN 2: TRANSPARANSI BUKU KAS (LEDGER) -->
      <LedgerView
        v-else-if="!isPendingApproval && activeTab === 'LEDGER'"
        :active-membership="activeMembership"
        :is-pengurus="isPengurus"
        :ledger-data="ledgerData"
        @go-to-dashboard="setActiveTab('DASHBOARD')"
        @open-create-record="openLedgerModal"
        @delete-entry="handleDeleteLedgerEntry"
      />

      <!-- SUB-HALAMAN 3: DAFTAR ANGGOTA GRUP (MEMBERS) -->
      <MembersView
        v-else-if="!isPendingApproval && activeTab === 'MEMBERS'"
        :active-membership="activeMembership"
        :is-pengurus="isPengurus"
        :user="user"
        :group-members="groupMembers"
        :members-loading="membersLoading"
        :members-error="membersError"
        :member-action-loading="memberActionLoading"
        @go-to-dashboard="setActiveTab('DASHBOARD')"
        @approve-member="handleApproveMember"
        @reject-member="handleRejectMember"
        @copy-join-code="copyJoinCode"
        @leave-group="handleLeaveGroup"
        @update-role="handleUpdateMemberRole"
        @remove-member="handleRemoveMember"
      />

      <!-- SUB-HALAMAN 4: DAFTAR UNIT HUNIAN (UNITS) -->
      <UnitsView
        v-else-if="!isPendingApproval && activeTab === 'UNITS'"
        :active-membership="activeMembership"
        :is-pengurus="isPengurus"
        :units="groupUnits"
        :units-loading="unitsLoading"
        :units-error="unitsError"
        @go-to-dashboard="setActiveTab('DASHBOARD')"
        @refresh-units="loadUnitsList"
        @create-unit="handleCreateUnit"
        @create-units-bulk="handleCreateUnitsBulk"
        @delete-unit="handleDeleteUnit"
      />
    </div>

    <!-- MODAL 1: BUAT GRUP BARU -->
    <CreateGroupModal
      :is-open="isCreateModalOpen"
      :loading="createLoading"
      :error="createError"
      @close="isCreateModalOpen = false"
      @submit="handleCreateGroup"
    />

    <!-- MODAL 2: GABUNG GRUP VIA KODE -->
    <JoinGroupModal
      :is-open="isJoinModalOpen"
      :join-preview="joinPreview"
      :lookup-loading="lookupLoading"
      :join-loading="joinLoading"
      :error="joinError"
      @close="isJoinModalOpen = false"
      @lookup="handleLookupCode"
      @join="handleJoinGroup"
    />

    <!-- MODAL 3: SET TAGIHAN BARU (PENGURUS) -->
    <CreateBillModal
      :is-open="isBillModalOpen"
      :group-type="activeMembership?.group.type || 'PHYSICAL_UNIT'"
      :units="groupUnitsList"
      :members="groupMembersList"
      :loading="billLoading"
      :error="billError"
      :success="billSuccess"
      @close="isBillModalOpen = false"
      @submit-recurring="handleSaveRecurringRule"
      @submit-once="handleCreateOnceBill"
    />

    <!-- MODAL 4: CATAT MUTASI KAS (PENGURUS) -->
    <RecordLedgerModal
      :is-open="isLedgerModalOpen"
      :initial-type="ledgerModalType"
      :loading="ledgerLoading"
      :error="ledgerError"
      :success="ledgerSuccess"
      @close="isLedgerModalOpen = false"
      @submit="handleRecordLedger"
    />

    <!-- MODAL 5: PENGATURAN TUJUAN TRANSFER (PENGURUS) -->
    <PaymentConfigModal
      :is-open="isPaymentConfigModalOpen"
      :config="paymentConfigData"
      :loading="configLoading"
      :saving="configSaving"
      :error="configError"
      :success="configSuccess"
      @close="isPaymentConfigModalOpen = false"
      @save="handleSavePaymentConfig"
    />

    <!-- MODAL 6: PEMBAYARAN TAGIHAN (WARGA) -->
    <PaymentModal
      :is-open="isPaymentModalOpen"
      :bill="selectedBillForPayment"
      :payment-options="billPaymentOptions"
      :detail-loading="paymentDetailLoading"
      :submitting="paymentSubmitting"
      :error="paymentModalError"
      :success="paymentModalSuccess"
      @close="isPaymentModalOpen = false"
      @submit="handleSubmitPayment"
    />

    <!-- MODAL 7: VERIFIKASI PEMBAYARAN WARGA (PENGURUS) -->
    <VerifyPaymentModal
      :is-open="isVerifyModalOpen"
      :bill="selectedBillForVerification"
      :loading="verifyActionLoading"
      :error="verifyError"
      :success="verifySuccess"
      @close="isVerifyModalOpen = false"
      @approve="handleApprovePayment"
      @reject="handleRejectPayment"
    />

    <!-- MODAL 8: REKAP TAGIHAN SELURUH WARGA (PENGURUS) -->
    <AllBillsModal
      :is-open="isAllBillsModalOpen"
      :bills="allGroupBills"
      :pending-verification-count="pendingVerificationCount"
      @close="isAllBillsModalOpen = false"
      @verify="openVerifyModal"
      @view-receipt="openReceiptModal"
    />

    <!-- MODAL 9: KWITANSI RESMI BUKTI PEMBAYARAN -->
    <ReceiptModal
      :is-open="isReceiptModalOpen"
      :bill="selectedBillForReceipt"
      :group-name="activeMembership?.group.name"
      @close="isReceiptModalOpen = false"
    />
  </div>
</template>
