import { Router, type Request, type Response } from "express"
import { readSiteContent, writeSiteContent } from "../siteContentStore.js"

export const publicSiteContentRouter = Router()

publicSiteContentRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await readSiteContent()
    res.json({ ok: true, ...result })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not load site content" })
  }
})

export async function saveAdminSiteContent(req: Request, res: Response) {
  try {
    const content = await writeSiteContent(req.body?.content)
    res.json({ ok: true, content, stored: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not save site content" })
  }
}
