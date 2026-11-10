import type { Request, Response } from "express"
import { Router } from "express"
import { readAboutPages, writeAboutPages } from "../aboutPagesStore.js"

export const publicAboutPagesRouter = Router()

publicAboutPagesRouter.get("/", async (_req, res) => {
  try {
    const aboutPages = await readAboutPages()
    res.json({ ok: true, aboutPages })
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Failed to load about pages" })
  }
})

export async function saveAdminAboutPages(req: Request, res: Response) {
  try {
    const aboutPages = await writeAboutPages(req.body?.aboutPages ?? req.body)
    res.json({ ok: true, aboutPages })
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Could not save about pages" })
  }
}
