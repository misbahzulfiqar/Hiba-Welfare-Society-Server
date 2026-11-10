import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type ServiceMenuItem = { id: string; label: string; visible: boolean }
export type ServiceMenuSection = { id: string; title: string; visible: boolean; items: ServiceMenuItem[] }
export type MediaMenuLink = { visible: boolean; label: string; description: string }
export type NavTextLink = { id: string; label: string; href: string; visible: boolean }

export type SiteContent = {
  home: { heading: string; tagline: string; description: string }
  about: { title: string; chairmanName: string; chairmanRole: string; greeting: string; message: string }
  services: {
    visible: boolean
    title: string
    intro: string
    items: string[]
    menu: ServiceMenuSection[]
  }
  media: {
    visible: boolean
    title: string
    news: string[]
    videos: string[]
    menuNews: MediaMenuLink
    menuVideos: MediaMenuLink
  }
  donate: { visible: boolean; title: string; description: string }
  contact: { visible: boolean; title: string; email: string; phones: string; address: string }
  bank: {
    visible: boolean
    title: string
    bankName: string
    bankSubtitle: string
    accountTitle: string
    accountNumber: string
    iban: string
  }
  donateNow: { visible: boolean; label: string }
  footer: {
    brandName: string
    brandText: string
    donationCategories: NavTextLink[]
  }
  stickyBar: {
    visible: boolean
    links: NavTextLink[]
  }
}

function menuItem(id: string, label: string): ServiceMenuItem {
  return { id, label, visible: true }
}

function menuSection(id: string, title: string, items: Array<[string, string]>): ServiceMenuSection {
  return {
    id,
    title,
    visible: true,
    items: items.map(([itemId, label]) => menuItem(itemId, label)),
  }
}

function navLink(id: string, label: string, href: string): NavTextLink {
  return { id, label, href, visible: true }
}

const DEFAULT_SERVICE_MENU: ServiceMenuSection[] = [
  menuSection("health", "Health", [
    ["mother-child-care", "Mother & Child Care"],
    ["blood-bank-thalassemia", "Blood Bank & Thalassemia"],
    ["medical-equipment", "Medical Equipment"],
    ["hijama", "Hijama"],
    ["laboratory", "Laboratory"],
    ["x-ray-ultrasound", "X-Ray & Ultrasound"],
    ["mobile-clinic", "Mobile Clinic"],
  ]),
  menuSection("education", "Education", [
    ["schooling-system", "Schooling System"],
    ["smit", "SMIT"],
    ["piaic", "PIAIC"],
    ["madarisa", "Madarisa"],
    ["online-quran-academy", "Online Quran Academy"],
    ["sbil", "SBIL"],
    ["motorbike-mechanic", "Motorbike Mechanic"],
    ["mobile-repairing", "Mobile Repairing"],
  ]),
  menuSection("food-ration", "Food & Ration", [
    ["ration-support", "Ration Support"],
    ["dastarkhwan", "Hiba welfare Dastarkhwan"],
    ["breakfast", "Hiba welfare Breakfast"],
    ["meat-distribution", "Meat Distribution"],
    ["mobile-dastarkhwan", "Mobile Dastarkhwan"],
    ["mezban", "Mezban Hiba welfare"],
    ["roti-bank", "Roti Bank"],
  ]),
  menuSection("social-welfare", "Social Welfare", [
    ["kafalat-program", "Kafalat Program"],
    ["wedding-support", "Wedding Support"],
    ["apna-karobaar", "Apna Karobaar"],
    ["job-bank", "Job Bank"],
    ["laptop-financing", "Laptop Financing"],
    ["housing", "Housing"],
  ]),
  menuSection("sadiqah-jariah", "Sadiqah Jariah", [
    ["construction-of-masajid", "Construction of Masajid"],
    ["clean-drinking-water", "Clean Drinking Water"],
    ["plantation", "Plantation"],
  ]),
  menuSection("disaster-aid", "Disaster Aid", [
    ["corona-relief", "Corona Relief"],
    ["rain-relief", "Rain Relief"],
    ["fire-fighting-rescue", "Fire Fighting & Rescue"],
  ]),
  menuSection("ehsaas", "Hiba welfare Ehsaas", [
    ["langar-khana", "Langar Khana"],
    ["panah-gaah", "Panah Gaah"],
    ["koi-bhooka-na-soyega", "Koi Bhooka Na Soyega"],
  ]),
]

