import { Router, type Request, type Response } from "express"
import { readQuotes, writeQuotes } from "../quotesStore.js"

export const publicQuotesRouter = Router()

publicQuotesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const quotes = await readQuotes()
    res.json({ ok: true, quotes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not load quotes" })
  }
})

export async function saveAdminQuotes(req: Request, res: Response) {
  try {
    const body = req.body as { quotes?: unknown }
    const quotes = await writeQuotes(body.quotes)
    res.json({ ok: true, quotes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not save quotes" })
  }
}
