import { Router, type Request, type Response } from "express"
import {
  paymentFindByOrderRef,
  paymentInsertOne,
  paymentUpdateByOrderRef,
} from "./paymentPersistence.js"

type BankTransferStatus =
  | "bank_transfer_initiated"
  | "pending_verification"
  | "success"
  | "failed"

const FAYSAL_BANK_DETAILS = {
  bankName: "Faysal Bank",
  accountTitle: "HIBA WELFARE SOCIETY",
  accountNumber: "3395499000002377",
  iban: "PK83FAYS3395499000002377",
  swiftCode: "FAYSPKKA",
  branchName: "Faysal Bank",
  branchCode: "—",
}

export const easypaisaRouter = Router()

easypaisaRouter.post("/create-donation", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const totalPayable = body.totalPayable
    if (typeof totalPayable !== "number" || totalPayable <= 0) {
      res.status(400).json({ ok: false, error: "totalPayable must be a positive number" })
      return
    }

    const orderRef = `DON-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    let donorName = ""
    if (body.donor && typeof body.donor === "object" && body.donor !== null && "name" in body.donor) {
      donorName = String((body.donor as { name?: string }).name ?? "")
    } else if (typeof body.donorName === "string") {
      donorName = body.donorName
    }

    await paymentInsertOne({
      status: "bank_transfer_initiated" as BankTransferStatus,
      orderRef,
      amountPkr: totalPayable,
      currency: "PKR",
      donorName: donorName || undefined,
      donationMeta: body,
      gateway: "faysal_bank",
      bankDetails: FAYSAL_BANK_DETAILS,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.json({
      ok: true,
      orderRef,
      amountPkr: totalPayable,
      status: "bank_transfer_initiated",
      bankDetails: FAYSAL_BANK_DETAILS,
      instructions: [
        "Transfer the exact amount to the Faysal Bank account shown below.",
        "After transfer, submit your transaction reference for manual verification.",
      ],
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not start donation",
    })
  }
})

easypaisaRouter.post("/submit-bank-transfer", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const orderRef = typeof body.orderRef === "string" ? body.orderRef.trim() : ""
    const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : ""
    const senderName = typeof body.senderName === "string" ? body.senderName.trim() : ""
    const senderPhone = typeof body.senderPhone === "string" ? body.senderPhone.trim() : ""
    const notes = typeof body.notes === "string" ? body.notes.trim() : ""

    if (!orderRef) {
      res.status(400).json({ ok: false, error: "orderRef is required" })
      return
    }
    if (!transactionId) {
      res.status(400).json({ ok: false, error: "transactionId is required" })
      return
    }

    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation order not found" })
      return
    }

    await paymentUpdateByOrderRef(orderRef, {
      status: "pending_verification" as BankTransferStatus,
      transactionId,
      senderName: senderName || undefined,
      senderPhone: senderPhone || undefined,
      donorName:
        (typeof existing.donorName === "string" && existing.donorName) ||
        senderName ||
        undefined,
      notes: notes || undefined,
      submittedAt: new Date(),
      updatedAt: new Date(),
      bankDetails: FAYSAL_BANK_DETAILS,
    })

    res.json({
      ok: true,
      status: "pending",
      orderRef,
      message: "Transfer proof submitted. Our team will verify and confirm soon.",
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not submit transfer proof",
    })
  }
})

easypaisaRouter.get("/verify-donation/:orderRef", async (req: Request, res: Response) => {
  try {
    const orderRef = req.params.orderRef
    if (!orderRef || orderRef.length > 220) {
      res.status(400).json({ ok: false, error: "Invalid order reference" })
      return
    }

    const existing = await paymentFindByOrderRef(orderRef)
    if (!existing) {
      res.status(404).json({ ok: false, error: "Donation record not found" })
      return
    }

    const status =
      typeof existing.status === "string" ? (existing.status as BankTransferStatus) : "bank_transfer_initiated"
    const amountPkr = typeof existing.amountPkr === "number" ? existing.amountPkr : 0
    const donorName = typeof existing.donorName === "string" ? existing.donorName : ""
    const transactionId = typeof existing.transactionId === "string" ? existing.transactionId : ""

    if (status === "success") {
      res.json({
        ok: true,
        status: "success",
        orderRef,
        amountPkr,
        donorName,
        transactionId,
      })
      return
    }

    if (status === "failed") {
      res.json({
        ok: true,
        status: "failed",
        orderRef,
        detail: typeof existing.adminNote === "string" ? existing.adminNote : "Transfer could not be verified",
      })
      return
    }

    res.json({
      ok: true,
      status: "pending",
      orderRef,
      amountPkr,
      donorName,
      transactionId,
      bankDetails: FAYSAL_BANK_DETAILS,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "Verification failed",
    })
  }
})
