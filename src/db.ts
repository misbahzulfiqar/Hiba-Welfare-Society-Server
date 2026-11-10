import { MongoClient, type Collection, type Document } from "mongodb"
import { Resolver } from "node:dns/promises"
import {
  contactCollectionName,
  donorCollectionName,
  newsletterCollectionName,
  paymentCollectionName,
  dbName as dbNameFromEnv,
} from "./collections.js"

const uri = process.env.MONGODB_URI
const dbName = dbNameFromEnv()

let client: MongoClient | null = null
let connecting: Promise<MongoClient> | null = null
let mongoUnavailable = false

/** True when Atlas / Mongo is configured and reachable. */
export function isMongoConfigured(): boolean {
  return Boolean(uri?.trim()) && !mongoUnavailable
}

function parseSrvParts(raw: string): { user: string; pass: string; hostname: string; path: string; search: string } | null {
  if (!raw.startsWith("mongodb+srv://")) return null
  try {
    const parsed = new URL(raw.replace("mongodb+srv://", "https://"))
    return {
      user: decodeURIComponent(parsed.username),
      pass: decodeURIComponent(parsed.password),
      hostname: parsed.hostname,
      path: parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : `/${dbName}`,
      search: parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search,
    }
  } catch {
    return null
  }
}

/** Resolve Atlas SRV/TXT via Google DNS so ISP ESERVFAIL does not block login. */
async function resolveAtlasUri(raw: string): Promise<string | null> {
  const parts = parseSrvParts(raw)
  if (!parts) return null

  const resolver = new Resolver()
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"])

  const srv = await resolver.resolveSrv(`_mongodb._tcp.${parts.hostname}`)
  if (!srv.length) return null

  const hosts = srv
    .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
    .map((r) => `${r.name.replace(/\.$/, "")}:${r.port}`)
    .join(",")

  const txtRecords = await resolver.resolveTxt(parts.hostname).catch(() => [] as string[][])
  const params = new URLSearchParams(parts.search)
  for (const chunk of txtRecords.flat()) {
    for (const pair of chunk.split("&")) {
      const [key, value] = pair.split("=")
      if (key && value && !params.has(key)) params.set(key, value)
    }
  }
  params.set("tls", "true")
  if (!params.has("ssl")) params.set("ssl", "true")
  if (!params.has("authSource")) params.set("authSource", "admin")
  params.delete("retryWrites")

  return `mongodb://${encodeURIComponent(parts.user)}:${encodeURIComponent(parts.pass)}@${hosts}${parts.path}?${params.toString()}`
}

async function connectOnce(connectionUri: string): Promise<MongoClient> {
  return MongoClient.connect(connectionUri, {
    serverSelectionTimeoutMS: 12000,
    family: 4,
  })
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri?.trim()) {
    throw new Error("MONGODB_URI is not set. Add it to src/server/.env")
  }
  if (mongoUnavailable) {
    throw new Error("MongoDB is temporarily unavailable")
  }
  if (client) return client
  if (connecting) return connecting

  connecting = (async () => {
    const errors: string[] = []

    if (uri.startsWith("mongodb+srv://")) {
      try {
        const resolved = await resolveAtlasUri(uri)
        if (resolved) {
          client = await connectOnce(resolved)
          return client
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }

    try {
      client = await connectOnce(uri)
      return client
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
      mongoUnavailable = true
      throw new Error(`MongoDB connection failed: ${errors[0] ?? "unknown error"}`)
    } finally {
      connecting = null
    }
  })()

  return connecting
}

export async function getPaymentCollection(): Promise<Collection<Document>> {
  const c = await getMongoClient()
  return c.db(dbName).collection(paymentCollectionName())
}

export async function getDonorsCollection(): Promise<Collection<Document>> {
  const c = await getMongoClient()
  return c.db(dbName).collection(donorCollectionName())
}

export async function getContactCollection(): Promise<Collection<Document>> {
  const c = await getMongoClient()
  return c.db(dbName).collection(contactCollectionName())
}

export async function getNewsletterCollection(): Promise<Collection<Document>> {
  const c = await getMongoClient()
  return c.db(dbName).collection(newsletterCollectionName())
}
