import "dotenv/config"
import cors from "cors"
import express from "express"
import {
  contactCollectionName,
  dbName,
  donorCollectionName,
  newsletterCollectionName,
  paymentCollectionName,
} from "./collections.js"
import { getMongoClient, getPaymentCollection, isMongoConfigured } from "./db.js"
import { easypaisaRouter } from "./easypaisaRoutes.js"
import { adminPaymentRouter } from "./routes/adminPaymentRoutes.js"
import { authRouter } from "./routes/authRoutes.js"
import { contactRouter } from "./routes/contactRoutes.js"
import { newsletterRouter } from "./routes/newsletterRoutes.js"

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true,
  }),
)
app.use(express.json({ limit: "256kb" }))

app.use("/api/auth", authRouter)
app.use("/api/contact", contactRouter)
app.use("/api/newsletter", newsletterRouter)
app.use("/api/admin", adminPaymentRouter)
app.use("/api", easypaisaRouter)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hiba-welfare-api" })
})

app.get("/api/health/db", async (_req, res) => {
  try {
    const col = await getPaymentCollection()
    await col.estimatedDocumentCount()
    res.json({
      ok: true,
      database: dbName(),
      collections: {
        payment: paymentCollectionName(),
        donors: donorCollectionName(),
        contact: contactCollectionName(),
        newsletter: newsletterCollectionName(),
      },
    })
  } catch (e) {
    console.error(e)
    res.status(503).json({
      ok: false,
      error: e instanceof Error ? e.message : "Database unavailable",
    })
  }
})

app.post("/api/payments", async (req, res) => {
  try {
    const body = req.body
    if (!body || typeof body !== "object") {
      res.status(400).json({ ok: false, error: "Expected JSON body" })
      return
    }

    const record = {
      status: typeof body.status === "string" ? body.status : "submitted",
      merchantName: body.merchantName,
      order: body.order,
      orderDescription: body.orderDescription,
      donationAmount: body.donationAmount,
      bankCharges: body.bankCharges,
      totalPayable: body.totalPayable,
      gateway: body.gateway,
      donationFrequency: body.donationFrequency,
      donor: body.donor ?? null,
      cartLines: body.cartLines ?? null,
      cardLast4: typeof body.cardLast4 === "string" ? body.cardLast4 : undefined,
      remarks: typeof body.remarks === "string" ? body.remarks : undefined,
      clientMeta: {
        source: "web-checkout",
        submittedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    }

    if (typeof record.totalPayable !== "number") {
      res.status(400).json({ ok: false, error: "totalPayable is required" })
      return
    }

    const col = await getPaymentCollection()
    const result = await col.insertOne(record)

    res.status(201).json({
      ok: true,
      id: result.insertedId.toString(),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save payment",
    })
  }
})

async function ensureIndexes() {
  if (!isMongoConfigured()) return
  try {
    const client = await getMongoClient()
    const d = client.db(dbName())
    await d.collection(donorCollectionName()).createIndex({ email: 1 }, { unique: true })
    await d.collection(newsletterCollectionName()).createIndex({ email: 1 }, { unique: true })
    await d.collection(contactCollectionName()).createIndex({ createdAt: -1 })
  } catch (e) {
    console.warn("[hiba-api] ensureIndexes:", e)
  }
}

app.listen(PORT, () => {
  console.log(`Hiba API listening on http://localhost:${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  void ensureIndexes()
})
