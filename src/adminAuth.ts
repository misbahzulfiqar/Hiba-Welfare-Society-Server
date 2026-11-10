import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import type { RequestHandler } from "express"

const DEFAULT_ADMIN_EMAIL = "fayyaz@gmail.com"
const DEFAULT_ADMIN_PASSWORD = "admin"

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim()
  if (s) return s
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production")
  }
  return "hiba-welfare-dev-secret-change-me"
}

function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase()
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD
}

function getAdminSecret(): string {
  const fromEnv = process.env.ADMIN_SECRET?.trim()
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV !== "production") return "hiba-admin-dev"
  return ""
}

export function signAdminToken(email: string): string {
  return jwt.sign({ sub: email, role: "admin" }, getJwtSecret(), { expiresIn: 7 * 24 * 60 * 60 })
}

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const expectedEmail = getAdminEmail()
  const givenEmail = email.trim().toLowerCase()
  if (!givenEmail || givenEmail !== expectedEmail) return false

  const stored = getAdminPassword()
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored)
  }
  return password === stored
}

export const adminRequired: RequestHandler = (req, res, next) => {
  try {
    const header = req.headers["x-admin-secret"]
    const secretHeader = typeof header === "string" ? header.trim() : ""
    const auth = req.headers.authorization
    const bearer = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
    const token = bearer || secretHeader

    if (!token) {
      res.status(401).json({ ok: false, error: "Missing admin credentials" })
      return
    }

    const legacy = getAdminSecret()
    if (legacy && token === legacy) {
      next()
      return
    }

    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload
    if (decoded.role !== "admin" || typeof decoded.sub !== "string") {
      res.status(401).json({ ok: false, error: "Invalid admin session" })
      return
    }
    next()
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired admin session" })
  }
}
