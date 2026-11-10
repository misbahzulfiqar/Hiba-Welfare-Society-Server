import "dotenv/config"
import path from "node:path"
import cors from "cors"
import express from "express"
import { uploadDir } from "./imageUploads.js"
import {
  contactCollectionName,
  dbName,
  donorCollectionName,
  newsletterCollectionName,
  paymentCollectionName,
} from "./collections.js"
import { getMongoClient, getPaymentCollection } from "./db.js"
import { easypaisaRouter } from "./easypaisaRoutes.js"
import { adminPaymentRouter } from "./routes/adminPaymentRoutes.js"
import { authRouter } from "./routes/authRoutes.js"
import { contactRouter } from "./routes/contactRoutes.js"
import { newsletterRouter } from "./routes/newsletterRoutes.js"
import { publicAboutPagesRouter } from "./routes/aboutPagesRoutes.js"
import { publicHomepageRouter } from "./routes/homepageRoutes.js"
import { publicSiteContentRouter } from "./routes/siteContentRoutes.js"
import { publicQuotesRouter } from "./routes/quoteRoutes.js"

const app = express()

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://hiba-welfare-society-web-42eg.vercel.app",
  "https://hiba-welfare-society-web.vercel.app",
]

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const frontend = process.env.FRONTEND_URL?.trim()
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv, ...(frontend ? [frontend] : [])])]
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true
  if (allowedOrigins().includes(origin)) return true
  try {
    const { hostname } = new URL(origin)
    return hostname.endsWith(".vercel.app") && hostname.includes("hiba-welfare-society")
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, origin ?? true)
        return
      }
      callback(null, false)
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
    optionsSuccessStatus: 204,
  }),
)
app.options("*", cors())
app.use(express.json({ limit: "256kb" }))
app.use(
  "/api/uploads",
  express.static(path.resolve(uploadDir), {
    fallthrough: false,
    index: false,
    dotfiles: "deny",
  }),
)

app.use("/api/auth", authRouter)
app.use("/api/contact", contactRouter)
app.use("/api/newsletter", newsletterRouter)
app.use("/api/quotes", publicQuotesRouter)
app.use("/api/homepage", publicHomepageRouter)
app.use("/api/about-pages", publicAboutPagesRouter)
app.use("/api/site-content", publicSiteContentRouter)
app.use("/api/admin", adminPaymentRouter)
app.use("/api", easypaisaRouter)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hiba-welfare-api" })
})

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "hiba-welfare-api", health: "/api/health" })
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

export async function ensureIndexes() {
  if (!process.env.MONGODB_URI?.trim()) return
  try {
    const client = await getMongoClient()
    const d = client.db(dbName())
    await d.collection(donorCollectionName()).createIndex({ email: 1 }, { unique: true })
    await d.collection(newsletterCollectionName()).createIndex({ email: 1 }, { unique: true })
    await d.collection(contactCollectionName()).createIndex({ createdAt: -1 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[hiba-api] MongoDB not reachable (${msg.split("\n")[0]}). Donations will use memory until DNS/Atlas is available.`)
  }
}

export default app
