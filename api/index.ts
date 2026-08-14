import type { VercelRequest, VercelResponse } from "@vercel/node"
import app from "../src/app.js"

export default function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve) => {
    res.on("finish", resolve)
    res.on("close", resolve)
    app(req as never, res as never)
  })
}
