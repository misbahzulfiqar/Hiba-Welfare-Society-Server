declare global {
  namespace Express {
    interface Request {
      donorId?: string
    }
  }
}

export {}
