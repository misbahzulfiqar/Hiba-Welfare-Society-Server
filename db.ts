import { MongoClient, type Collection, type Document } from "mongodb"
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

/** True when Atlas / Mongo is configured (required for persisted donations and /api/health/db). */
export function isMongoConfigured(): boolean {
  return Boolean(uri?.trim())
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri?.trim()) {
    throw new Error("MONGODB_URI is not set. Add it to src/server/.env")
  }
  if (client) return client
  if (!connecting) {
    connecting = MongoClient.connect(uri)
  }
  client = await connecting
  connecting = null
  return client
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
