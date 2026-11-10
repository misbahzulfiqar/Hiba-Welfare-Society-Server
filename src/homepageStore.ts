import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { DEFAULT_CONTENT, normalizeContentSections, type ContentSections } from "./homepageContent.js"

export type InitiativeCard = {
  id: string
  title: string
  description: string
  image: string
  overlay: string
  link: string
}

export type QuickDonateOption = {
  id: string
  label: string
  link: string
  visible: boolean
}

export type QuickDonateCard = {
  id: "quick-left" | "quick-right"
  title: string
  description: string
  image: string
  badge: string
  priceTitle: string
  visible: boolean
}

export type QuickDonateSettings = {
  visible: boolean
  options: QuickDonateOption[]
  cards: QuickDonateCard[]
}

export type ImpactCard = {
  id: "lives" | "food" | "family" | "students"
  value: string
  label: string
  visible: boolean
}

export type ImpactSettings = {
  visible: boolean
  cards: ImpactCard[]
}

export type WhatWeAreDoingTab = {
  id: string
  label: string
  visible: boolean
}

export type WhatWeAreDoingCard = {
  id: string
  label: string
  image: string
  visible: boolean
}

export type WhatWeAreDoingSettings = {
  visible: boolean
  tabs: WhatWeAreDoingTab[]
  cards: WhatWeAreDoingCard[]
}

export type HomepageSettings = {
  focusAreasVisible: boolean
  initiativesVisible: boolean
  initiativesCount: number
  initiatives: InitiativeCard[]
  quickDonate: QuickDonateSettings
  impact: ImpactSettings
  whatWeAreDoing: WhatWeAreDoingSettings
} & ContentSections

const DEFAULT_INITIATIVES: InitiativeCard[] = [
  {
    id: "fitra",
    title: "Fitra, Fidya and Kaffara",
    description:
      "Fulfill your religious obligations through Fitra, Fidya, and Kaffara. Your contribution helps provide food and essential support to those in need across Pakistan.",
    image: "https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=400&q=80",
    overlay: "Your's Fitra, Fidya & Kaffara hope for Poors",
    link: "/donate/fitra-fidya-kaffara",
  },
  {
    id: "ramzan",
    title: "Ramzan 2026",
    description:
      "Make your Ramzan Donation 2026 a source of mercy and reward. Your contribution supports food distribution, charity programs, and iftar for families in need.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    overlay: "Ramzan Donation 2026",
    link: "/donate/ramzan-donation-2026",
  },
  {
    id: "medical",
    title: "Medical",
    description:
      "Support medical causes that provide essential healthcare, treatment, and life saving support to those in need. Your donation helps improve access to quality care.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80",
    overlay: "HIBA WELFARE MEDICAL SERVICES",
    link: "/donate/medical-program",
  },
  {
    id: "education",
    title: "Child Education Campaign",
    description:
      "Empowering the next generation by providing quality education to underprivileged children. We offer free schooling, textbooks, and learning materials.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    overlay: "Child Education",
    link: "/donate/childrens-education",
  },
]

const QUICK_IMAGE = "https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=800&q=80"

const DEFAULT_QUICK_OPTIONS: QuickDonateOption[] = [
  { id: "ramzan", label: "Ramzan Donation", link: "/donate/ramzan-donation-2026", visible: true },
  { id: "general", label: "General", link: "/donate/sadqa-and-zakat", visible: true },
  { id: "daily-food", label: "Daily Food", link: "/donate/food-assistance", visible: true },
  { id: "medical", label: "Medical", link: "/donate/medical-program", visible: true },
  { id: "welfare", label: "Welfare", link: "/donate/welfare-program", visible: true },
  { id: "education", label: "Education", link: "/donate/education-fund", visible: true },
]

const DEFAULT_QUICK_CARDS: QuickDonateCard[] = [
  {
    id: "quick-left",
    title: "Ramzan Donation",
    description: "Make your Ramzan Donation 2026 a source of mercy and reward.",
    image: QUICK_IMAGE,
    badge: "RAMZAN",
    priceTitle: "Zakat, Sehri and Iftari, Ration",
    visible: true,
  },
  {
    id: "quick-right",
    title: "Your's Fitra, Fidya & Kaffara",
    description: "Fulfill your religious obligations through Fitra, Fidya, and Kaffara.",
    image: QUICK_IMAGE,
    badge: "RAMZAN",
    priceTitle: "",
    visible: true,
  },
]

export const DEFAULT_QUICK_DONATE: QuickDonateSettings = {
  visible: true,
  options: DEFAULT_QUICK_OPTIONS,
  cards: DEFAULT_QUICK_CARDS,
}

const DEFAULT_IMPACT_CARDS: ImpactCard[] = [
  {
    id: "lives",
    value: "1,500,000",
    label: "Lives served every year across Pakistan",
    visible: true,
  },
  {
    id: "food",
    value: "250,000",
    label: "People Fed Daily",
    visible: true,
  },
  {
    id: "family",
    value: "12,000",
    label: "Family Adoptions every Month",
    visible: true,
  },
  {
    id: "students",
    value: "400,000",
    label: "Students taught annually",
    visible: true,
  },
]

export const DEFAULT_IMPACT: ImpactSettings = {
  visible: true,
  cards: DEFAULT_IMPACT_CARDS,
}

const DEFAULT_DOING_TABS: WhatWeAreDoingTab[] = [
  { id: "all", label: "All", visible: true },
  { id: "medical", label: "Medical", visible: true },
  { id: "welfare", label: "Welfare", visible: true },
  { id: "education", label: "Education", visible: true },
]

