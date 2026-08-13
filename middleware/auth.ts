import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim()
  if (s) return s
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production")
  }
  return "hiba-welfare-dev-secret-change-me"
}

export function signDonorToken(donorId: string): string {
  const raw = process.env.JWT_EXPIRES_IN?.trim()
  const expiresInSeconds = raw ? Number.parseInt(raw, 10) : 7 * 24 * 60 * 60
  const ttl = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds : 7 * 24 * 60 * 60
  return jwt.sign({ sub: donorId }, getJwtSecret(), { expiresIn: ttl })
}

export function verifyDonorToken(token: string): { donorId: string } {
  const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload
  const sub = decoded.sub
  if (typeof sub !== "string" || !sub) {
    throw new Error("Invalid token payload")
  }
  return { donorId: sub }
}

export const authRequired: RequestHandler = (req, res, next) => {
  try {
    const h = req.headers.authorization
    const raw = typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7).trim() : ""
    if (!raw) {
      res.status(401).json({ ok: false, error: "Missing authorization token" })
      return
    }
    const { donorId } = verifyDonorToken(raw)
    req.donorId = donorId
    next()
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired token" })
  }
}
