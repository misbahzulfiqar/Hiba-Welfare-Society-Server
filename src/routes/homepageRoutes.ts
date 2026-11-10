import { Router, type Request, type Response } from "express"
import { readHomepage, writeHomepage } from "../homepageStore.js"

export const publicHomepageRouter = Router()

publicHomepageRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const homepage = await readHomepage()
    res.json({ ok: true, homepage })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not load homepage settings" })
  }
})

export async function saveAdminHomepage(req: Request, res: Response) {
  try {
    const homepage = await writeHomepage(req.body?.homepage)
    res.json({ ok: true, homepage })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: "Could not save homepage settings" })
  }
}
