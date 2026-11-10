import bcrypt from "bcrypt"
import { Router, type Request, type Response } from "express"
import { ObjectId } from "mongodb"
import { getDonorsCollection } from "../db.js"
import { serializeDonation } from "../donationSerialize.js"
import { paymentListForDonor } from "../paymentPersistence.js"
import { authRequired, signDonorToken } from "../middleware/auth.js"

const router = Router()
const SALT_ROUNDS = 10

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

type DonorDoc = {
  _id: ObjectId
  email: string
  name: string
  verified?: boolean
  country?: string
  phone?: string
}

function donorResponse(doc: DonorDoc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    verified: doc.verified !== false,
    country: typeof doc.country === "string" ? doc.country : undefined,
    phone: typeof doc.phone === "string" ? doc.phone : undefined,
  }
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : ""
    const password = typeof body.password === "string" ? body.password : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const country = typeof body.country === "string" ? body.country.trim() : undefined
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined

    if (!email || !password || !name) {
      res.status(400).json({ ok: false, error: "name, email, and password are required" })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ ok: false, error: "Password must be at least 6 characters" })
      return
    }

    const col = await getDonorsCollection()
    const existing = await col.findOne({ email })
    if (existing) {
      res.status(409).json({ ok: false, error: "An account with this email already exists" })
      return
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const now = new Date()
    const insert = await col.insertOne({
      email,
      passwordHash,
      name,
      country: country || undefined,
      phone: phone || undefined,
      verified: true,
      createdAt: now,
      updatedAt: now,
    })

    const doc = await col.findOne({ _id: insert.insertedId })
    if (!doc) {
      res.status(500).json({ ok: false, error: "Could not create account" })
      return
    }

    const token = signDonorToken(insert.insertedId.toString())
    res.status(201).json({
      ok: true,
      token,
      donor: donorResponse(doc as DonorDoc),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Registration failed" })
  }
})

router.post("/login", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      res.status(400).json({ ok: false, error: "email and password are required" })
      return
    }

    const col = await getDonorsCollection()
    const doc = await col.findOne({ email })
    if (!doc || typeof doc.passwordHash !== "string") {
      res.status(401).json({ ok: false, error: "Invalid email or password" })
      return
    }

    const ok = await bcrypt.compare(password, doc.passwordHash)
    if (!ok) {
      res.status(401).json({ ok: false, error: "Invalid email or password" })
      return
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: { lastLoginAt: new Date(), updatedAt: new Date() },
        $inc: { loginCount: 1 },
      },
    )
    const updated = await col.findOne({ _id: doc._id })
    if (!updated) {
      res.status(404).json({ ok: false, error: "Account not found" })
      return
    }

    const token = signDonorToken(updated._id.toString())
    res.json({
      ok: true,
      token,
      donor: donorResponse(updated as DonorDoc),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Login failed" })
  }
})

router.get("/me", authRequired, async (req: Request, res: Response) => {
  try {
    const id = req.donorId
    if (!id || !ObjectId.isValid(id)) {
      res.status(401).json({ ok: false, error: "Invalid session" })
      return
    }

    const col = await getDonorsCollection()
    const doc = await col.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } })
    if (!doc) {
      res.status(404).json({ ok: false, error: "Account not found" })
      return
    }

    res.json({
      ok: true,
      donor: donorResponse(doc as DonorDoc),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Failed to load profile" })
  }
})

router.patch("/me", authRequired, async (req: Request, res: Response) => {
  try {
    const id = req.donorId
    if (!id || !ObjectId.isValid(id)) {
      res.status(401).json({ ok: false, error: "Invalid session" })
      return
    }

    const body = req.body as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }
    let n = 0
    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim()
      n++
    }
    if (typeof body.country === "string") {
      patch.country = body.country.trim() || undefined
      n++
    }
    if (typeof body.phone === "string") {
      patch.phone = body.phone.trim() || undefined
      n++
    }

    if (n === 0) {
      res.status(400).json({ ok: false, error: "Provide name, country, or phone to update" })
      return
    }

    const col = await getDonorsCollection()
    const oid = new ObjectId(id)
    const up = await col.updateOne({ _id: oid }, { $set: patch })
    if (up.matchedCount === 0) {
      res.status(404).json({ ok: false, error: "Account not found" })
      return
    }

    const doc = await col.findOne({ _id: oid }, { projection: { passwordHash: 0 } })
    if (!doc) {
      res.status(404).json({ ok: false, error: "Account not found" })
      return
    }

    res.json({
      ok: true,
      donor: donorResponse(doc as DonorDoc),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Update failed" })
  }
})

router.get("/donations", authRequired, async (req: Request, res: Response) => {
  try {
    const id = req.donorId
    if (!id || !ObjectId.isValid(id)) {
      res.status(401).json({ ok: false, error: "Invalid session" })
      return
    }

    const col = await getDonorsCollection()
    const doc = await col.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } })
    if (!doc) {
      res.status(404).json({ ok: false, error: "Account not found" })
      return
    }

    const email = typeof doc.email === "string" ? doc.email.trim().toLowerCase() : ""
    const rows = await paymentListForDonor({ donorId: id, email })
    res.json({
      ok: true,
      donations: rows.map((d) => serializeDonation(d as Record<string, unknown>, "donor")),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Failed to load donations" })
  }
})

export const authRouter = router