const DEFAULT_DOING_CARDS: WhatWeAreDoingCard[] = [
  {
    id: "doing-medical",
    label: "Medical",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80",
    visible: true,
  },
  {
    id: "doing-welfare",
    label: "Welfare",
    image: "https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=400&q=80",
    visible: true,
  },
  {
    id: "doing-education",
    label: "Education",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    visible: true,
  },
  {
    id: "doing-ramzan",
    label: "Ramzan",
    image: "https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=400&q=80",
    visible: true,
  },
  {
    id: "doing-food",
    label: "Daily Food",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80",
    visible: true,
  },
  {
    id: "doing-water",
    label: "Clean Water",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80",
    visible: true,
  },
]

export const DEFAULT_WHAT_WE_ARE_DOING: WhatWeAreDoingSettings = {
  visible: true,
  tabs: DEFAULT_DOING_TABS,
  cards: DEFAULT_DOING_CARDS,
}

export const DEFAULT_HOMEPAGE: HomepageSettings = {
  focusAreasVisible: true,
  initiativesVisible: true,
  initiativesCount: 4,
  initiatives: DEFAULT_INITIATIVES,
  quickDonate: DEFAULT_QUICK_DONATE,
  impact: DEFAULT_IMPACT,
  whatWeAreDoing: DEFAULT_WHAT_WE_ARE_DOING,
  ...DEFAULT_CONTENT,
}

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data")
const dataFile = path.join(dataDir, "homepage.json")

function asText(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return (trimmed || fallback).slice(0, max)
}

function asOptionalText(value: unknown, max: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

function asBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  return fallback
}

function normalizeQuickDonate(value: unknown): QuickDonateSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const incomingOptions = Array.isArray(row.options) ? row.options : []
  const options = DEFAULT_QUICK_OPTIONS.map((fallback, index) => {
    const item = incomingOptions[index]
    const option = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      label: asText(option.label, fallback.label, 60),
      link: fallback.link,
      visible: asBool(option.visible, fallback.visible),
    }
  })
  const incomingCards = Array.isArray(row.cards) ? row.cards : []
  const cards = DEFAULT_QUICK_CARDS.map((fallback, index) => {
    const item = incomingCards[index]
    const card = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      title: asText(card.title, fallback.title, 120),
      description: asText(card.description, fallback.description, 300),
      image: asText(card.image, fallback.image, 800),
      badge: asOptionalText(card.badge, 40),
      priceTitle: asOptionalText(card.priceTitle, 120),
      visible: asBool(card.visible, fallback.visible),
    }
  })
  return {
    visible: asBool(row.visible, true),
    options,
    cards,
  }
}

function normalizeImpact(value: unknown): ImpactSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const incomingCards = Array.isArray(row.cards) ? row.cards : []
  const cards = DEFAULT_IMPACT_CARDS.map((fallback, index) => {
    const item = incomingCards[index]
    const card = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      value: asText(card.value, fallback.value, 40),
      label: asText(card.label, fallback.label, 120),
      visible: asBool(card.visible, fallback.visible),
    }
  })
  return {
    visible: asBool(row.visible, true),
    cards,
  }
}

function normalizeWhatWeAreDoing(value: unknown): WhatWeAreDoingSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const incomingTabs = Array.isArray(row.tabs) ? row.tabs : []
  const tabs = DEFAULT_DOING_TABS.map((fallback, index) => {
    const item = incomingTabs[index]
    const tab = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      label: asText(tab.label, fallback.label, 40),
      visible: asBool(tab.visible, fallback.visible),
    }
  })
  const incomingCards = Array.isArray(row.cards) ? row.cards : []
  const cards = DEFAULT_DOING_CARDS.map((fallback, index) => {
    const item = incomingCards[index]
    const card = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      label: asText(card.label, fallback.label, 60),
      image: asText(card.image, fallback.image, 800),
      visible: asBool(card.visible, fallback.visible),
    }
  })
  return {
    visible: asBool(row.visible, true),
    tabs,
    cards,
  }
}

function normalize(value: unknown): HomepageSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const incoming = Array.isArray(row.initiatives) ? row.initiatives : []
  const initiatives = DEFAULT_INITIATIVES.map((fallback, index) => {
    const item = incoming[index]
    const card = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      id: fallback.id,
      title: asText(card.title, fallback.title, 120),
      description: asText(card.description, fallback.description, 500),
      image: asText(card.image, fallback.image, 800),
      overlay: asText(card.overlay, fallback.overlay, 160),
      link: fallback.link,
    }
  })
  const count = Number(row.initiativesCount)
  return {
    focusAreasVisible: row.focusAreasVisible !== false,
    initiativesVisible: row.initiativesVisible !== false,
    initiativesCount: count >= 1 && count <= 4 ? Math.floor(count) : 4,
    initiatives,
    quickDonate: normalizeQuickDonate(row.quickDonate),
    impact: normalizeImpact(row.impact),
    whatWeAreDoing: normalizeWhatWeAreDoing(row.whatWeAreDoing),
    ...normalizeContentSections(row),
  }
}

export async function readHomepage(): Promise<HomepageSettings> {
  try {
    const raw = await readFile(dataFile, "utf8")
    return normalize(JSON.parse(raw))
  } catch {
    return DEFAULT_HOMEPAGE
  }
}

export async function writeHomepage(value: unknown): Promise<HomepageSettings> {
  const next = normalize(value)
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8")
  return next
}
