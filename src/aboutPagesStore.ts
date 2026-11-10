import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type AboutPageKey =
  | "chairman"
  | "audit"
  | "tax"
  | "ebook"
  | "privacy"
  | "certificates"
  | "newsletter"
  | "terms"

export type AboutNavPage = {
  visible: boolean
  navLabel: string
  navDescription: string
  eyebrow: string
  title: string
  description: string
}

export type AboutChairmanPage = AboutNavPage & {
  chairmanName: string
  chairmanRole: string
  greeting: string
  message: string
  portrait: string
}

export type AboutCertificateItem = {
  id: string
  title: string
  image: string
  visible: boolean
  isLatest: boolean
}

export type AboutPagesSettings = {
  chairman: AboutChairmanPage
  audit: AboutNavPage
  tax: AboutNavPage
  ebook: AboutNavPage
  privacy: AboutNavPage
  certificates: AboutNavPage & { items: AboutCertificateItem[] }
  newsletter: AboutNavPage
  terms: AboutNavPage
}

const DEFAULT_CERTIFICATES: AboutCertificateItem[] = [
  {
    id: "pcp-certificate",
    title: "PCP Certificate",
    image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=700&q=80",
    visible: true,
    isLatest: true,
  },
]

function page(
  navLabel: string,
  navDescription: string,
  eyebrow: string,
  title: string,
  description: string,
): AboutNavPage {
  return { visible: true, navLabel, navDescription, eyebrow, title, description }
}

export const DEFAULT_ABOUT_PAGES: AboutPagesSettings = {
  chairman: {
    ...page(
      "Chairman's Message",
      "Message from the chairman",
      "About Us",
      "Chairman's Message",
      "Message from the chairman of Hiba Welfare Society.",
    ),
    chairmanName: "Muhammad Bashir Farooqi",
    chairmanRole: "Chairman, Hiba Welfare Society",
    greeting: "Assalam-o-Alaikum,",
    message:
      "It should be noted that Allah, who is in need of no one and nothing, instills upon His men to give Qarz-e-Hasana because it is in man's nature to be frugal while spending his wealth.",
    portrait: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=420&q=80",
  },
  audit: page(
    "Audit Reports",
    "Financial transparency",
    "Transparency",
    "Audit Reports",
    "As part of our commitment to transparency and accountability, we publish annual audit reports conducted by independent chartered accountants.",
  ),
  tax: page(
    "Tax Exemption",
    "Tax deduction benefits",
    "Transparency",
    "Tax Exemption",
    "We maintain clear and updated tax exemption documentation so donors can contribute with confidence and accountability.",
  ),
  ebook: page(
    "E-Book",
    "Digital publications",
    "Publications",
    "E-Book",
    "Explore our digital publications and partner alliances.",
  ),
  privacy: page(
    "Privacy Policy",
    "Privacy information",
    "Legal",
    "Privacy Policy",
    "At Hiba Welfare Society, your privacy is important to us. This Privacy Policy outlines how we collect, use, and protect your information.",
  ),
  certificates: {
    ...page(
      "Certificates",
      "Our certifications",
      "Recognition",
      "Certificates & Awards",
      "View our official certificates, awards, and recognitions that validate our commitment to excellence, transparency, and impactful humanitarian work across Pakistan.",
    ),
    items: DEFAULT_CERTIFICATES,
  },
  newsletter: page(
    "Newsletter",
    "Subscribe to updates",
    "Stay Informed",
    "Annual Newsletter",
    "Stay updated with our latest initiatives, success stories, and impact reports. Our annual newsletter highlights the lives we've touched and the difference we're making together.",
  ),
  terms: page(
    "Terms & Conditions",
    "Terms of service",
    "Legal",
    "Terms & Conditions",
    "Please read these terms carefully before using our website or making a donation.",
  ),
}

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data")
const dataFile = path.join(dataDir, "about-pages.json")

function asText(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return (trimmed || fallback).slice(0, max)
}

function asBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  return fallback
}

function normalizeNav(value: unknown, fallback: AboutNavPage): AboutNavPage {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    visible: asBool(row.visible, fallback.visible),
    navLabel: asText(row.navLabel, fallback.navLabel, 80),
    navDescription: asText(row.navDescription, fallback.navDescription, 120),
    eyebrow: asText(row.eyebrow, fallback.eyebrow, 40),
    title: asText(row.title, fallback.title, 120),
    description: asText(row.description, fallback.description, 600),
  }
}

function normalize(value: unknown): AboutPagesSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const chairmanRow =
    row.chairman && typeof row.chairman === "object" ? (row.chairman as Record<string, unknown>) : {}
  const certRow =
    row.certificates && typeof row.certificates === "object"
      ? (row.certificates as Record<string, unknown>)
      : {}
  const incomingItems = Array.isArray(certRow.items) ? certRow.items : []
  const items = DEFAULT_CERTIFICATES.map((fallback, index) => {
    const item = incomingItems[index]
    const card = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      title: asText(card.title, fallback.title, 120),
      image: asText(card.image, fallback.image, 800),
      visible: asBool(card.visible, fallback.visible),
      isLatest: asBool(card.isLatest, fallback.isLatest),
    }
  })

  return {
    chairman: {
      ...normalizeNav(row.chairman, DEFAULT_ABOUT_PAGES.chairman),
      chairmanName: asText(chairmanRow.chairmanName, DEFAULT_ABOUT_PAGES.chairman.chairmanName, 120),
      chairmanRole: asText(chairmanRow.chairmanRole, DEFAULT_ABOUT_PAGES.chairman.chairmanRole, 160),
      greeting: asText(chairmanRow.greeting, DEFAULT_ABOUT_PAGES.chairman.greeting, 80),
      message: asText(chairmanRow.message, DEFAULT_ABOUT_PAGES.chairman.message, 2000),
      portrait: asText(chairmanRow.portrait, DEFAULT_ABOUT_PAGES.chairman.portrait, 800),
    },
    audit: normalizeNav(row.audit, DEFAULT_ABOUT_PAGES.audit),
    tax: normalizeNav(row.tax, DEFAULT_ABOUT_PAGES.tax),
    ebook: normalizeNav(row.ebook, DEFAULT_ABOUT_PAGES.ebook),
    privacy: normalizeNav(row.privacy, DEFAULT_ABOUT_PAGES.privacy),
    certificates: {
      ...normalizeNav(row.certificates, DEFAULT_ABOUT_PAGES.certificates),
      items,
    },
    newsletter: normalizeNav(row.newsletter, DEFAULT_ABOUT_PAGES.newsletter),
    terms: normalizeNav(row.terms, DEFAULT_ABOUT_PAGES.terms),
  }
}

export async function readAboutPages(): Promise<AboutPagesSettings> {
  try {
    const raw = await readFile(dataFile, "utf8")
    return normalize(JSON.parse(raw))
  } catch {
    return DEFAULT_ABOUT_PAGES
  }
}

export async function writeAboutPages(value: unknown): Promise<AboutPagesSettings> {
  const next = normalize(value)
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8")
  return next
}
