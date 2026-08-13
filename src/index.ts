import app, { ensureIndexes } from "./app.js"

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`Hiba API listening on http://localhost:${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  void ensureIndexes()
})
