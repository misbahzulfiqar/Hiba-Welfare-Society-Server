import type { Document } from "mongodb"

/** In-process fallback when MONGODB_URI is not set (dev only; lost on restart). */
const byOrderRef = new Map<string, Document>()
let warned = false

function warnOnce() {
  if (warned) return
  warned = true
  console.warn(
    "[hiba-api] MONGODB_URI is not set — Easypaisa pending donations use in-memory storage only (not persisted). Set MONGODB_URI for MongoDB.",
  )
}

export function memoryPaymentInsert(doc: Document) {
  warnOnce()
  const ref = doc.orderRef
  if (typeof ref !== "string" || !ref) {
    throw new Error("memoryPaymentInsert requires orderRef")
  }
  byOrderRef.set(ref, { ...doc })
}

export function memoryPaymentDelete(orderRef: string) {
  byOrderRef.delete(orderRef)
}

export function memoryPaymentFind(orderRef: string): Document | null {
  return byOrderRef.get(orderRef) ?? null
}

export function memoryPaymentPatch(orderRef: string, patch: Record<string, unknown>) {
  const prev = byOrderRef.get(orderRef)
  if (!prev) return
  byOrderRef.set(orderRef, { ...prev, ...patch })
}

export function memoryPaymentListAll(): Document[] {
  warnOnce()
  return Array.from(byOrderRef.values()).map((doc) => ({ ...doc }))
}
