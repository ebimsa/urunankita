<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useGroups, type GroupPreview } from '../composables/useGroups'
import { useNavigation } from '../composables/useNavigation'
import OverviewView from './dashboard/OverviewView.vue'
import LedgerView from './dashboard/LedgerView.vue'
import MembersView from './dashboard/MembersView.vue'

const { user } = useAuth()
const { activeTab, setActiveTab } = useNavigation()
const {
  myGroups,
  fetchMyGroups,
  createGroup,
  previewGroup,
  joinGroup,
  getGroupLedger,
  getMyBills,
  isCreateModalOpen,
  isJoinModalOpen,
  isBillModalOpen,
  openCreateModal,
  closeCreateModal,
  openJoinModal,
  closeJoinModal,
  openBillModal,
  closeBillModal,
  createBill,
  getGroupUnits,
  getGroupMembers,
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
const activeBillsTab = ref<'MY_BILLS' | 'ALL_BILLS'>('MY_BILLS')
const billFilterStatus = ref<'ALL' | 'PENDING_VERIFICATION' | 'UNPAID' | 'PAID'>('ALL')

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

const loadingData = ref(false)
const copiedJoinCode = ref(false)

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
    setTimeout(() => {
      copiedJoinCode.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy join code', err)
  }
}

// Reset form otomatis saat modal dibuka
watch(isJoinModalOpen, (val) => {
  if (val) {
    joinError.value = null
    joinPreview.value = null
    joinCode.value = ''
    unitSearchQuery.value = ''
    selectedUnit.value = null
    isUnitDropdownOpen.value = false
  }
})

watch(isCreateModalOpen, (val) => {
  if (val) {
    createError.value = null
    createName.value = ''
    createDescription.value = ''
    createType.value = 'PHYSICAL_UNIT'
  }
})

// Form Buat Grup
const createName = ref('')
const createType = ref<'PHYSICAL_UNIT' | 'DIRECT_MEMBER'>('PHYSICAL_UNIT')
const createDescription = ref('')
const createLoading = ref(false)
const createError = ref<string | null>(null)

// Form Gabung Grup
const joinCode = ref('')
const joinPreview = ref<GroupPreview | null>(null)
const unitSearchQuery = ref('')
const selectedUnit = ref<{ id?: string; name: string } | null>(null)
const isUnitDropdownOpen = ref(false)
const lookupLoading = ref(false)
const joinLoading = ref(false)
const joinError = ref<string | null>(null)

// Computed untuk combobox unit
const filteredUnits = computed(() => {
  if (!joinPreview.value?.units) return []
  const q = unitSearchQuery.value.trim().toLowerCase()
  if (!q) return joinPreview.value.units
  return joinPreview.value.units.filter((u) => u.name.toLowerCase().includes(q))
})

const exactUnitMatch = computed(() => {
  if (!joinPreview.value?.units) return null
  const q = unitSearchQuery.value.trim().toLowerCase()
  if (!q) return null
  return joinPreview.value.units.find((u) => u.name.toLowerCase() === q) || null
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

const pendingVerificationCount = computed(() => {
  return allGroupBills.value.filter((b: any) => b.status === 'PENDING_VERIFICATION').length
})

const pendingVerificationBills = computed(() => {
  return allGroupBills.value.filter((b: any) => b.status === 'PENDING_VERIFICATION')
})

const isAllBillsModalOpen = ref(false)

const filteredAllBills = computed(() => {
  if (billFilterStatus.value === 'ALL') return allGroupBills.value
  return allGroupBills.value.filter((b: any) => b.status === billFilterStatus.value)
})

const loadGroupDetails = async () => {
  if (!currentGroupId.value) return
  loadingData.value = true
  const gId = currentGroupId.value

  try {
    const promises: Promise<any>[] = [
      getGroupLedger(gId),
      getMyBills(gId),
      loadGroupMembersList(),
    ]
    if (isPengurus.value) {
      promises.push(getGroupBills(gId))
    }

    const [ledger, bills, _members, allBills] = await Promise.all(promises)
    ledgerData.value = ledger
    myBills.value = bills || []
    if (allBills) {
      allGroupBills.value = allBills || []
    }
  } finally {
    loadingData.value = false
  }
}

watch(selectedGroupIndex, () => {
  loadGroupDetails()
})

watch(activeTab, (newTab) => {
  if (newTab === 'MEMBERS' && currentGroupId.value) {
    loadGroupMembersList()
  }
})

onMounted(async () => {
  await fetchMyGroups()
  if (myGroups.value.length > 0) {
    await loadGroupDetails()
  }
})

const formatRupiah = (val: number | undefined | null) => {
  if (val === undefined || val === null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

// Helper format angka ribuan dengan titik (contoh: 150000 -> "150.000")
const formatNumberWithDots = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return ''
  const numStr = val.toString().replace(/\D/g, '')
  if (!numStr) return ''
  return new Intl.NumberFormat('id-ID').format(Number(numStr))
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return String(dateStr)
  }
}

// Handler Buat Grup Baru
const handleCreateGroup = async () => {
  if (!createName.value.trim()) {
    createError.value = 'Nama grup wajib diisi.'
    return
  }

  createLoading.value = true
  createError.value = null

  try {
    await createGroup({
      name: createName.value.trim(),
      type: createType.value,
      description: createDescription.value.trim() || undefined,
    })
    // Reset dan tutup modal
    createName.value = ''
    createDescription.value = ''
    isCreateModalOpen.value = false
    selectedGroupIndex.value = 0
    await loadGroupDetails()
  } catch (err: any) {
    createError.value = err.message || 'Gagal membuat grup.'
  } finally {
    createLoading.value = false
  }
}

// Handler Cari Grup via Kode
const handleLookupCode = async () => {
  if (!joinCode.value.trim()) {
    joinError.value = 'Silakan masukkan kode grup.'
    return
  }

  lookupLoading.value = true
  joinError.value = null
  joinPreview.value = null
  unitSearchQuery.value = ''
  selectedUnit.value = null
  isUnitDropdownOpen.value = false

  try {
    const preview = await previewGroup(joinCode.value.trim())
    joinPreview.value = preview
  } catch (err: any) {
    joinError.value = err.message || 'Kode grup tidak ditemukan.'
  } finally {
    lookupLoading.value = false
  }
}

// Handler Kirim Permohonan Gabung
const handleJoinGroup = async () => {
  if (!joinPreview.value) return

  let finalUnitId: string | undefined = undefined
  let finalUnitName: string | undefined = undefined

  if (joinPreview.value.type === 'PHYSICAL_UNIT') {
    const query = unitSearchQuery.value.trim()
    if (!query) {
      joinError.value = 'Nomor atau nama unit hunian wajib diisi.'
      return
    }

    if (selectedUnit.value?.id) {
      finalUnitId = selectedUnit.value.id
    } else {
      // Periksa apakah query cocok dengan unit yang sudah ada di grup
      const match = joinPreview.value.units?.find(
        (u) => u.name.toLowerCase() === query.toLowerCase()
      )
      if (match) {
        finalUnitId = match.id
      } else {
        finalUnitName = query
      }
    }
  }

  joinLoading.value = true
  joinError.value = null

  try {
    await joinGroup({
      joinCode: joinPreview.value.joinCode,
      unitId: finalUnitId,
      unitName: finalUnitName,
    })
    // Reset dan tutup modal
    joinCode.value = ''
    joinPreview.value = null
    unitSearchQuery.value = ''
    selectedUnit.value = null
    isUnitDropdownOpen.value = false
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
// STATE & HANDLER FITUR SET TAGIHAN
// ==========================================
// Mode: RECURRING (Aturan Iuran Rutin Akumulatif) vs ONCE (Sekali Bayar Insidental)
const billMode = ref<'RECURRING' | 'ONCE'>('RECURRING')
const billLoading = ref(false)
const billError = ref<string | null>(null)
const billSuccess = ref<string | null>(null)

const groupUnitsList = ref<any[]>([])
const groupMembersList = ref<any[]>([])

// 1. State Mode IURAN RUTIN (Akumulatif)
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
    recurringItems.value = [
      { name: 'Kas Bulanan Wajib Anggota', amount: 50000 },
    ]
  }
}

// 2. State Mode SEKALI BAYAR (Insidental)
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

// Watcher untuk mereset dan memuat data unit/member saat modal dibuka
watch(isBillModalOpen, async (val) => {
  if (val && activeMembership.value) {
    billError.value = null
    billSuccess.value = null
    const gId = currentGroupId.value
    if (activeMembership.value.group.type === 'PHYSICAL_UNIT') {
      const units = await getGroupUnits(gId)
      groupUnitsList.value = units
      if (units.length > 0 && !onceTargetUnitId.value) {
        onceTargetUnitId.value = units[0].id
      }
    } else {
      const members = await getGroupMembers(gId)
      groupMembersList.value = members
      if (members.length > 0 && !onceTargetMemberId.value) {
        onceTargetMemberId.value = members[0].id
      }
    }
  }
})

// Handler 1: Terapkan Aturan Iuran Rutin (Massal & Akumulatif)
const handleSaveRecurringRule = async () => {
  if (!recurringTitle.value.trim()) {
    billError.value = 'Judul iuran rutin wajib diisi.'
    return
  }

  if (recurringItems.value.length === 0 || recurringTotalAmount.value <= 0) {
    billError.value = 'Minimal harus ada 1 komponen biaya dengan nominal lebih dari Rp 0.'
    return
  }

  for (const item of recurringItems.value) {
    if (!item.name.trim()) {
      billError.value = 'Nama tiap komponen biaya wajib diisi.'
      return
    }
  }

  billLoading.value = true
  billError.value = null

  try {
    const periodLabel = recurringFrequency.value === 'MONTHLY'
      ? 'Iuran Rutin Bulanan'
      : 'Iuran Rutin Tahunan'

    await createBill(currentGroupId.value, {
      title: recurringTitle.value.trim(),
      period: periodLabel,
      applyToAll: true,
      items: recurringItems.value.map(i => ({
        name: i.name.trim(),
        amount: Number(i.amount),
      })),
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

// Handler 2: Terbitkan Tagihan Sekali Bayar (Insidental)
const handleCreateOnceBill = async () => {
  if (!onceTitle.value.trim()) {
    billError.value = 'Judul tagihan insidental wajib diisi.'
    return
  }

  if (onceItems.value.length === 0 || onceTotalAmount.value <= 0) {
    billError.value = 'Minimal harus ada 1 komponen biaya dengan nominal lebih dari Rp 0.'
    return
  }

  for (const item of onceItems.value) {
    if (!item.name.trim()) {
      billError.value = 'Nama tiap komponen biaya wajib diisi.'
      return
    }
  }

  billLoading.value = true
  billError.value = null

  try {
    const isMassal = onceTargetType.value === 'ALL'
    const targetUnitId = !isMassal && activeMembership.value?.group.type === 'PHYSICAL_UNIT' ? onceTargetUnitId.value : undefined
    const targetMemberId = !isMassal && activeMembership.value?.group.type === 'DIRECT_MEMBER' ? onceTargetMemberId.value : undefined

    await createBill(currentGroupId.value, {
      title: onceTitle.value.trim(),
      period: oncePeriodLabel.value.trim() || 'Sekali Bayar',
      applyToAll: isMassal,
      unitId: targetUnitId,
      memberId: targetMemberId,
      items: onceItems.value.map(i => ({
        name: i.name.trim(),
        amount: Number(i.amount),
      })),
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
// STATE & HANDLER FITUR CATAT MUTASI KAS
// ==========================================
const isLedgerModalOpen = ref(false)
const ledgerType = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const ledgerAmount = ref<number | null>(null)
const ledgerAmountFormatted = ref('')
const ledgerCategory = ref('')
const ledgerDescription = ref('')
const ledgerEntryDate = ref(new Date().toISOString().split('T')[0])
const ledgerLoading = ref(false)
const ledgerError = ref<string | null>(null)
const ledgerSuccess = ref<string | null>(null)

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

const openLedgerModal = (type: 'EXPENSE' | 'INCOME' = 'EXPENSE') => {
  ledgerType.value = type
  ledgerAmount.value = null
  ledgerAmountFormatted.value = ''
  ledgerCategory.value = type === 'EXPENSE' ? expenseCategories[0] : incomeCategories[0]
  ledgerDescription.value = ''
  ledgerEntryDate.value = new Date().toISOString().split('T')[0]
  ledgerError.value = null
  ledgerSuccess.value = null
  isLedgerModalOpen.value = true
}

const handleRecordLedger = async () => {
  if (!activeMembership.value) return
  if (!ledgerAmount.value || ledgerAmount.value <= 0) {
    ledgerError.value = 'Nominal transaksi harus lebih dari Rp 0.'
    return
  }
  if (!ledgerCategory.value.trim()) {
    ledgerError.value = 'Kategori transaksi wajib diisi.'
    return
  }
  if (!ledgerDescription.value.trim()) {
    ledgerError.value = 'Keterangan transaksi wajib diisi.'
    return
  }

  ledgerLoading.value = true
  ledgerError.value = null

  try {
    const payload = {
      amount: Math.round(Number(ledgerAmount.value)),
      category: ledgerCategory.value.trim(),
      description: ledgerDescription.value.trim(),
      entryDate: ledgerEntryDate.value ? new Date(ledgerEntryDate.value).toISOString() : undefined,
    }

    if (ledgerType.value === 'EXPENSE') {
      await recordLedgerExpense(currentGroupId.value, payload)
    } else {
      await recordLedgerIncome(currentGroupId.value, payload)
    }

    ledgerSuccess.value = `Catatan ${ledgerType.value === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'} berhasil disimpan!`
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
  } catch (err: any) {
    alert(err.message || 'Gagal menghapus catatan kas')
  }
}

// ==========================================
// STATE & HANDLER DEDIKASI HALAMAN BUKU KAS
// ==========================================
// STATE & HANDLER MANAJEMEN ANGGOTA GRUP
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
  } catch (err: any) {
    alert(err.message || 'Gagal menyetujui anggota')
  } finally {
    memberActionLoading.value = null
  }
}

const handleRejectMember = async (memberId: string) => {
  if (!currentGroupId.value) return
  const confirmReject = window.confirm('Apakah Anda yakin ingin menolak pengajuan bergabung warga ini?')
  if (!confirmReject) return

  memberActionLoading.value = memberId
  try {
    await rejectGroupMember(currentGroupId.value, memberId)
    await loadGroupMembersList()
    await loadGroupDetails()
  } catch (err: any) {
    alert(err.message || 'Gagal menolak anggota')
  } finally {
    memberActionLoading.value = null
  }
}


// ==========================================
// STATE & HANDLER PENGATURAN TUJUAN TRANSFER
// ==========================================
const isPaymentConfigModalOpen = ref(false)
const configLoading = ref(false)
const configSaving = ref(false)
const configError = ref<string | null>(null)
const configSuccess = ref<string | null>(null)

const configQrisEnabled = ref(false)
const configQrisImageUrl = ref<string | null>(null)
const configMerchantName = ref('')

const configBankEnabled = ref(false)
const configAccountDetails = ref('')

const openPaymentConfigModal = async () => {
  if (!currentGroupId.value) return
  configLoading.value = true
  configError.value = null
  configSuccess.value = null
  isPaymentConfigModalOpen.value = true

  try {
    const cfg = await getPaymentConfig(currentGroupId.value)
    configQrisEnabled.value = cfg.qrisEnabled || false
    configQrisImageUrl.value = cfg.qrisImageUrl || null
    configMerchantName.value = cfg.merchantName || ''
    configBankEnabled.value = cfg.bankEnabled || false
    configAccountDetails.value = cfg.accountDetails || cfg.instructions || ''
  } catch (err: any) {
    configError.value = err.message || 'Gagal memuat konfigurasi pembayaran'
  } finally {
    configLoading.value = false
  }
}

const handleQrisImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    configError.value = 'Ukuran gambar QRIS maksimal 5 MB'
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

const handleSavePaymentConfig = async () => {
  if (!currentGroupId.value) return
  configSaving.value = true
  configError.value = null
  configSuccess.value = null

  try {
    await updatePaymentConfig(currentGroupId.value, {
      qrisEnabled: configQrisEnabled.value,
      qrisImageUrl: configQrisImageUrl.value || undefined,
      merchantName: configMerchantName.value.trim() || undefined,
      bankEnabled: configBankEnabled.value,
      accountDetails: configAccountDetails.value.trim() || undefined,
    })

    configSuccess.value = 'Tujuan transfer pembayaran berhasil disimpan!'
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
// STATE & HANDLER PEMBAYARAN TAGIHAN (WARGA)
// ==========================================
const isPaymentModalOpen = ref(false)
const selectedBillForPayment = ref<any>(null)
const billPaymentOptions = ref<any>(null)
const paymentMethodTab = ref<'QRIS' | 'BANK'>('QRIS')
const paymentProofImageUrl = ref<string | null>(null)
const paymentNotes = ref('')
const paymentDetailLoading = ref(false)
const paymentSubmitting = ref(false)
const paymentModalError = ref<string | null>(null)
const paymentModalSuccess = ref<string | null>(null)
const copiedAccount = ref(false)

const openPaymentModal = async (bill: any) => {
  selectedBillForPayment.value = bill
  paymentProofImageUrl.value = null
  paymentNotes.value = ''
  paymentModalError.value = null
  paymentModalSuccess.value = null
  copiedAccount.value = false
  isPaymentModalOpen.value = true
  paymentDetailLoading.value = true

  try {
    const detail = await getBillDetail(currentGroupId.value, bill.id)
    billPaymentOptions.value = detail.paymentOptions

    if (detail.paymentOptions.qris) {
      paymentMethodTab.value = 'QRIS'
    } else if (detail.paymentOptions.bank) {
      paymentMethodTab.value = 'BANK'
    } else {
      paymentMethodTab.value = 'QRIS'
    }
  } catch (err: any) {
    paymentModalError.value = err.message || 'Gagal memuat detail tagihan'
  } finally {
    paymentDetailLoading.value = false
  }
}

const copyAccountDetails = async (text?: string) => {
  if (!text) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copiedAccount.value = true
    setTimeout(() => {
      copiedAccount.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

const handleProofImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    paymentModalError.value = 'Ukuran bukti foto maksimal 5 MB'
    return
  }
  const reader = new FileReader()
  reader.onload = (uploadEvent) => {
    paymentProofImageUrl.value = uploadEvent.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeProofImage = () => {
  paymentProofImageUrl.value = null
}

const handleSubmitPayment = async () => {
  if (!selectedBillForPayment.value || !currentGroupId.value) return
  if (!paymentProofImageUrl.value) {
    paymentModalError.value = 'Harap unggah foto bukti transfer/pembayaran.'
    return
  }

  paymentSubmitting.value = true
  paymentModalError.value = null
  paymentModalSuccess.value = null

  try {
    const method = paymentMethodTab.value === 'QRIS' ? 'QRIS_DYNAMIC' : 'BANK_TRANSFER_MANUAL'
    await submitPayment(currentGroupId.value, selectedBillForPayment.value.id, {
      method,
      proofImageUrl: paymentProofImageUrl.value,
      notes: paymentNotes.value.trim() || undefined,
    })

    paymentModalSuccess.value = 'Konfirmasi pembayaran berhasil dikirim! Menunggu verifikasi pengurus.'
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
// STATE & HANDLER VERIFIKASI PEMBAYARAN (PENGURUS)
// ==========================================
const isVerifyModalOpen = ref(false)
const selectedBillForVerification = ref<any>(null)
const verifyActionLoading = ref(false)
const verifyError = ref<string | null>(null)
const verifySuccess = ref<string | null>(null)
const verifyRejectNotes = ref('')
const showRejectInput = ref(false)

const openVerifyModal = (bill: any) => {
  selectedBillForVerification.value = bill
  verifyError.value = null
  verifySuccess.value = null
  verifyRejectNotes.value = ''
  showRejectInput.value = false
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
    verifySuccess.value = 'Pembayaran disetujui! Status tagihan Lunas dan otomatis tercatat di Buku Kas.'
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

const handleRejectPayment = async () => {
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
      notes: verifyRejectNotes.value.trim() || undefined,
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
</script>

<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn">
    <!-- STATE 1: JIKA PENGGUNA BELUM TERGABUNG GRUP APA PUN -->
    <div
      v-if="!activeMembership && !loadingData"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-8 sm:p-12 text-center space-y-6"
    >
      <div class="max-w-md mx-auto">
        <div class="inline-block px-3 py-1 rounded-full bg-[#FFE2AF] text-[#E37434] text-xs font-bold uppercase tracking-wider shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] mb-3">
          Belum Ada Grup
        </div>
        <h3 class="text-xl sm:text-2xl font-black text-slate-800 mb-2">
          Mulai Pengalaman Bersama eYuran
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
          <div class="w-10 h-10 rounded-2xl bg-[#007979] text-white font-black flex items-center justify-center text-sm shadow-[2px_2px_5px_rgba(0,121,121,0.3)]">
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
            class="w-full py-2.5 px-4 rounded-xl text-xs font-black text-[#007979] bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] text-center"
          >
            Masukkan Kode Gabung
          </button>
        </div>

        <!-- Opsi B: Buat Grup Baru -->
        <div
          @click="isCreateModalOpen = true; createError = null"
          class="p-6 rounded-3xl bg-[#eaf0f7] shadow-[6px_6px_14px_#cad5e2,-6px_-6px_14px_#ffffff] border border-white/80 cursor-pointer hover:-translate-y-1 transition-all space-y-3"
        >
          <div class="w-10 h-10 rounded-2xl bg-[#E37434] text-white font-black flex items-center justify-center text-sm shadow-[2px_2px_5px_rgba(227,116,52,0.3)]">
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
            class="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[2px_2px_6px_rgba(227,116,52,0.3)] active:shadow-[inset_1px_1px_3px_rgba(150,55,10,0.5)] text-center"
          >
            Buat Grup Saya
          </button>
        </div>
      </div>
    </div>

    <!-- STATE 2: JIKA SUDAH TERGABUNG GRUP AKTIF -->
    <div v-else class="space-y-6 sm:space-y-8">
      <!-- Group Info & Mobile-First Dropdown Selector Card -->
      <div class="relative z-30 rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-4 sm:p-5">
        
        <!-- Header Row: Identitas Grup & Switcher -->
        <div class="flex items-center justify-between gap-3">
          
          <!-- Avatar & Nama Grup -->
          <div
            @click="myGroups.length > 1 && (isGroupDropdownOpen = !isGroupDropdownOpen)"
            class="flex items-center space-x-3 min-w-0 flex-1"
            :class="myGroups.length > 1 ? 'cursor-pointer group' : ''"
          >
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#007979] to-[#005a5a] text-white flex-shrink-0 flex items-center justify-center font-black text-sm sm:text-base shadow-[2px_2px_6px_rgba(0,121,121,0.3)] transition-transform group-hover:scale-105">
              {{ activeMembership?.group.name.charAt(0) || 'G' }}
            </div>
            
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-1.5 mb-0.5">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Grup Aktif
                </span>
                <span v-if="myGroups.length > 1" class="text-[9px] font-extrabold text-[#007979] bg-[#007979]/10 px-1.5 py-0.2 rounded-md">
                  {{ myGroups.length }} Grup
                </span>
              </div>
              <h2 class="text-sm sm:text-base font-black text-slate-800 truncate leading-snug">
                {{ activeMembership?.group.name }}
              </h2>
              <p class="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit Fisik' : 'Anggota Langsung' }}
                <span v-if="activeMembership?.unit" class="text-slate-700 font-bold"> • {{ activeMembership?.unit.name }}</span>
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
              class="w-9 h-9 rounded-xl bg-[#eaf0f7] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] flex items-center justify-center text-slate-600 transition-all hover:text-[#007979]"
              title="Tukar Grup"
              aria-label="Tukar Grup"
            >
              <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180 text-[#007979]': isGroupDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

        </div>

        <!-- Bottom Row: Bar Kode Gabung, Tombol Lihat Anggota, & Tombol Salin -->
        <div class="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex items-center space-x-2 min-w-0">
            <span class="text-[11px] font-bold text-slate-500">Kode Gabung:</span>
            <span class="px-2.5 py-0.5 rounded-lg bg-[#eaf0f7] shadow-[inset_1.5px_1.5px_3px_#cad5e2,inset_-1.5px_-1.5px_3px_#ffffff] font-mono font-black text-xs sm:text-sm text-[#007979] tracking-wider select-all">
              {{ activeMembership?.group.joinCode }}
            </span>
          </div>

            <!-- Tombol Navigasi: Anggota -->
            <button
              v-if="activeTab !== 'MEMBERS'"
              @click="setActiveTab('MEMBERS')"
              type="button"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#eaf0f7] text-[11px] font-black text-[#007979] hover:text-[#24B1B1] shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#cad5e2] transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Lihat Daftar Anggota & Warga Komunitas"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
            <div class="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 flex justify-between items-center">
              <span>Daftar Grup Anda</span>
              <span class="text-[#007979] font-bold">Pilih untuk beralih</span>
            </div>

            <button
              v-for="(membership, idx) in myGroups"
              :key="membership.id"
              @click="selectedGroupIndex = idx; isGroupDropdownOpen = false"
              type="button"
              class="w-full min-h-[48px] flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all text-left"
              :class="selectedGroupIndex === idx
                ? 'bg-white shadow-[2px_2px_6px_#cad5e2,-2px_-2px_6px_#ffffff]'
                : 'hover:bg-white/40 active:shadow-[inset_1px_1px_3px_#cad5e2]'"
            >
              <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <div
                  class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs shadow-xs"
                  :class="selectedGroupIndex === idx ? 'bg-[#007979] text-white' : 'bg-slate-200 text-slate-600'"
                >
                  {{ membership.group.name.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-black text-slate-800 truncate">
                    {{ membership.group.name }}
                  </p>
                  <p class="text-[10px] text-slate-500 font-medium">
                    Peran: <span class="font-bold text-slate-700">{{ membership.role }}</span>
                    <span v-if="membership.status === 'PENDING'" class="text-[#E37434] font-bold"> (Menunggu Persetujuan)</span>
                    <span v-if="membership.unit"> • Unit: {{ membership.unit.name }}</span>
                    <span class="text-slate-400"> • </span>
                    <span class="font-mono text-[#007979] font-bold">Kode: {{ membership.group.joinCode }}</span>
                  </p>
                </div>
              </div>

              <div v-if="selectedGroupIndex === idx" class="w-5 h-5 rounded-md bg-[#007979]/10 text-[#007979] flex items-center justify-center flex-shrink-0 ml-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
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
      <!-- SUB-HALAMAN 1: IURAN & TAGIHAN (DASHBOARD)                     -->
      <!-- ============================================================== -->
      <OverviewView
        v-if="activeTab === 'DASHBOARD'"
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
      />

      <!-- ============================================================== -->
      <!-- SUB-HALAMAN 2: TRANSPARANSI BUKU KAS (LEDGER)                  -->
      <!-- ============================================================== -->
      <LedgerView
        v-else-if="activeTab === 'LEDGER'"
        :active-membership="activeMembership"
        :is-pengurus="isPengurus"
        :ledger-data="ledgerData"
        @go-to-dashboard="setActiveTab('DASHBOARD')"
        @open-create-record="openLedgerModal"
        @delete-entry="handleDeleteLedgerEntry"
      />

      <!-- ============================================================== -->
      <!-- SUB-HALAMAN 3: DAFTAR ANGGOTA GRUP (MEMBERS)                   -->
      <!-- ============================================================== -->
      <MembersView
        v-else-if="activeTab === 'MEMBERS'"
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
      />
    </div>

    <!-- MODAL 1: BUAT GRUP BARU -->
    <Teleport to="body">
      <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isCreateModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#FFE2AF] text-[#E37434] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
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
                @click="isCreateModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
              >
                ✕
              </button>
            </div>

            <div v-if="createError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ createError }}
            </div>

            <form @submit.prevent="handleCreateGroup" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Grup / Lingkungan
                </label>
                <input
                  v-model="createName"
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
                    @click="createType = 'PHYSICAL_UNIT'"
                    :class="[
                      'p-3 rounded-2xl text-left border transition-all',
                      createType === 'PHYSICAL_UNIT'
                        ? 'bg-white border-[#007979] shadow-[2px_2px_6px_rgba(0,121,121,0.2)]'
                        : 'bg-[#eaf0f7] border-white/80 shadow-[inset_2px_2px_4px_#cbd7e5]'
                    ]"
                  >
                    <span class="block text-xs font-black" :class="createType === 'PHYSICAL_UNIT' ? 'text-[#007979]' : 'text-slate-700'">
                      Unit Fisik
                    </span>
                    <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                      Perumahan, RT/RW, Indekos (per nomor rumah/kamar)
                    </span>
                  </button>

                  <button
                    type="button"
                    @click="createType = 'DIRECT_MEMBER'"
                    :class="[
                      'p-3 rounded-2xl text-left border transition-all',
                      createType === 'DIRECT_MEMBER'
                        ? 'bg-white border-[#007979] shadow-[2px_2px_6px_rgba(0,121,121,0.2)]'
                        : 'bg-[#eaf0f7] border-white/80 shadow-[inset_2px_2px_4px_#cbd7e5]'
                    ]"
                  >
                    <span class="block text-xs font-black" :class="createType === 'DIRECT_MEMBER' ? 'text-[#007979]' : 'text-slate-700'">
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
                  v-model="createDescription"
                  type="text"
                  placeholder="Contoh: Iuran kebersihan dan kas bulanan warga"
                  class="w-full px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                :disabled="createLoading"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
              >
                {{ createLoading ? 'Menerbitkan Grup...' : 'Terbitkan Grup Baru' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 2: GABUNG GRUP VIA KODE -->
    <Teleport to="body">
      <div v-if="isJoinModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isJoinModalOpen = false"
        ></div>

      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
          <div class="flex items-start justify-between">
            <div>
              <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#24B1B1]/20 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
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
              @click="isJoinModalOpen = false"
              class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
            >
              ✕
            </button>
          </div>

          <div v-if="joinError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
            <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
            {{ joinError }}
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
                  class="flex-1 px-4 py-3 rounded-2xl bg-[#eaf0f7] text-slate-800 text-xs sm:text-sm font-semibold shadow-[inset_2px_2px_5px_#cad5e2,inset_-2px_-2px_5px_#ffffff] border border-white/60 focus:ring-2 focus:ring-[#007979] focus:outline-none uppercase font-mono tracking-wider"
                />
                <button
                  type="button"
                  @click="handleLookupCode"
                  :disabled="lookupLoading"
                  class="px-5 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_2px_8px_rgba(0,121,121,0.35)] active:scale-95 disabled:opacity-50 whitespace-nowrap"
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
                @click="handleJoinGroup"
                :disabled="joinLoading"
                class="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_12px_rgba(227,116,52,0.35)] active:scale-95 disabled:opacity-50 text-center uppercase tracking-wider"
              >
                {{ joinLoading ? 'Mengirim Permohonan...' : 'Kirim Permohonan Gabung' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

    <!-- MODAL 3: SET / TERBITKAN TAGIHAN BARU (KHUSUS PENGURUS) -->
    <Teleport to="body">
      <div v-if="isBillModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isBillModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-3 sm:p-4">
          <div class="relative w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-5 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-4 text-slate-800 my-8">
            
            <!-- Modal Header -->
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#E37434]/15 text-[#E37434] text-[10px] font-black tracking-wider uppercase mb-1 shadow-xs">
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
                @click="isBillModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434] transition-all"
              >
                ✕
              </button>
            </div>

            <!-- Error & Success Alert -->
            <div v-if="billError" class="p-3 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ billError }}
            </div>
            <div v-if="billSuccess" class="p-3 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-emerald-900 mb-0.5">Sukses</span>
              {{ billSuccess }}
            </div>

            <!-- TAB NAVIGATOR: Mode Iuran Rutin vs Sekali Bayar -->
            <div class="grid grid-cols-2 p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cbd7e5,inset_-2px_-2px_5px_#ffffff]">
              <button
                type="button"
                @click="billMode = 'RECURRING'"
                class="py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5"
                :class="billMode === 'RECURRING'
                  ? 'bg-gradient-to-r from-[#007979] to-[#24B1B1] text-white shadow-[2px_2px_6px_rgba(0,121,121,0.35)]'
                  : 'text-slate-600 hover:text-[#007979]'"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Iuran Rutin (Akumulatif)</span>
              </button>
              <button
                type="button"
                @click="billMode = 'ONCE'"
                class="py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5"
                :class="billMode === 'ONCE'
                  ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white shadow-[2px_2px_6px_rgba(227,116,52,0.35)]'
                  : 'text-slate-600 hover:text-[#E37434]'"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all"
                  >
                    Iuran RT Standar
                  </button>
                  <button
                    type="button"
                    @click="applyRecurringPreset('KOST')"
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all"
                  >
                    Kost Mahasiswa
                  </button>
                  <button
                    type="button"
                    @click="applyRecurringPreset('PAGUYUBAN')"
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#007979] transition-all"
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
                <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#eaf0f7] shadow-[inset_1.5px_1.5px_3px_#cbd7e5,inset_-1.5px_-1.5px_3px_#ffffff]">
                  <button
                    type="button"
                    @click="recurringFrequency = 'MONTHLY'"
                    class="py-2 text-center rounded-lg text-xs font-black transition-all"
                    :class="recurringFrequency === 'MONTHLY'
                      ? 'bg-white text-[#007979] shadow-[1.5px_1.5px_4px_#cad5e2]'
                      : 'text-slate-600'"
                  >
                    Bulanan (Tiap Bulan)
                  </button>
                  <button
                    type="button"
                    @click="recurringFrequency = 'YEARLY'"
                    class="py-2 text-center rounded-lg text-xs font-black transition-all"
                    :class="recurringFrequency === 'YEARLY'
                      ? 'bg-white text-[#007979] shadow-[1.5px_1.5px_4px_#cad5e2]'
                      : 'text-slate-600'"
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
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#007979] font-black text-[11px] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center space-x-1 hover:text-[#24B1B1]"
                  >
                    <span>+ Tambah Komponen</span>
                  </button>
                </div>

                <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  <div
                    v-for="(item, idx) in recurringItems"
                    :key="idx"
                    class="flex items-center space-x-2"
                  >
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
                      class="w-7 h-7 rounded-lg bg-[#eaf0f7] text-slate-400 hover:text-red-600 shadow-[2px_2px_4px_#cad5e2] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center text-xs shrink-0"
                      title="Hapus baris"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Total Nominal Rutin -->
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-600">Total Tarif per {{ recurringFrequency === 'MONTHLY' ? 'Bulan' : 'Tahun' }}:</span>
                  <span class="font-mono font-black text-sm text-[#007979]">
                    {{ formatRupiah(recurringTotalAmount) }}
                  </span>
                </div>
              </div>

              <!-- Tombol Simpan Aturan Rutin -->
              <button
                type="submit"
                :disabled="billLoading"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,80,80,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2"
              >
                {{ billLoading ? 'Menerapkan Aturan...' : 'Terapkan Aturan Tarif Rutin' }}
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
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all"
                  >
                    Patungan CCTV
                  </button>
                  <button
                    type="button"
                    @click="applyOncePreset('EVENT')"
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all"
                  >
                    Acara 17 Agustus
                  </button>
                  <button
                    type="button"
                    @click="applyOncePreset('REGISTRASI')"
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] text-[10px] font-bold text-slate-700 hover:text-[#E37434] transition-all"
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
                    class="p-2.5 rounded-xl border text-left transition-all"
                    :class="onceTargetType === 'ALL'
                      ? 'bg-white border-[#E37434] shadow-[2px_2px_6px_rgba(227,116,52,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_1px_1px_3px_#cbd7e5]'"
                  >
                    <span class="block text-xs font-black" :class="onceTargetType === 'ALL' ? 'text-[#E37434]' : 'text-slate-700'">
                      Massal (Seluruh {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit' : 'Warga' }})
                    </span>
                    <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                      Diterbitkan ke semua warga grup
                    </span>
                  </button>

                  <button
                    type="button"
                    @click="onceTargetType = 'SINGLE'"
                    class="p-2.5 rounded-xl border text-left transition-all"
                    :class="onceTargetType === 'SINGLE'
                      ? 'bg-white border-[#E37434] shadow-[2px_2px_6px_rgba(227,116,52,0.2)]'
                      : 'bg-[#eaf0f7] border-white/80 shadow-[inset_1px_1px_3px_#cbd7e5]'"
                  >
                    <span class="block text-xs font-black" :class="onceTargetType === 'SINGLE' ? 'text-[#E37434]' : 'text-slate-700'">
                      Satuan (1 {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit' : 'Orang' }})
                    </span>
                    <span class="block text-[10px] text-slate-500 font-medium mt-0.5">
                      Khusus 1 unit / anggota tertentu
                    </span>
                  </button>
                </div>

                <!-- Dropdown Pilih 1 Target jika memilih Satuan -->
                <div v-if="onceTargetType === 'SINGLE'" class="mt-2.5 animate-fadeIn">
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">
                    Pilih {{ activeMembership?.group.type === 'PHYSICAL_UNIT' ? 'Unit Hunian' : 'Anggota' }} Tujuan:
                  </label>
                  <select
                    v-if="activeMembership?.group.type === 'PHYSICAL_UNIT'"
                    v-model="onceTargetUnitId"
                    class="w-full px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#E37434]"
                  >
                    <option v-for="u in groupUnitsList" :key="u.id" :value="u.id">
                      {{ u.name }} {{ u.description ? `(${u.description})` : '' }}
                    </option>
                  </select>
                  <select
                    v-else
                    v-model="onceTargetMemberId"
                    class="w-full px-3 py-2 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-bold shadow-[inset_2px_2px_4px_#cad5e2] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#E37434]"
                  >
                    <option v-for="m in groupMembersList" :key="m.id" :value="m.id">
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
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#E37434] font-black text-[11px] shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center space-x-1 hover:text-[#e87b38]"
                  >
                    <span>+ Tambah Komponen</span>
                  </button>
                </div>

                <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  <div
                    v-for="(item, idx) in onceItems"
                    :key="idx"
                    class="flex items-center space-x-2"
                  >
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
                      class="w-7 h-7 rounded-lg bg-[#eaf0f7] text-slate-400 hover:text-red-600 shadow-[2px_2px_4px_#cad5e2] active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center text-xs shrink-0"
                      title="Hapus baris"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Total Nominal Sekali Bayar -->
                <div class="p-3 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] border border-white/60 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-600">Total Nominal per Lembar:</span>
                  <span class="font-mono font-black text-sm text-[#E37434]">
                    {{ formatRupiah(onceTotalAmount) }}
                  </span>
                </div>
              </div>

              <!-- Tombol Terbitkan Sekali Bayar -->
              <button
                type="submit"
                :disabled="billLoading"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(150,55,10,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2"
              >
                {{ billLoading ? 'Menerbitkan Tagihan...' : 'Terbitkan Tagihan Sekali Bayar' }}
              </button>
            </form>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 4: CATAT MUTASI KAS (PEMASUKAN & PENGELUARAN) -->
    <Teleport to="body">
      <div v-if="isLedgerModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isLedgerModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-3 sm:p-4">
          <div class="relative w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-5 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-4 text-slate-800 my-8">
            
            <!-- Modal Header -->
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/10 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1 shadow-xs">
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
                @click="isLedgerModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434] transition-all"
              >
                ✕
              </button>
            </div>

            <!-- Error & Success Alert -->
            <div v-if="ledgerError" class="p-3 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ ledgerError }}
            </div>
            <div v-if="ledgerSuccess" class="p-3 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-emerald-900 mb-0.5">Sukses</span>
              {{ ledgerSuccess }}
            </div>

            <!-- Form Body -->
            <form @submit.prevent="handleRecordLedger" class="space-y-4">
              <!-- 1. Tipe Transaksi: Pengeluaran vs Pemasukan -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Transaksi Kas
                </label>
                <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_5px_#cbd7e5,inset_-2px_-2px_5px_#ffffff]">
                  <button
                    type="button"
                    @click="ledgerType = 'EXPENSE'; ledgerCategory = expenseCategories[0]"
                    class="py-2.5 px-2 text-center rounded-xl text-xs font-black transition-all"
                    :class="ledgerType === 'EXPENSE'
                      ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] text-white shadow-[0_2px_8px_rgba(227,116,52,0.35)]'
                      : 'text-slate-600 hover:text-slate-900'"
                  >
                    Pengeluaran (Kas Keluar)
                  </button>
                  <button
                    type="button"
                    @click="ledgerType = 'INCOME'; ledgerCategory = incomeCategories[0]"
                    class="py-2.5 px-2 text-center rounded-xl text-xs font-black transition-all"
                    :class="ledgerType === 'INCOME'
                      ? 'bg-gradient-to-r from-[#007979] to-[#005a5a] text-white shadow-[0_2px_8px_rgba(0,121,121,0.35)]'
                      : 'text-slate-600 hover:text-slate-900'"
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
                    v-for="cat in (ledgerType === 'EXPENSE' ? expenseCategories : incomeCategories)"
                    :key="cat"
                    type="button"
                    @click="ledgerCategory = cat"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    :class="ledgerCategory === cat
                      ? (ledgerType === 'EXPENSE' ? 'bg-[#E37434] text-white shadow-xs' : 'bg-[#007979] text-white shadow-xs')
                      : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff] hover:text-slate-900'"
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
                :disabled="ledgerLoading"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider mt-2"
                :class="ledgerType === 'EXPENSE'
                  ? 'bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)]'
                  : 'bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)]'"
              >
                {{ ledgerLoading ? 'Menyimpan Catatan...' : (ledgerType === 'EXPENSE' ? 'Simpan Pengeluaran Kas' : 'Simpan Pemasukan Kas') }}
              </button>
            </form>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 5: PENGATURAN TUJUAN TRANSFER (PENGURUS) -->
    <Teleport to="body">
      <div v-if="isPaymentConfigModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isPaymentConfigModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-lg rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#24B1B1]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
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
                @click="isPaymentConfigModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
              >
                ✕
              </button>
            </div>

            <!-- Pesan Error / Sukses -->
            <div v-if="configError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ configError }}
            </div>
            <div v-if="configSuccess" class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-green-200 text-green-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-green-900 mb-0.5">Berhasil</span>
              {{ configSuccess }}
            </div>

            <div v-if="configLoading" class="p-8 text-center text-slate-500 font-medium text-xs">
              Memuat pengaturan pembayaran...
            </div>

            <form v-else @submit.prevent="handleSavePaymentConfig" class="space-y-4">
              <!-- OPSI 1: GAMBAR QRIS -->
              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <input
                      id="enableQris"
                      v-model="configQrisEnabled"
                      type="checkbox"
                      class="w-4 h-4 rounded text-[#007979] focus:ring-[#007979] border-slate-300"
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

                    <div v-if="!configQrisImageUrl" class="text-center p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-white/40">
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
                      <div class="p-2 rounded-2xl bg-white shadow-inner max-w-[200px] mx-auto border border-slate-200">
                        <img
                          :src="configQrisImageUrl"
                          alt="QRIS Preview"
                          class="w-full h-auto max-h-48 object-contain rounded-xl"
                        />
                      </div>
                      <div class="flex justify-center space-x-2">
                        <label class="cursor-pointer px-3 py-1 rounded-xl bg-[#eaf0f7] text-[#007979] text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2]">
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
                          class="px-3 py-1 rounded-xl bg-[#eaf0f7] text-red-600 text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2]"
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
              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <input
                      id="enableBank"
                      v-model="configBankEnabled"
                      type="checkbox"
                      class="w-4 h-4 rounded text-[#007979] focus:ring-[#007979] border-slate-300"
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
                :disabled="configSaving"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
              >
                {{ configSaving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Pembayaran' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 6: PEMBAYARAN TAGIHAN (WARGA) -->
    <Teleport to="body">
      <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isPaymentModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#FFE2AF] text-[#E37434] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
                  Pembayaran Iuran
                </div>
                <h3 class="text-xl font-black text-slate-800 tracking-tight">
                  Bayar Tagihan
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-0.5">
                  {{ selectedBillForPayment?.title }} • {{ selectedBillForPayment?.period }}
                </p>
              </div>
              <button
                type="button"
                @click="isPaymentModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
              >
                ✕
              </button>
            </div>

            <!-- Pesan Error / Sukses -->
            <div v-if="paymentModalError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ paymentModalError }}
            </div>
            <div v-if="paymentModalSuccess" class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-green-200 text-green-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-green-900 mb-0.5">Berhasil</span>
              {{ paymentModalSuccess }}
            </div>

            <div v-if="paymentDetailLoading" class="p-8 text-center text-slate-500 font-medium text-xs">
              Memuat detail tagihan dan metode transfer...
            </div>

            <form v-else @submit.prevent="handleSubmitPayment" class="space-y-4">
              <!-- Ringkasan Tagihan & Nominal -->
              <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-2">
                <div class="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Unit / Anggota:</span>
                  <span class="font-bold text-slate-800">
                    {{ selectedBillForPayment?.unit?.name || selectedBillForPayment?.member?.user?.fullName || 'Warga' }}
                  </span>
                </div>
                <div v-if="selectedBillForPayment?.items && selectedBillForPayment.items.length > 0" class="pt-2 border-t border-slate-200/80 space-y-1">
                  <div
                    v-for="item in selectedBillForPayment.items"
                    :key="item.id"
                    class="flex items-center justify-between text-[11px] text-slate-500"
                  >
                    <span>{{ item.name }}</span>
                    <span>{{ formatRupiah(item.amount) }}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700">Total Tagihan:</span>
                  <span class="text-lg font-black text-[#007979]">
                    {{ formatRupiah(selectedBillForPayment?.totalAmount) }}
                  </span>
                </div>
              </div>

              <!-- Pilihan Tab Metode Transfer jika keduanya tersedia -->
              <div
                v-if="billPaymentOptions?.qris && billPaymentOptions?.bank"
                class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff]"
              >
                <button
                  type="button"
                  @click="paymentMethodTab = 'QRIS'"
                  class="py-2 text-center rounded-xl text-xs font-black transition-all"
                  :class="paymentMethodTab === 'QRIS'
                    ? 'bg-[#007979] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'"
                >
                  QRIS (Scan)
                </button>
                <button
                  type="button"
                  @click="paymentMethodTab = 'BANK'"
                  class="py-2 text-center rounded-xl text-xs font-black transition-all"
                  :class="paymentMethodTab === 'BANK'
                    ? 'bg-[#007979] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'"
                >
                  Transfer Rekening
                </button>
              </div>

              <!-- TAMPILAN 1: QRIS -->
              <div
                v-if="paymentMethodTab === 'QRIS' && billPaymentOptions?.qris"
                class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] border border-white/60 text-center space-y-3"
              >
                <div class="text-[11px] font-bold text-slate-600">
                  Scan QRIS menggunakan Mobile Banking atau E-Wallet
                </div>
                <div class="p-3 rounded-2xl bg-white shadow-inner max-w-[210px] mx-auto border border-slate-200">
                  <img
                    :src="billPaymentOptions.qris.imageUrl || billPaymentOptions.qris.qrDataUrl"
                    alt="QRIS Komunitas"
                    class="w-full h-auto object-contain rounded-xl"
                  />
                </div>
                <div v-if="billPaymentOptions.qris.merchantName" class="text-xs font-black text-slate-800">
                  {{ billPaymentOptions.qris.merchantName }}
                </div>
                <p class="text-[10px] text-slate-500 font-medium">
                  Pastikan nominal transfer pas senilai <strong class="text-slate-800">{{ formatRupiah(selectedBillForPayment?.totalAmount) }}</strong>
                </p>
              </div>

              <!-- TAMPILAN 2: TRANSFER REKENING / E-WALLET -->
              <div
                v-else-if="paymentMethodTab === 'BANK' && billPaymentOptions?.bank"
                class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[4px_4px_10px_#cad5e2,-4px_-4px_10px_#ffffff] border border-white/60 space-y-2.5"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700">Tujuan Transfer Rekening:</span>
                  <button
                    type="button"
                    @click="copyAccountDetails(billPaymentOptions.bank.accountDetails || billPaymentOptions.bank.accountNumber)"
                    class="px-2.5 py-1 rounded-lg bg-[#eaf0f7] text-[#007979] text-[10px] font-black shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] transition-all"
                  >
                    {{ copiedAccount ? 'Tersalin!' : 'Salin Info' }}
                  </button>
                </div>
                <div class="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                  {{ billPaymentOptions.bank.accountDetails || `${billPaymentOptions.bank.bankName} ${billPaymentOptions.bank.accountNumber} a.n ${billPaymentOptions.bank.accountHolder}` }}
                </div>
              </div>

              <!-- NOTICE JIKA BELUM ADA METODE PEMBAYARAN -->
              <div
                v-else-if="!billPaymentOptions?.qris && !billPaymentOptions?.bank"
                class="p-4 rounded-2xl bg-slate-100 text-center text-xs font-semibold text-slate-600"
              >
                Pengurus belum menyetel rekening atau QRIS grup. Anda tetap dapat mengunggah bukti pembayaran jika telah transfer langsung.
              </div>

              <!-- FORM BUKTI PEMBAYARAN -->
              <div class="space-y-3 pt-1">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Unggah Bukti Transfer / Pembayaran <span class="text-[#E37434]">*</span>
                  </label>
                  <div v-if="!paymentProofImageUrl" class="p-4 rounded-2xl border-2 border-dashed border-slate-300 text-center bg-white/40">
                    <label class="cursor-pointer flex flex-col items-center justify-center space-y-1">
                      <span class="text-xs font-bold text-[#007979]">Pilih Foto Bukti Transfer</span>
                      <span class="text-[10px] text-slate-400">Screenshot m-banking atau struk ATM (Maks 5 MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        @change="handleProofImageUpload"
                        class="hidden"
                      />
                    </label>
                  </div>
                  <div v-else class="text-center space-y-2">
                    <div class="p-2 rounded-2xl bg-white shadow-inner max-w-[200px] mx-auto border border-slate-200">
                      <img
                        :src="paymentProofImageUrl"
                        alt="Bukti Transfer"
                        class="w-full h-auto max-h-40 object-contain rounded-xl"
                      />
                    </div>
                    <button
                      type="button"
                      @click="removeProofImage"
                      class="px-3 py-1 rounded-xl bg-[#eaf0f7] text-red-600 text-xs font-bold shadow-[2px_2px_4px_#cad5e2,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2]"
                    >
                      Hapus / Ganti Foto
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Pembayaran (Opsional)
                  </label>
                  <input
                    v-model="paymentNotes"
                    type="text"
                    placeholder="Contoh: Transfer via BCA a.n Siti Aminah"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="paymentSubmitting || !paymentProofImageUrl"
                  class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#e87b38] to-[#ce6326] shadow-[0_4px_14px_rgba(227,116,52,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
                >
                  {{ paymentSubmitting ? 'Mengirim Konfirmasi...' : 'Kirim Bukti Pembayaran' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 7: VERIFIKASI PEMBAYARAN WARGA (PENGURUS) -->
    <Teleport to="body">
      <div v-if="isVerifyModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isVerifyModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-md rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
                  Verifikasi Kas Masuk
                </div>
                <h3 class="text-xl font-black text-slate-800 tracking-tight">
                  Periksa Bukti Pembayaran
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-0.5">
                  Cocokkan mutasi kas masuk dengan bukti transfer yang diunggah warga.
                </p>
              </div>
              <button
                type="button"
                @click="isVerifyModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
              >
                ✕
              </button>
            </div>

            <!-- Pesan Error / Sukses -->
            <div v-if="verifyError" class="p-3.5 rounded-2xl bg-[#fff2f2] border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-red-900 mb-0.5">Kendala</span>
              {{ verifyError }}
            </div>
            <div v-if="verifySuccess" class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-green-200 text-green-800 text-xs font-semibold shadow-xs">
              <span class="font-black block uppercase text-[10px] text-green-900 mb-0.5">Berhasil</span>
              {{ verifySuccess }}
            </div>

            <!-- Detail Data Tagihan & Warga -->
            <div class="p-4 rounded-2xl bg-[#eaf0f7] shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Warga / Unit:</span>
                <span class="font-bold text-slate-800">
                  {{ selectedBillForVerification?.unit?.name || selectedBillForVerification?.member?.user?.fullName || 'Warga' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Tagihan:</span>
                <span class="font-bold text-slate-800">
                  {{ selectedBillForVerification?.title }} ({{ selectedBillForVerification?.period }})
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-slate-200">
                <span class="text-slate-700 font-bold">Nominal:</span>
                <span class="font-black text-[#007979] text-sm">
                  {{ formatRupiah(selectedBillForVerification?.totalAmount) }}
                </span>
              </div>
              <div v-if="selectedBillForVerification?.payments?.[0]?.notes" class="pt-1 border-t border-slate-200">
                <span class="text-slate-500 block font-medium">Catatan Warga:</span>
                <span class="italic text-slate-700">{{ selectedBillForVerification.payments[0].notes }}</span>
              </div>
            </div>

            <!-- Foto Bukti Transfer -->
            <div class="space-y-2 text-center">
              <span class="block text-xs font-bold text-slate-700 text-left">Foto Bukti Transfer:</span>
              <div
                v-if="selectedBillForVerification?.payments?.[0]?.proofImageUrl"
                class="p-2 rounded-2xl bg-white shadow-inner max-w-[260px] mx-auto border border-slate-200"
              >
                <img
                  :src="selectedBillForVerification.payments[0].proofImageUrl"
                  alt="Bukti Transfer Warga"
                  class="w-full h-auto max-h-56 object-contain rounded-xl"
                />
              </div>
              <div v-else class="p-6 rounded-2xl bg-white/50 text-slate-400 text-xs italic">
                Tidak ada lampiran foto bukti.
              </div>
            </div>

            <!-- Form Penolakan (Jika diklik tolak) -->
            <div v-if="showRejectInput" class="space-y-2 pt-2 border-t border-slate-200">
              <label class="block text-xs font-bold text-red-700">
                Alasan Penolakan (akan dibaca oleh warga):
              </label>
              <textarea
                v-model="verifyRejectNotes"
                rows="2"
                placeholder="Contoh: Bukti transfer buram / nominal tidak sesuai"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#eaf0f7] text-slate-800 text-xs font-semibold shadow-[inset_2px_2px_4px_#cad5e2,inset_-2px_-2px_4px_#ffffff] border border-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              ></textarea>
              <div class="flex space-x-2">
                <button
                  type="button"
                  @click="handleRejectPayment"
                  :disabled="verifyActionLoading"
                  class="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-black text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  Konfirmasi Tolak
                </button>
                <button
                  type="button"
                  @click="showRejectInput = false"
                  class="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
              </div>
            </div>

            <!-- Tombol Aksi Utama -->
            <div v-else class="space-y-2 pt-1">
              <button
                type="button"
                @click="handleApprovePayment"
                :disabled="verifyActionLoading"
                class="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#007979] to-[#005a5a] shadow-[0_4px_14px_rgba(0,121,121,0.35)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-center uppercase tracking-wider"
              >
                {{ verifyActionLoading ? 'Memproses...' : 'Setujui Pembayaran (Lunas)' }}
              </button>

              <button
                type="button"
                @click="showRejectInput = true"
                :disabled="verifyActionLoading"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 text-center transition-colors"
              >
                Tolak Pembayaran Ini
              </button>
            </div>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL 8: REKAP TAGIHAN SELURUH WARGA (PENGURUS) -->
    <Teleport to="body">
      <div v-if="isAllBillsModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          @click="isAllBillsModalOpen = false"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-2xl rounded-3xl bg-[#eaf0f7] p-6 sm:p-7 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.4)] border border-slate-200/80 space-y-5 text-slate-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="inline-block px-2.5 py-0.5 rounded-lg bg-[#007979]/15 text-[#007979] text-[10px] font-black tracking-wider uppercase mb-1.5 shadow-xs">
                  Rekap Pengurus
                </div>
                <h3 class="text-xl font-black text-slate-800 tracking-tight">
                  Rekap Tagihan Seluruh Warga
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-0.5">
                  Pantau status pembayaran iuran setiap warga di grup ini.
                </p>
              </div>
              <button
                type="button"
                @click="isAllBillsModalOpen = false"
                class="w-8 h-8 rounded-xl bg-[#eaf0f7] text-slate-600 shadow-[2px_2px_5px_#cad5e2] active:shadow-[inset_2px_2px_4px_#cad5e2] flex items-center justify-center font-black text-xs hover:text-[#E37434]"
              >
                ✕
              </button>
            </div>

            <!-- Filter Status Chips -->
            <div class="flex flex-wrap gap-1.5 pb-1">
              <button
                type="button"
                @click="billFilterStatus = 'ALL'"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                :class="billFilterStatus === 'ALL' ? 'bg-[#007979] text-white shadow-xs' : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'"
              >
                Semua ({{ allGroupBills.length }})
              </button>
              <button
                type="button"
                @click="billFilterStatus = 'PENDING_VERIFICATION'"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                :class="billFilterStatus === 'PENDING_VERIFICATION' ? 'bg-[#E37434] text-white shadow-xs' : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'"
              >
                Perlu Verifikasi ({{ pendingVerificationCount }})
              </button>
              <button
                type="button"
                @click="billFilterStatus = 'UNPAID'"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                :class="billFilterStatus === 'UNPAID' ? 'bg-[#007979] text-white shadow-xs' : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'"
              >
                Belum Bayar
              </button>
              <button
                type="button"
                @click="billFilterStatus = 'PAID'"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                :class="billFilterStatus === 'PAID' ? 'bg-[#24B1B1] text-white shadow-xs' : 'bg-[#eaf0f7] text-slate-700 shadow-[2px_2px_4px_#cad5e2,-1px_-1px_3px_#ffffff]'"
              >
                Lunas
              </button>
            </div>

            <!-- List Warga Bills -->
            <div class="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              <div v-if="filteredAllBills.length === 0" class="p-8 text-center text-slate-500 font-medium text-xs">
                Tidak ada data tagihan pada kategori ini.
              </div>

              <div
                v-for="b in filteredAllBills"
                :key="b.id"
                class="p-3.5 rounded-2xl bg-[#eaf0f7] shadow-[3px_3px_8px_#cad5e2,-3px_-3px_8px_#ffffff] border border-white/70 flex items-center justify-between gap-3"
              >
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-black text-xs text-slate-800">
                      {{ b.unit?.name || b.member?.user?.fullName || 'Warga' }}
                    </span>
                    <span class="text-[10px] text-slate-500 font-medium">
                      • {{ b.title }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 font-medium mt-0.5">
                    Periode: {{ b.period || 'Berjalan' }}
                  </p>
                  <div class="mt-1 text-xs font-black text-[#007979]">
                    {{ formatRupiah(b.totalAmount) }}
                  </div>
                </div>

                <div>
                  <button
                    v-if="b.status === 'PENDING_VERIFICATION'"
                    type="button"
                    @click="isAllBillsModalOpen = false; openVerifyModal(b)"
                    class="px-3 py-1 rounded-xl bg-gradient-to-r from-[#007979] to-[#005a5a] text-white font-black text-[11px] shadow-[2px_2px_5px_rgba(0,121,121,0.3)] hover:brightness-105 active:scale-95 transition-all uppercase whitespace-nowrap"
                  >
                    Verifikasi
                  </button>
                  <span
                    v-else-if="b.status === 'PAID'"
                    class="px-2.5 py-0.5 rounded-lg bg-[#24B1B1]/15 text-[#007979] font-black text-[11px] uppercase whitespace-nowrap"
                  >
                    Lunas
                  </span>
                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-600 font-black text-[11px] uppercase whitespace-nowrap"
                  >
                    Belum Bayar
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                @click="isAllBillsModalOpen = false"
                class="py-2.5 px-5 rounded-xl bg-[#eaf0f7] text-slate-700 font-bold text-xs shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_2px_#cad5e2] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
