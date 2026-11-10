export const REJECTION_REASONS = {
  payment_proof_invalid: "Payment proof invalid",
  transaction_not_found: "Transaction not found",
  wrong_amount: "Wrong amount",
  duplicate_transaction: "Duplicate transaction",
  bank_transfer_not_received: "Bank transfer not received",
  payment_not_received: "Payment not received",
  invalid_transaction: "Invalid transaction",
  duplicate_payment: "Duplicate payment",
  incorrect_information: "Incorrect information",
  other: "Other",
} as const

export type RejectionCode = keyof typeof REJECTION_REASONS

export function isRejectionCode(value: string): value is RejectionCode {
  return value in REJECTION_REASONS
}

export function publicStatus(status: string): string {
  switch (status) {
    case "success":
      return "approved"
    case "failed":
      return "rejected"
    case "cancelled":
      return "cancelled"
    case "under_review":
      return "under_review"
    case "more_info_required":
      return "more_info_required"
    case "pending_verification":
      return "pending"
    case "bank_transfer_initiated":
      return "awaiting_transfer"
    default:
      return status || "pending"
  }
}

export function donorEmailFromDoc(doc: Record<string, unknown>): string {
  const meta = doc.donationMeta
  if (meta && typeof meta === "object" && meta !== null && "donor" in meta) {
    const donor = (meta as { donor?: unknown }).donor
    if (donor && typeof donor === "object" && donor !== null && "email" in donor) {
      const email = (donor as { email?: unknown }).email
      if (typeof email === "string") return email.trim().toLowerCase()
    }
  }
  if (typeof doc.donorEmail === "string") return doc.donorEmail.trim().toLowerCase()
  return ""
}

export function donorPhoneFromDoc(doc: Record<string, unknown>): string {
  if (typeof doc.senderPhone === "string" && doc.senderPhone.trim()) return doc.senderPhone.trim()
  const meta = doc.donationMeta
  if (meta && typeof meta === "object" && meta !== null && "donor" in meta) {
    const donor = (meta as { donor?: unknown }).donor
    if (donor && typeof donor === "object" && donor !== null && "phone" in donor) {
      const phone = (donor as { phone?: unknown }).phone
      if (typeof phone === "string") return phone.trim()
    }
  }
  return ""
}

export function categoryFromDoc(doc: Record<string, unknown>): string {
  const meta = doc.donationMeta
  if (meta && typeof meta === "object" && meta !== null) {
    const record = meta as Record<string, unknown>
    if (Array.isArray(record.cartLines) && record.cartLines[0] && typeof record.cartLines[0] === "object") {
      const line = record.cartLines[0] as { causeLabel?: unknown; typeLabel?: unknown }
      if (typeof line.causeLabel === "string" && line.causeLabel.trim()) return line.causeLabel.trim()
      if (typeof line.typeLabel === "string" && line.typeLabel.trim()) return line.typeLabel.trim()
    }
    if (typeof record.orderDescription === "string" && record.orderDescription.trim()) {
      return record.orderDescription.trim()
    }
  }
  return "General"
}

function iso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return null
}

export function serializeDonation(doc: Record<string, unknown>, mode: "admin" | "donor") {
  const status = typeof doc.status === "string" ? doc.status : "unknown"
  const rejectionCode = typeof doc.rejectionCode === "string" ? doc.rejectionCode : ""
  const rejectionReason =
    typeof doc.rejectionReason === "string" && doc.rejectionReason.trim()
      ? doc.rejectionReason.trim()
      : rejectionCode && isRejectionCode(rejectionCode)
        ? REJECTION_REASONS[rejectionCode]
        : typeof doc.adminNote === "string"
          ? doc.adminNote
          : ""

  const base = {
    orderRef: typeof doc.orderRef === "string" ? doc.orderRef : "",
    status,
    publicStatus: publicStatus(status),
    amountPkr: typeof doc.amountPkr === "number" ? doc.amountPkr : 0,
    currency: typeof doc.currency === "string" ? doc.currency : "PKR",
    donorName: typeof doc.donorName === "string" ? doc.donorName : "",
    donorEmail: donorEmailFromDoc(doc),
    donorPhone: donorPhoneFromDoc(doc),
    category: categoryFromDoc(doc),
    transactionId: typeof doc.transactionId === "string" ? doc.transactionId : "",
    gateway: typeof doc.gateway === "string" ? doc.gateway : "",
    createdAt: iso(doc.createdAt),
    submittedAt: iso(doc.submittedAt),
    verifiedAt: iso(doc.verifiedAt),
    rejectionReason: status === "failed" ? rejectionReason : "",
  }

  if (mode === "donor") {
    return {
      ...base,
      infoRequest: typeof doc.infoRequest === "string" ? doc.infoRequest : "",
    }
  }

  return {
    ...base,
    donorId: typeof doc.donorId === "string" ? doc.donorId : "",
    senderName: typeof doc.senderName === "string" ? doc.senderName : "",
    senderPhone: typeof doc.senderPhone === "string" ? doc.senderPhone : "",
    notes: typeof doc.notes === "string" ? doc.notes : "",
    adminNote: typeof doc.adminNote === "string" ? doc.adminNote : "",
    rejectionCode,
    infoRequest: typeof doc.infoRequest === "string" ? doc.infoRequest : "",
    approvedBy: typeof doc.approvedBy === "string" ? doc.approvedBy : "",
    rejectedBy: typeof doc.rejectedBy === "string" ? doc.rejectedBy : "",
    updatedAt: iso(doc.updatedAt),
    bankDetails: doc.bankDetails ?? null,
    donationMeta: doc.donationMeta ?? null,
  }
}
