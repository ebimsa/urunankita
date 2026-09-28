import { useAuth } from './useAuth'

export interface GroupMembership {
  id: string
  groupId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isActive: boolean
  group: {
    id: string
    name: string
    description?: string
    type: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'
    joinCode: string
    totalMembers?: number
    totalUnits?: number
  }
  unit?: {
    id: string
    name: string
    description?: string
  } | null
}

export interface GroupPreview {
  id: string
  name: string
  description?: string
  type: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'
  joinCode: string
  units?: Array<{
    id: string
    name: string
    description?: string
  }>
}

export interface CreateLedgerPayload {
  amount: number
  category: string
  description: string
  receiptUrl?: string
  entryDate?: string
}

export interface GroupPaymentConfig {
  id?: string
  groupId: string
  qrisEnabled: boolean
  qrisImageUrl?: string
  rawQrString?: string
  merchantName?: string
  bankEnabled: boolean
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  accountDetails?: string
  cashEnabled: boolean
  instructions?: string
}

export interface PaymentOptionResponse {
  bill: any
  paymentOptions: {
    qris: {
      rawString?: string
      qrDataUrl?: string
      imageUrl?: string
      amount: number
      merchantName?: string
    } | null
    bank: {
      bankName?: string
      accountNumber?: string
      accountHolder?: string
      accountDetails?: string
    } | null
    cashEnabled: boolean
    instructions?: string
  }
}

