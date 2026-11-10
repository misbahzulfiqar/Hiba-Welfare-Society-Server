import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type StoredQuote = {
  id: string
  text: string
  detail: string
}

const DEFAULT_QUOTES: StoredQuote[] = [
  {
    id: "default-bukhari",
    text: "The best of people are those who bring the most benefit to others.",
    detail: "Sahih Bukhari",
  },
]

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data")
const dataFile = path.join(dataDir, "quotes.json")

function normalizeQuotes(value: unknown): StoredQuote[] {
  if (!Array.isArray(value)) return []
  const quotes: StoredQuote[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const text = typeof row.text === "string" ? row.text.trim() : ""
    const detail = typeof row.detail === "string" ? row.detail.trim() : ""
    if (!text) continue
    const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : crypto.randomUUID()
    quotes.push({
      id,
      text: text.slice(0, 500),
      detail: detail.slice(0, 180),
    })
    if (quotes.length >= 20) break
  }
  return quotes
}

export async function readQuotes(): Promise<StoredQuote[]> {
  try {
    const raw = await readFile(dataFile, "utf8")
    const parsed = JSON.parse(raw) as unknown
    const quotes = normalizeQuotes(parsed)
    return quotes.length > 0 ? quotes : DEFAULT_QUOTES
  } catch {
    return DEFAULT_QUOTES
  }
}

export async function writeQuotes(value: unknown): Promise<StoredQuote[]> {
  const quotes = normalizeQuotes(value)
  const next = quotes.length > 0 ? quotes : DEFAULT_QUOTES
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8")
  return next
}