const DEFAULT_CONTENT: SiteContent = {
  home: {
    heading: "HIBA WELFARE SOCIETY",
    tagline: "CHANGING LIVES, BUILDING A BETTER TOMORROW",
    description:
      "Hiba Welfare Society is a non-profit organization dedicated to uplifting communities and empowering individuals through compassion, care and commitment.",
  },
  about: {
    title: "Chairman's Message",
    chairmanName: "Muhammad Bashir Farooqi",
    chairmanRole: "Chairman, Hiba Welfare Society",
    greeting: "Assalam-o-Alaikum,",
    message:
      "It should be noted that Allah, who is in need of no one and nothing, instills upon His men to give Qarz-e-Hasana because it is in man's nature to be frugal while spending his wealth.",
  },
  services: {
    visible: true,
    title: "Services",
    intro: "Health, education, food and welfare programs published on the services page.",
    items: [
      "Blood Bank & Thalassemia Center",
      "Mobile Healthcare Clinic",
      "Medical Equipment",
      "Hijama (Cupping Therapy)",
      "Laboratory Facility",
      "X-Rays and Ultrasound",
      "Mother & Child Care Center",
      "Hiba Welfare Schooling System",
      "Hiba Welfare Mass IT Training (SMIT)",
      "Online Quran Academy",
      "Hiba Welfare Dastarkhwan",
      "Hiba Welfare Roti Bank",
      "Ration Support",
      "Kafalat Program",
      "Housing Support",
      "Clean Drinking Water",
    ],
    menu: DEFAULT_SERVICE_MENU,
  },
  media: {
    visible: true,
    title: "Media",
    news: [
      "Maulana Bashir Farooq Qadri reaches among flood victims in Khyber",
      "A Heartfelt Visit of Saad Afridi CEO of Scents N Stories",
      "Javed Alam Odho, Additional IG Karachi, at Hiba Welfare Head Office",
      "Hiba Welfare Mega IT Exam 2025",
    ],
    videos: [
      "Maulana Abdul Habib Attari Visits Hiba Welfare Zaitoon Ashraf IT Park",
      "Hiba Welfare Welfare Trust & KAACIB Job Fair",
      "Khyber Pakhtunkhwa Floods - Hiba Welfare Relief Report",
    ],
    menuNews: { visible: true, label: "News", description: "Recent news" },
    menuVideos: { visible: true, label: "Videos", description: "Video gallery" },
  },
  donate: {
    visible: true,
    title: "Donate",
    description: "Choose a cause and support Hiba Welfare Society.",
  },
  contact: {
    visible: true,
    title: "Contact Us",
    email: "hibawelfaresociety@gmail.com",
    phones: "0345-4906001\n0321-6703735",
    address: "4th Floor, Shamim Square, Nazd Shezan Bakery, Main Market, Gulberg II, Lahore, Pakistan",
  },
  bank: {
    visible: true,
    title: "Bank Details",
    bankName: "Faysal Bank",
    bankSubtitle: "Faysal Bank Limited",
    accountTitle: "Hiba Welfare Society",
    accountNumber: "3395499000002377",
    iban: "PK83FAYS3395499000002377",
  },
  donateNow: {
    visible: true,
    label: "DONATE NOW",
  },
  footer: {
    brandName: "Hiba Welfare",
    brandText:
      "Hiba Welfare Society is dedicated to uplifting the impoverished through comprehensive support services including food, health, and education.",
    donationCategories: [
      navLink("ramzan-2026", "Ramzan 2026", "/donate/ramzan-donation-2026"),
      navLink("sadqa-jariah", "Sadqa e Jariah", "/donate/sadqa-jariah"),
      navLink("sadqah-aqiqah", "Sadqa / Aqiqah Animal", "/donate/sadqah-aqiqah-animal"),
      navLink("food-donation", "Food Donation", "/donate/food-assistance"),
      navLink("education", "Education", "/donate/education-fund"),
      navLink("medical", "Medical & Healthcare", "/donate/medical-program"),
    ],
  },
  stickyBar: {
    visible: true,
    links: [
      navLink("sehri-iftari", "Ramadan Sehri & Iftari", "/donate/ramzan-donation-2026"),
      navLink("ramadan-ration", "Ramadan Ration", "/donate/ramzan-donation-2026"),
      navLink("zakat", "Zakat", "/donate/zakat-support-fund"),
    ],
  },
}

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data")
const dataFile = path.join(dataDir, "site-content.json")

