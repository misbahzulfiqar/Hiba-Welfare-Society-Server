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
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    await col.insertOne(doc)
  } else {
    memoryPaymentInsert(doc)
  }
}

export async function paymentDeleteOneByOrderRef(orderRef: string) {
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    await col.deleteOne({ orderRef })
  } else {
    memoryPaymentDelete(orderRef)
  }
}

export async function paymentFindByOrderRef(orderRef: string): Promise<Document | null> {
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    return col.findOne({ orderRef })
  }
  return memoryPaymentFind(orderRef)
}

export async function paymentUpdateByOrderRef(orderRef: string, $set: Record<string, unknown>) {
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    await col.updateOne({ orderRef }, { $set })
  } else {
    memoryPaymentPatch(orderRef, $set)
  }
}

export async function paymentInsertVerified(doc: Document) {
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    await col.insertOne(doc)
  } else {
    memoryPaymentInsert(doc)
  }
}

/** Newest first. Optional status filter (exact match). */
export async function paymentList(status?: string, limit = 100): Promise<Document[]> {
  const take = Math.min(Math.max(limit, 1), 500)
  if (isMongoConfigured()) {
    const col = await getPaymentCollection()
    const filter = status ? { status } : {}
    return col.find(filter).sort({ createdAt: -1 }).limit(take).toArray()
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
