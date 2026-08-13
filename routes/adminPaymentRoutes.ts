import { Router, type Request, type Response, type RequestHandler } from "express"
import { paymentFindByOrderRef, paymentList, paymentUpdateByOrderRef } from "../paymentPersistence.js"

function getAdminSecret(): string {
  const fromEnv = process.env.ADMIN_SECRET?.trim()
  if (fromEnv) return fromEnv
  // Dev fallback so local admin works without extra env
  if (process.env.NODE_ENV !== "production") return "hiba-admin-dev"
  return ""
}

const adminRequired: RequestHandler = (req, res, next) => {
  const expected = getAdminSecret()
  if (!expected) {
    res.status(503).json({ ok: false, error: "ADMIN_SECRET is not configured on the server" })
    return
  }
  const header = req.headers["x-admin-secret"]
  const token = typeof header === "string" ? header.trim() : ""
  if (!token || token !== expected) {
    res.status(401).json({ ok: false, error: "Invalid admin secret" })
    return
  }
  next()
}

function serializePayment(doc: Record<string, unknown>) {
  const createdAt = doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt
  const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt
  const submittedAt = doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt
  const verifiedAt = doc.verifiedAt instanceof Date ? doc.verifiedAt.toISOString() : doc.verifiedAt

  return {
    orderRef: typeof doc.orderRef === "string" ? doc.orderRef : "",
    status: typeof doc.status === "string" ? doc.status : "unknown",
    amountPkr: typeof doc.amountPkr === "number" ? doc.amountPkr : 0,
    currency: typeof doc.currency === "string" ? doc.currency : "PKR",
    donorName: typeof doc.donorName === "string" ? doc.donorName : "",
    transactionId: typeof doc.transactionId === "string" ? doc.transactionId : "",
    senderName: typeof doc.senderName === "string" ? doc.senderName : "",
    senderPhone: typeof doc.senderPhone === "string" ? doc.senderPhone : "",
    notes: typeof doc.notes === "string" ? doc.notes : "",
    gateway: typeof doc.gateway === "string" ? doc.gateway : "",
    adminNote: typeof doc.adminNote === "string" ? doc.adminNote : "",
    createdAt: createdAt ?? null,
    updatedAt: updatedAt ?? null,
    submittedAt: submittedAt ?? null,
    verifiedAt: verifiedAt ?? null,
  }
}

export const adminPaymentRouter = Router()

adminPaymentRouter.use(adminRequired)

adminPaymentRouter.get("/payments", async (req: Request, res: Response) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status.trim() : ""
    const status = statusRaw && statusRaw !== "all" ? statusRaw : undefined
    const limit = Number(req.query.limit) || 100
    const rows = await paymentList(status, limit)
    res.json({
      ok: true,
      payments: rows.map((d) => serializePayment(d as Record<string, unknown>)),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not list payments",
    })
  }
})

adminPaymentRouter.post("/payments/:orderRef/approve", async (req: Request, res: Response) => {
  try {
    const orderRef = String(req.params.orderRef || "").trim()
    if (!orderRef) {
      res.status(400).json({ ok: false, error: "orderRef is required" })
      return
    }

    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation not found" })
      return
    }

    const note =
      typeof req.body?.adminNote === "string" && req.body.adminNote.trim()
        ? req.body.adminNote.trim()
        : "Verified with bank statement"

    await paymentUpdateByOrderRef(orderRef, {
      status: "success",
      adminNote: note,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })

    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      message: "Payment marked as received",
      payment: updated ? serializePayment(updated as Record<string, unknown>) : null,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not approve payment",
    })
  }
})

adminPaymentRouter.post("/payments/:orderRef/reject", async (req: Request, res: Response) => {
  try {
    const orderRef = String(req.params.orderRef || "").trim()
    if (!orderRef) {
      res.status(400).json({ ok: false, error: "orderRef is required" })
      return
    }

    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation not found" })
      return
    }

    const note =
      typeof req.body?.adminNote === "string" && req.body.adminNote.trim()
        ? req.body.adminNote.trim()
        : "Transfer could not be verified on bank statement"

    await paymentUpdateByOrderRef(orderRef, {
      status: "failed",
      adminNote: note,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })

    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      message: "Payment rejected",
      payment: updated ? serializePayment(updated as Record<string, unknown>) : null,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reject payment",
    })
  }
})