function text(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return (trimmed || fallback).slice(0, max)
}

function asBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  return fallback
}

function lines(value: unknown, fallback: string[], maxItems: number, maxLen: number) {
  if (!Array.isArray(value)) return fallback
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLen))
  return items.length > 0 ? items : fallback
}

function normalizeMenuItem(value: unknown, fallback: ServiceMenuItem): ServiceMenuItem {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    id: text(row.id, fallback.id, 80),
    label: text(row.label, fallback.label, 120),
    visible: asBool(row.visible, fallback.visible),
  }
}

function normalizeMenuSection(value: unknown, fallback: ServiceMenuSection): ServiceMenuSection {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const incomingItems = Array.isArray(row.items) ? row.items : []
  const items =
    incomingItems.length > 0
      ? incomingItems
          .slice(0, 20)
          .map((item, index) => normalizeMenuItem(item, fallback.items[index] ?? menuItem(`item-${index}`, "Service")))
      : fallback.items
  return {
    id: text(row.id, fallback.id, 80),
    title: text(row.title, fallback.title, 80),
    visible: asBool(row.visible, fallback.visible),
    items,
  }
}

function normalizeServiceMenu(value: unknown): ServiceMenuSection[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_SERVICE_MENU
  return value
    .slice(0, 12)
    .map((section, index) =>
      normalizeMenuSection(section, DEFAULT_SERVICE_MENU[index] ?? menuSection(`section-${index}`, "Section", [])),
    )
}

function normalizeMediaLink(value: unknown, fallback: MediaMenuLink): MediaMenuLink {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    visible: asBool(row.visible, fallback.visible),
    label: text(row.label, fallback.label, 80),
    description: text(row.description, fallback.description, 160),
  }
}

function normalizeNavLink(value: unknown, fallback: NavTextLink): NavTextLink {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    id: text(row.id, fallback.id, 80),
    label: text(row.label, fallback.label, 120),
    href: text(row.href, fallback.href, 200),
    visible: asBool(row.visible, fallback.visible),
  }
}

function normalizeNavLinks(value: unknown, fallback: NavTextLink[]): NavTextLink[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  return value
    .slice(0, 20)
    .map((item, index) => normalizeNavLink(item, fallback[index] ?? navLink(`link-${index}`, "Link", "/")))
}

