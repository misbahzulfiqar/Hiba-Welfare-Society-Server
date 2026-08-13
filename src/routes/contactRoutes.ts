import { Router, type Request, type Response } from "express"
import { getContactCollection } from "../db.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""

    if (!name || !email || !subject || !message) {
      res.status(400).json({ ok: false, error: "name, email, subject, and message are required" })
      return
    }

    const col = await getContactCollection()
    const result = await col.insertOne({
      name,
      email,
      subject,
      message,
      source: "web-contact",
      createdAt: new Date(),
    })

    res.status(201).json({
      ok: true,
      id: result.insertedId.toString(),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : "Could not send message" })
  }
})

export const contactRouter = router
