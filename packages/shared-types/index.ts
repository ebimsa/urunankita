/**
 * ============================================================================
 * eYuran Shared Types & Interfaces
 * Digunakan bersama oleh apps/backend dan apps/frontend
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. ENUMS & CONSTANTS
// ----------------------------------------------------------------------------

export type GlobalRole = 'USER' | 'SUPERADMIN'

export type GroupType = 'PHYSICAL_UNIT' | 'DIRECT_MEMBER'

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type BillStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'CANCELLED'

export type PaymentMethod = 'QRIS_DYNAMIC' | 'BANK_TRANSFER_MANUAL' | 'CASH_MANUAL'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'REJECTED'

export type CashFlowType = 'INCOME' | 'EXPENSE'

// ----------------------------------------------------------------------------
// 2. USER & AUTH
// ----------------------------------------------------------------------------

export interface User {
  id: string
  fullName: string
  email?: string | null
  phone: string
  avatarUrl?: string | null
  role?: GlobalRole
  createdAt?: string
}

export interface AuthResponse {
  message: string
  accessToken: string
  user: User
}

// ----------------------------------------------------------------------------
// 3. GROUPS & MEMBERSHIP
// ----------------------------------------------------------------------------

export interface GroupUnitSummary {
  id: string
  name: string
  description?: string | null
}

export interface GroupSummary {
  id: string
  name: string
  description?: string | null
  type: GroupType
  joinCode: string
  totalMembers?: number
  totalUnits?: number
}

export interface GroupMembership {
  id: string
  groupId: string
  role: MemberRole
  status: MembershipStatus
  isActive: boolean
  group: GroupSummary
  unit?: GroupUnitSummary | null
}

export interface GroupPreview {
  id: string
  name: string
  description?: string | null
  type: GroupType
  joinCode: string
  units?: GroupUnitSummary[]
}

// ----------------------------------------------------------------------------
// 4. BILLING & PAYMENTS
// ----------------------------------------------------------------------------

export interface BillItem {
  id?: string
  name: string
  amount: number
}

export interface Bill {
  id: string
  groupId: string
  title: string
  period?: string | null
  dueDate?: string | null
  status: BillStatus
  totalAmount: number
  unitId?: string | null
  memberId?: string | null
  items: BillItem[]
  payments?: Payment[]
  createdAt?: string
  updatedAt?: string
}

export interface Payment {
  id: string
  billId: string
  payerId: string
  method: PaymentMethod
  amount: number
  proofImageUrl?: string | null
  status: PaymentStatus
  notes?: string | null
  verifiedById?: string | null
  verifiedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface GroupPaymentConfig {
  id?: string
  groupId: string
  qrisEnabled: boolean
  qrisImageUrl?: string | null
  rawQrString?: string | null
  merchantName?: string | null
  bankEnabled: boolean
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
  accountDetails?: string | null
  cashEnabled: boolean
  instructions?: string | null
  updatedAt?: string
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

// ----------------------------------------------------------------------------
// 5. LEDGER & AUDIT
// ----------------------------------------------------------------------------

export interface CreateLedgerPayload {
  amount: number
  category: string
  description: string
  receiptUrl?: string
  entryDate?: string
}

export interface CashLedgerEntry {
  id: string
  groupId: string
  type: CashFlowType
  amount: number
  category: string
  description: string
  receiptUrl?: string | null
  paymentId?: string | null
  entryDate: string
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  groupId: string
  userId: string
  action: string
  details: Record<string, any>
  timestamp: string
  user?: {
    id: string
    fullName: string
  }
}
