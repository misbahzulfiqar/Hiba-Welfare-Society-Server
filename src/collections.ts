const dbName = () => process.env.MONGODB_DB ?? "hiba-welfare-society"

export function paymentCollectionName() {
  return process.env.MONGODB_COL_PAYMENT?.trim() || "payment"
}

export function donorCollectionName() {
  return process.env.MONGODB_COL_DONORS?.trim() || "donors"
}

export function contactCollectionName() {
  return process.env.MONGODB_COL_CONTACT?.trim() || "contact_messages"
}

export function newsletterCollectionName() {
  return process.env.MONGODB_COL_NEWSLETTER?.trim() || "newsletter_subscribers"
}

export { dbName }
