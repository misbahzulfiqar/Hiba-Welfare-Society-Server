import type { Document } from "mongodb"
import { getPaymentCollection, isMongoConfigured } from "./db.js"
import {
  memoryPaymentDelete,
  memoryPaymentFind,
  memoryPaymentInsert,
  memoryPaymentListAll,
  memoryPaymentPatch,
} from "./memoryPaymentStore.js"

export async function paymentInsertOne(doc: Document) {
  try {
    if (isMongoConfigured()) {
      const col = await getPaymentCollection()
      await col.insertOne(doc)
      return
    }
  } catch (e) {
    console.warn("[hiba-api] Mongo insert failed, using memory store:", e)
  }
  memoryPaymentInsert(doc)
}

export async function paymentDeleteOneByOrderRef(orderRef: string) {
  try {
    if (isMongoConfigured()) {
      const col = await getPaymentCollection()
      await col.deleteOne({ orderRef })
      return
    }
  } catch (e) {
    console.warn("[hiba-api] Mongo delete failed, using memory store:", e)
  }
  memoryPaymentDelete(orderRef)
}

export async function paymentFindByOrderRef(orderRef: string): Promise<Document | null> {
  try {
    if (isMongoConfigured()) {
      const col = await getPaymentCollection()
      return col.findOne({ orderRef })
    }
  } catch (e) {
    console.warn("[hiba-api] Mongo find failed, using memory store:", e)
  }
  return memoryPaymentFind(orderRef)
}

export async function paymentUpdateByOrderRef(orderRef: string, $set: Record<string, unknown>) {
  try {
    if (isMongoConfigured()) {
      const col = await getPaymentCollection()
      await col.updateOne({ orderRef }, { $set })
      return
    }
  } catch (e) {
    console.warn("[hiba-api] Mongo update failed, using memory store:", e)
  }
  memoryPaymentPatch(orderRef, $set)
}

export async function paymentInsertVerified(doc: Document) {
  await paymentInsertOne(doc)
}

/** Newest first. Optional status filter (exact match). */
export async function paymentList(status?: string, limit = 100): Promise<Document[]> {
  const take = Math.min(Math.max(limit, 1), 500)
  try {
    if (isMongoConfigured()) {
      const col = await getPaymentCollection()
      const filter = status ? { status } : {}
      return col.find(filter).sort({ createdAt: -1 }).limit(take).toArray()
    }
  } catch (e) {
    console.warn("[hiba-api] Mongo list failed, using memory store:", e)
  }
  let rows = memoryPaymentListAll()
  if (status) {
    rows = rows.filter((d) => d.status === status)
  }
  rows.sort((a, b) => {
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
    return tb - ta
  })
  return rows.slice(0, take)
}

export async function paymentListAll(limit = 2000): Promise<Document[]> {
  return paymentList(undefined, limit)
}

export async function paymentListForDonor(opts: {
  donorId?: string
  email?: string
  limit?: number
}): Promise<Document[]> {
  const take = Math.min(Math.max(opts.limit ?? 100, 1), 500)
  const email = opts.email?.trim().toLowerCase() ?? ""
  const donorId = opts.donorId?.trim() ?? ""
  const rows = await paymentList(undefined, 2000)
  return rows
    .filter((d) => {
      const rec = d as Record<string, unknown>
      if (donorId && rec.donorId === donorId) return true
      if (email) {
        const meta = rec.donationMeta
        if (meta && typeof meta === "object" && meta !== null && "donor" in meta) {
          const donor = (meta as { donor?: { email?: unknown } }).donor
          if (typeof donor?.email === "string" && donor.email.trim().toLowerCase() === email) return true
        }
        if (typeof rec.donorEmail === "string" && rec.donorEmail.trim().toLowerCase() === email) return true
      }
      return false
    })
    .slice(0, take)
}
