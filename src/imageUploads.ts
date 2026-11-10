import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const UPLOAD_CARD_IDS = [
  "fitra",
  "ramzan",
  "medical",
  "education",
  "quick-left",
  "quick-right",
  "doing-medical",
  "doing-welfare",
  "doing-education",
  "doing-ramzan",
  "doing-food",
  "doing-water",
  "chairman-portrait",
  "pcp-certificate",
] as const

const MAX_BYTES = 5 * 1024 * 1024

export const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/uploads")

export class UploadError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function imageKind(bytes: Buffer): "jpg" | "png" | "gif" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg"
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png"
  }
  const gif = bytes.length >= 6 ? bytes.subarray(0, 6).toString("ascii") : ""
  if (gif === "GIF87a" || gif === "GIF89a") return "gif"
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp"
  }
  return null
}

export async function saveInitiativeImage(cardId: string, bytes: Buffer): Promise<string> {
  if (!UPLOAD_CARD_IDS.includes(cardId as (typeof UPLOAD_CARD_IDS)[number])) {
    throw new UploadError(400, "Unknown card")
  }
  if (bytes.length === 0) throw new UploadError(400, "Choose an image from your computer")
  if (bytes.length > MAX_BYTES) throw new UploadError(413, "Image must be under 5 MB")
  const kind = imageKind(bytes)
  if (!kind) throw new UploadError(400, "Choose a JPEG, PNG, WEBP, or GIF image")
  const filename = `${cardId}-${Date.now()}.${kind}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), bytes)
  return `/api/uploads/${filename}`
}