function normalize(value: unknown): SiteContent {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const home = row.home && typeof row.home === "object" ? (row.home as Record<string, unknown>) : {}
  const about = row.about && typeof row.about === "object" ? (row.about as Record<string, unknown>) : {}
  const services = row.services && typeof row.services === "object" ? (row.services as Record<string, unknown>) : {}
  const media = row.media && typeof row.media === "object" ? (row.media as Record<string, unknown>) : {}
  const donate = row.donate && typeof row.donate === "object" ? (row.donate as Record<string, unknown>) : {}
  const contact = row.contact && typeof row.contact === "object" ? (row.contact as Record<string, unknown>) : {}
  const bank = row.bank && typeof row.bank === "object" ? (row.bank as Record<string, unknown>) : {}
  const donateNow =
    row.donateNow && typeof row.donateNow === "object" ? (row.donateNow as Record<string, unknown>) : {}
  const footer = row.footer && typeof row.footer === "object" ? (row.footer as Record<string, unknown>) : {}
  const stickyBar =
    row.stickyBar && typeof row.stickyBar === "object" ? (row.stickyBar as Record<string, unknown>) : {}
  return {
    home: {
      heading: text(home.heading, DEFAULT_CONTENT.home.heading, 120),
      tagline: text(home.tagline, DEFAULT_CONTENT.home.tagline, 180),
      description: text(home.description, DEFAULT_CONTENT.home.description, 600),
    },
    about: {
      title: text(about.title, DEFAULT_CONTENT.about.title, 120),
      chairmanName: text(about.chairmanName, DEFAULT_CONTENT.about.chairmanName, 120),
      chairmanRole: text(about.chairmanRole, DEFAULT_CONTENT.about.chairmanRole, 160),
      greeting: text(about.greeting, DEFAULT_CONTENT.about.greeting, 80),
      message: text(about.message, DEFAULT_CONTENT.about.message, 2000),
    },
    services: {
      visible: asBool(services.visible, true),
      title: text(services.title, DEFAULT_CONTENT.services.title, 80),
      intro: text(services.intro, DEFAULT_CONTENT.services.intro, 400),
      items: lines(services.items, DEFAULT_CONTENT.services.items, 40, 160),
      menu: normalizeServiceMenu(services.menu),
    },
    media: {
      visible: asBool(media.visible, true),
      title: text(media.title, DEFAULT_CONTENT.media.title, 80),
      news: lines(media.news, DEFAULT_CONTENT.media.news, 12, 240),
      videos: lines(media.videos, DEFAULT_CONTENT.media.videos, 12, 240),
      menuNews: normalizeMediaLink(media.menuNews, DEFAULT_CONTENT.media.menuNews),
      menuVideos: normalizeMediaLink(media.menuVideos, DEFAULT_CONTENT.media.menuVideos),
    },
    donate: {
      visible: asBool(donate.visible, true),
      title: text(donate.title, DEFAULT_CONTENT.donate.title, 80),
      description: text(donate.description, DEFAULT_CONTENT.donate.description, 300),
    },
    contact: {
      visible: asBool(contact.visible, true),
      title: text(contact.title, DEFAULT_CONTENT.contact.title, 80),
      email: text(contact.email, DEFAULT_CONTENT.contact.email, 160),
      phones: text(contact.phones, DEFAULT_CONTENT.contact.phones, 200),
      address: text(contact.address, DEFAULT_CONTENT.contact.address, 400),
    },
    bank: {
      visible: asBool(bank.visible, true),
      title: text(bank.title, DEFAULT_CONTENT.bank.title, 80),
      bankName: text(bank.bankName, DEFAULT_CONTENT.bank.bankName, 80),
      bankSubtitle: text(bank.bankSubtitle, DEFAULT_CONTENT.bank.bankSubtitle, 120),
      accountTitle: text(bank.accountTitle, DEFAULT_CONTENT.bank.accountTitle, 120),
      accountNumber: text(bank.accountNumber, DEFAULT_CONTENT.bank.accountNumber, 40),
      iban: text(bank.iban, DEFAULT_CONTENT.bank.iban, 40),
    },
    donateNow: {
      visible: asBool(donateNow.visible, true),
      label: text(donateNow.label, DEFAULT_CONTENT.donateNow.label, 40),
    },
    footer: {
      brandName: text(footer.brandName, DEFAULT_CONTENT.footer.brandName, 80),
      brandText: text(footer.brandText, DEFAULT_CONTENT.footer.brandText, 500),
      donationCategories: normalizeNavLinks(footer.donationCategories, DEFAULT_CONTENT.footer.donationCategories),
    },
    stickyBar: {
      visible: asBool(stickyBar.visible, true),
      links: normalizeNavLinks(stickyBar.links, DEFAULT_CONTENT.stickyBar.links),
    },
  }
}

export async function readSiteContent(): Promise<{ content: SiteContent; stored: boolean }> {
  try {
    const raw = await readFile(dataFile, "utf8")
    return { content: normalize(JSON.parse(raw)), stored: true }
  } catch {
    return { content: DEFAULT_CONTENT, stored: false }
  }
}

export async function writeSiteContent(value: unknown): Promise<SiteContent> {
  const content = normalize(value)
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, JSON.stringify(content, null, 2), "utf8")
  return content
}

export { DEFAULT_CONTENT as DEFAULT_SITE_CONTENT }
