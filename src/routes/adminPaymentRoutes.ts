import { Router, type Request, type Response } from "express"
import { adminRequired, signAdminToken, verifyAdminPassword } from "../adminAuth.js"
import { getDonorsCollection, isMongoConfigured } from "../db.js"
import {
  isRejectionCode,
  REJECTION_REASONS,
  serializeDonation,
} from "../donationSerialize.js"
import { paymentFindByOrderRef, paymentList, paymentListAll, paymentUpdateByOrderRef } from "../paymentPersistence.js"
import { UploadError, saveInitiativeImage } from "../imageUploads.js"
import { saveAdminAboutPages } from "./aboutPagesRoutes.js"
import { saveAdminHomepage } from "./homepageRoutes.js"
import { saveAdminSiteContent } from "./siteContentRoutes.js"
import { saveAdminQuotes } from "./quoteRoutes.js"

const auditLog: Array<Record<string, unknown>> = []

function recordAudit(entry: Record<string, unknown>) {
  auditLog.unshift({ ...entry, at: new Date().toISOString() })
  if (auditLog.length > 400) auditLog.pop()
}

function matchesSearch(doc: Record<string, unknown>, q: string): boolean {
  if (!q) return true
  const serialized = serializeDonation(doc, "admin") as Record<string, unknown>
  const blob = [
    serialized.orderRef,
    serialized.donorName,
    serialized.donorEmail,
    serialized.donorPhone,
    serialized.transactionId,
    serialized.category,
    serialized.status,
  ]
    .join(" ")
    .toLowerCase()
  return blob.includes(q)
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfYear() {
  const d = new Date()
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function createdAt(doc: Record<string, unknown>): Date | null {
  if (doc.createdAt instanceof Date) return doc.createdAt
  if (typeof doc.createdAt === "string") {
    const parsed = new Date(doc.createdAt)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export const adminPaymentRouter = Router()

adminPaymentRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const email = typeof body.email === "string" ? body.email : ""
    const password = typeof body.password === "string" ? body.password : ""
    const ok = await verifyAdminPassword(email, password)
    if (!ok) {
      res.status(401).json({ ok: false, error: "Invalid email or password" })
      return
    }
    const token = signAdminToken(email.trim().toLowerCase())
    res.json({
      ok: true,
      token,
      admin: { email: email.trim().toLowerCase(), name: "Fayyaz" },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Login failed" })
  }
})

adminPaymentRouter.use(adminRequired)

adminPaymentRouter.put("/quotes", (req, res) => {
  void saveAdminQuotes(req, res)
})

adminPaymentRouter.put("/homepage", (req, res) => {
  void saveAdminHomepage(req, res)
})

adminPaymentRouter.put("/site-content", (req, res) => {
  void saveAdminSiteContent(req, res)
})

adminPaymentRouter.put("/about-pages", (req, res) => {
  void saveAdminAboutPages(req, res)
})

adminPaymentRouter.post("/uploads", async (req, res) => {
  try {
    const card = typeof req.query.card === "string" ? req.query.card : ""
    const chunks: Buffer[] = []
    let size = 0
    const bytes = await new Promise<Buffer>((resolve, reject) => {
      req.on("data", (chunk: Buffer | string) => {
        const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        size += piece.length
        if (size > 5 * 1024 * 1024) {
          reject(new UploadError(413, "Image must be under 5 MB"))
          req.destroy()
          return
        }
        chunks.push(piece)
      })
      req.on("end", () => resolve(Buffer.concat(chunks)))
      req.on("error", reject)
    })
    const image = await saveInitiativeImage(card, bytes)
    res.json({ ok: true, image })
  } catch (error) {
    if (error instanceof UploadError) {
      res.status(error.status).json({ ok: false, error: error.message })
      return
    }
    res.status(400).json({ ok: false, error: "Could not upload image" })
  }
})

adminPaymentRouter.get("/rejection-reasons", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    reasons: Object.entries(REJECTION_REASONS).map(([code, label]) => ({ code, label })),
  })
})

adminPaymentRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const rows = (await paymentListAll(5000)) as Record<string, unknown>[]
    const today = startOfToday()
    const month = startOfMonth()
    const year = startOfYear()

    const sum = (predicate: (d: Record<string, unknown>) => boolean) =>
      rows.filter(predicate).reduce((acc, d) => acc + (typeof d.amountPkr === "number" ? d.amountPkr : 0), 0)

    const count = (predicate: (d: Record<string, unknown>) => boolean) => rows.filter(predicate).length

    const isApproved = (d: Record<string, unknown>) => d.status === "success"
    const isPending = (d: Record<string, unknown>) =>
      d.status === "pending_verification" ||
      d.status === "under_review" ||
      d.status === "bank_transfer_initiated" ||
      d.status === "more_info_required"
    const isRejected = (d: Record<string, unknown>) => d.status === "failed"

    const byCategory: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    for (const row of rows) {
      if (row.status !== "success") continue
      const amount = typeof row.amountPkr === "number" ? row.amountPkr : 0
      const cat = serializeDonation(row, "admin").category
      byCategory[cat] = (byCategory[cat] ?? 0) + amount
      const when = createdAt(row)
      if (when) {
        const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`
        byMonth[key] = (byMonth[key] ?? 0) + amount
      }
    }

    const emails = new Set(
      rows
        .map((d) => serializeDonation(d, "admin").donorEmail)
        .filter((email) => Boolean(email)),
    )

    res.json({
      ok: true,
      stats: {
        totalCount: rows.length,
        totalAmount: sum(() => true),
        pendingCount: count(isPending),
        pendingAmount: sum(isPending),
        approvedCount: count(isApproved),
        approvedAmount: sum(isApproved),
        rejectedCount: count(isRejected),
        rejectedAmount: sum(isRejected),
        todayAmount: sum((d) => {
          const when = createdAt(d)
          return Boolean(when && when >= today)
        }),
        monthAmount: sum((d) => {
          const when = createdAt(d)
          return Boolean(when && when >= month)
        }),
        yearAmount: sum((d) => {
          const when = createdAt(d)
          return Boolean(when && when >= year)
        }),
        donorCount: emails.size,
        byCategory,
        byMonth,
        recent: rows.slice(0, 8).map((d) => serializeDonation(d, "admin")),
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not load stats" })
  }
})

adminPaymentRouter.get("/payments", async (req: Request, res: Response) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status.trim() : ""
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : ""
    const limit = Number(req.query.limit) || 200
    const status = statusRaw && statusRaw !== "all" ? statusRaw : undefined
    const rows = ((await paymentList(status, limit)) as Record<string, unknown>[]).filter((d) => matchesSearch(d, q))
    res.json({
      ok: true,
      payments: rows.map((d) => serializeDonation(d, "admin")),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not list payments",
    })
  }
})

adminPaymentRouter.get("/payments/:orderRef", async (req: Request, res: Response) => {
  try {
    const orderRef = String(req.params.orderRef || "").trim()
    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation not found" })
      return
    }
    res.json({ ok: true, payment: serializeDonation(existing as Record<string, unknown>, "admin") })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not load donation" })
  }
})

adminPaymentRouter.post("/payments/:orderRef/review", async (req: Request, res: Response) => {
  try {
    const orderRef = String(req.params.orderRef || "").trim()
    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation not found" })
      return
    }
    await paymentUpdateByOrderRef(orderRef, {
      status: "under_review",
      updatedAt: new Date(),
    })
    recordAudit({ action: "under_review", orderRef })
    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      payment: updated ? serializeDonation(updated as Record<string, unknown>, "admin") : null,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not update donation" })
  }
})

adminPaymentRouter.post("/payments/:orderRef/request-info", async (req: Request, res: Response) => {
  try {
    const orderRef = String(req.params.orderRef || "").trim()
    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation not found" })
      return
    }
    const message =
      typeof req.body?.message === "string" && req.body.message.trim()
        ? req.body.message.trim()
        : "Please provide additional payment information."
    await paymentUpdateByOrderRef(orderRef, {
      status: "more_info_required",
      infoRequest: message,
      updatedAt: new Date(),
    })
    recordAudit({ action: "request_info", orderRef, message })
    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      payment: updated ? serializeDonation(updated as Record<string, unknown>, "admin") : null,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not request information" })
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
        : "Bank transaction verified successfully."
    const approvedBy =
      typeof req.body?.adminName === "string" && req.body.adminName.trim()
        ? req.body.adminName.trim()
        : "Admin"

    await paymentUpdateByOrderRef(orderRef, {
      status: "success",
      adminNote: note,
      approvedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    recordAudit({ action: "approve", orderRef, approvedBy, note })

    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      message: "Payment marked as received",
      payment: updated ? serializeDonation(updated as Record<string, unknown>, "admin") : null,
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

    const codeRaw = typeof req.body?.reasonCode === "string" ? req.body.reasonCode.trim() : "other"
    const reasonCode = isRejectionCode(codeRaw) ? codeRaw : "other"
    const extraNote = typeof req.body?.adminNote === "string" ? req.body.adminNote.trim() : ""
    const reasonLabel = REJECTION_REASONS[reasonCode]
    const note = extraNote ? `${reasonLabel}. ${extraNote}` : reasonLabel
    const rejectedBy =
      typeof req.body?.adminName === "string" && req.body.adminName.trim()
        ? req.body.adminName.trim()
        : "Admin"

    await paymentUpdateByOrderRef(orderRef, {
      status: "failed",
      rejectionCode: reasonCode,
      rejectionReason: note,
      adminNote: note,
      rejectedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    recordAudit({ action: "reject", orderRef, rejectedBy, reasonCode, note })

    const updated = await paymentFindByOrderRef(orderRef)
    res.json({
      ok: true,
      message: "Payment rejected",
      payment: updated ? serializeDonation(updated as Record<string, unknown>, "admin") : null,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not reject payment",
    })
  }
})

adminPaymentRouter.get("/donors", async (_req: Request, res: Response) => {
  try {
    const payments = (await paymentListAll(5000)) as Record<string, unknown>[]
    const byEmail = new Map<
      string,
      {
        email: string
        name: string
        phone: string
        totalCount: number
        totalAmount: number
        approvedAmount: number
        pendingCount: number
        rejectedCount: number
        lastDonation: string | null
      }
    >()

    for (const row of payments) {
      const s = serializeDonation(row, "admin")
      const email = s.donorEmail || `guest:${s.orderRef}`
      const prev = byEmail.get(email) ?? {
        email: s.donorEmail,
        name: s.donorName,
        phone: s.donorPhone,
        totalCount: 0,
        totalAmount: 0,
        approvedAmount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        lastDonation: s.createdAt,
      }
      prev.totalCount += 1
      prev.totalAmount += s.amountPkr
      if (s.status === "success") prev.approvedAmount += s.amountPkr
      if (s.publicStatus === "pending" || s.publicStatus === "under_review" || s.publicStatus === "awaiting_transfer") {
        prev.pendingCount += 1
      }
      if (s.status === "failed") prev.rejectedCount += 1
      if (!prev.name && s.donorName) prev.name = s.donorName
      if (!prev.phone && s.donorPhone) prev.phone = s.donorPhone
      if (s.createdAt && (!prev.lastDonation || s.createdAt > prev.lastDonation)) prev.lastDonation = s.createdAt
      byEmail.set(email, prev)
    }

    if (isMongoConfigured()) {
      const col = await getDonorsCollection()
      const registered = await col.find({}, { projection: { passwordHash: 0 } }).toArray()
      for (const d of registered) {
        const email = typeof d.email === "string" ? d.email.trim().toLowerCase() : ""
        if (!email) continue
        if (!byEmail.has(email)) {
          byEmail.set(email, {
            email,
            name: typeof d.name === "string" ? d.name : "",
            phone: typeof d.phone === "string" ? d.phone : "",
            totalCount: 0,
            totalAmount: 0,
            approvedAmount: 0,
            pendingCount: 0,
            rejectedCount: 0,
            lastDonation: null,
          })
        }
      }
    }

    res.json({ ok: true, donors: Array.from(byEmail.values()) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not list donors" })
  }
})

adminPaymentRouter.get("/donors/:email", async (req: Request, res: Response) => {
  try {
    const email = decodeURIComponent(String(req.params.email || "")).trim().toLowerCase()
    const payments = ((await paymentListAll(2000)) as Record<string, unknown>[])
      .map((d) => serializeDonation(d, "admin"))
      .filter((d) => d.donorEmail === email)
    res.json({
      ok: true,
      email,
      donations: payments,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not load donor" })
  }
})

adminPaymentRouter.get("/audit", (_req: Request, res: Response) => {
  res.json({ ok: true, events: auditLog.slice(0, 100) })
})