export const useGroups = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'
  const { token } = useAuth()

  const myGroups = useState<GroupMembership[]>('eyuran_my_groups', () => [])
  const isCreateModalOpen = useState<boolean>('eyuran_modal_create_group', () => false)
  const isJoinModalOpen = useState<boolean>('eyuran_modal_join_group', () => false)
  const isBillModalOpen = useState<boolean>('eyuran_modal_bill', () => false)

  const openCreateModal = () => {
    isCreateModalOpen.value = true
  }
  const closeCreateModal = () => {
    isCreateModalOpen.value = false
  }
  const openJoinModal = () => {
    isJoinModalOpen.value = true
  }
  const closeJoinModal = () => {
    isJoinModalOpen.value = false
  }
  const openBillModal = () => {
    isBillModalOpen.value = true
  }
  const closeBillModal = () => {
    isBillModalOpen.value = false
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMyGroups = async () => {
    if (!token.value) {
      myGroups.value = []
      return []
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<GroupMembership[]>(`${apiBase}/groups/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      myGroups.value = data
      return data
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal memuat grup'
      return []
    } finally {
      loading.value = false
    }
  }

  const createGroup = async (payload: {
    name: string
    type: 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'
    description?: string
  }) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    loading.value = true
    error.value = null

    try {
      const res = await $fetch<any>(`${apiBase}/groups`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
      await fetchMyGroups()
      return res
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal membuat grup'
      error.value = Array.isArray(msg) ? msg.join(', ') : msg
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  const previewGroup = async (joinCode: string): Promise<GroupPreview> => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<GroupPreview>(`${apiBase}/groups/preview/${joinCode.trim().toUpperCase()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Kode grup tidak ditemukan'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const joinGroup = async (payload: { joinCode: string; unitId?: string; unitName?: string }) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    loading.value = true
    error.value = null

    try {
      const res = await $fetch<any>(`${apiBase}/groups/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: {
          joinCode: payload.joinCode.trim().toUpperCase(),
          unitId: payload.unitId || undefined,
          unitName: payload.unitName?.trim() || undefined,
        },
      })
      await fetchMyGroups()
      return res
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal bergabung dengan grup'
      error.value = Array.isArray(msg) ? msg.join(', ') : msg
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  const getGroupLedger = async (groupId: string) => {
    if (!token.value) return null

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/ledger`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      return null
    }
  }

  const getMyBills = async (groupId: string) => {
    if (!token.value) return []

    try {
      return await $fetch<any[]>(`${apiBase}/groups/${groupId}/bills/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      return []
    }
  }

  const getGroupBills = async (groupId: string) => {
    if (!token.value) return []

    try {
      return await $fetch<any[]>(`${apiBase}/groups/${groupId}/bills`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      return []
    }
  }

  const createBill = async (
    groupId: string,
    payload: {
      title: string
      period?: string
      dueDate?: string
      unitId?: string
      memberId?: string
      applyToAll?: boolean
      items: Array<{ name: string; amount: number }>
    },
  ) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    loading.value = true
    error.value = null

    try {
      const res = await $fetch<any>(`${apiBase}/groups/${groupId}/bills`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
      return res
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal menerbitkan tagihan'
      error.value = Array.isArray(msg) ? msg.join(', ') : msg
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  const getGroupUnits = async (groupId: string) => {
    if (!token.value) return []

    try {
      return await $fetch<any[]>(`${apiBase}/groups/${groupId}/units`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      return []
    }
  }

  const getGroupMembers = async (groupId: string) => {
    if (!token.value) return []

    try {
      return await $fetch<any[]>(`${apiBase}/groups/${groupId}/members`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      return []
    }
  }

  const approveGroupMember = async (groupId: string, memberId: string) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/members/${memberId}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal menyetujui anggota'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const rejectGroupMember = async (groupId: string, memberId: string) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/members/${memberId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal menolak anggota'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const recordLedgerExpense = async (groupId: string, payload: CreateLedgerPayload) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/ledger/expense`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal mencatat pengeluaran kas'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const recordLedgerIncome = async (groupId: string, payload: CreateLedgerPayload) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/ledger/income`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal mencatat pemasukan kas'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const deleteLedgerEntry = async (groupId: string, entryId: string) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/ledger/${entryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal menghapus entri kas'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const getPaymentConfig = async (groupId: string): Promise<GroupPaymentConfig> => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<GroupPaymentConfig>(`${apiBase}/groups/${groupId}/payment-config`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal memuat konfigurasi pembayaran'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const updatePaymentConfig = async (groupId: string, payload: Partial<GroupPaymentConfig>) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/payment-config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal memperbarui konfigurasi pembayaran'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const getBillDetail = async (groupId: string, billId: string): Promise<PaymentOptionResponse> => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<PaymentOptionResponse>(`${apiBase}/groups/${groupId}/bills/${billId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal memuat detail tagihan'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const submitPayment = async (
    groupId: string,
    billId: string,
    payload: {
      method: 'QRIS_DYNAMIC' | 'BANK_TRANSFER_MANUAL' | 'CASH_MANUAL'
      proofImageUrl?: string
      notes?: string
    }
  ) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/bills/${billId}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal mengirim pembayaran'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const verifyPayment = async (
    groupId: string,
    billId: string,
    paymentId: string,
    payload: {
      status: 'SUCCESS' | 'REJECTED'
      notes?: string
    }
  ) => {
    if (!token.value) throw new Error('Harap login terlebih dahulu')

    try {
      return await $fetch<any>(`${apiBase}/groups/${groupId}/bills/${billId}/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Gagal memverifikasi pembayaran'
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  return {
    myGroups,
    loading,
    error,
    isCreateModalOpen,
    isJoinModalOpen,
    isBillModalOpen,
    openCreateModal,
    closeCreateModal,
    openJoinModal,
    closeJoinModal,
    openBillModal,
    closeBillModal,
    fetchMyGroups,
    createGroup,
    previewGroup,
    joinGroup,
    getGroupLedger,
    getMyBills,
    getGroupBills,
    createBill,
    getGroupUnits,
    getGroupMembers,
    recordLedgerExpense,
    recordLedgerIncome,
    deleteLedgerEntry,
    getPaymentConfig,
    updatePaymentConfig,
    getBillDetail,
    submitPayment,
    verifyPayment,
    approveGroupMember,
    rejectGroupMember,
  }
}
