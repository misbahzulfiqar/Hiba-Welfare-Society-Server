import { Binary } from "mongodb"
import { dbName } from "./collections.js"
import { getMongoClient, isMongoConfigured } from "./db.js"

const settingsCollection = "site_settings"
const uploadsCollection = "uploads"

export async function readStoredDocument(key: string): Promise<unknown | null> {
  if (!isMongoConfigured()) return null
  const client = await getMongoClient()
  const doc = await client.db(dbName()).collection(settingsCollection).findOne({ key })
  if (!doc || !("value" in doc)) return null
  return doc.value
}

export async function writeStoredDocument(key: string, value: unknown): Promise<void> {
  const client = await getMongoClient()
  await client.db(dbName()).collection(settingsCollection).updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date() } },
    { upsert: true },
  )
}

function asBuffer(data: unknown): Buffer | null {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Binary) return Buffer.from(data.buffer)
  if (data instanceof Uint8Array) return Buffer.from(data)
  return null
}

export async function readStoredUpload(filename: string): Promise<{ contentType: string; data: Buffer } | null> {
  if (!isMongoConfigured()) return null
  if (!/^[\w.-]+$/.test(filename)) return null
  const client = await getMongoClient()
  const doc = await client.db(dbName()).collection(uploadsCollection).findOne({ filename })
  if (!doc) return null
  const data = asBuffer(doc.data)
  const contentType = typeof doc.contentType === "string" ? doc.contentType : ""
  if (!data || !contentType) return null
  return { contentType, data }
}

export async function writeStoredUpload(filename: string, contentType: string, data: Buffer): Promise<void> {
  const client = await getMongoClient()
  await client.db(dbName()).collection(uploadsCollection).updateOne(
    { filename },
    { $set: { filename, contentType, data, updatedAt: new Date() } },
    { upsert: true },
  )
}
