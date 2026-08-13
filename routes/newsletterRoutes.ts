import { Router, type Request, type Response } from "express"
import { getNewsletterCollection } from "../db.js"

const router = Router()

router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email || !email.includes("@")) {
      res.status(400).json({ ok: false, error: "Valid email is required" })
      return
    }

    const col = await getNewsletterCollection()
    const now = new Date()
    await col.updateOne(
      { email },
      {
        $setOnInsert: { email, createdAt: now },
        $set: { updatedAt: now, source: "web-newsletter" },
      },
      { upsert: true },
    )

    res.status(200).json({ ok: true, message: "Subscribed" })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not subscribe" })
  }
})

export const newsletterRouter = router
