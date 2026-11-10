export type StoryItem = {
  id: string
  image: string
  date: string
  title: string
  excerpt: string
  visible: boolean
}

export type StorySection = {
  visible: boolean
  eyebrow: string
  titleLead: string
  titleAccent: string
  description: string
  items: StoryItem[]
}

export type TestimonialItem = {
  id: string
  name: string
  role: string
  quote: string
  time: string
  avatar: string
  rating: number
  visible: boolean
}

export type TestimonialsSection = {
  visible: boolean
  badge: string
  titleLead: string
  titleAccent: string
  description: string
  items: TestimonialItem[]
}

export type DonateCtaSettings = {
  visible: boolean
  title: string
  description: string
  buttonLabel: string
}

export type NewsletterBannerSettings = {
  visible: boolean
  title: string
  description: string
}

export type ContentSections = {
  blogs: StorySection
  mediaUpdates: StorySection
  latestNews: StorySection
  testimonials: TestimonialsSection
  donateCta: DonateCtaSettings
  newsletterBanner: NewsletterBannerSettings
}

const BLOG_IMAGE_A = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80"
const BLOG_IMAGE_B = "https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=400&q=80"
const BLOG_IMAGE_C = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80"
const BLOG_IMAGE_D = "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80"
const BLOG_IMAGE_E = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80"

function story(
  id: string,
  image: string,
  date: string,
  title: string,
  excerpt: string,
): StoryItem {
  return { id, image, date, title, excerpt, visible: true }
}

export const DEFAULT_BLOGS: StorySection = {
  visible: true,
  eyebrow: "Latest Blogs",
  titleLead: "Our",
  titleAccent: "Blogs",
  description: "Stay updated with insights, stories, and news from our welfare initiatives",
  items: [
    story(
      "blog-taak-raat",
      BLOG_IMAGE_A,
      "6/3/2026",
      "The Virtue of Giving on Taak Raat: Why Odd Nights in Ramadan Matter",
      "Taak Raat, odd nights Ramadan, charity in Ramadan, Laylat al-Qadr charity, giving in the last ashra...",
    ),
    story(
      "blog-sadaqah",
      BLOG_IMAGE_B,
      "5/3/2026",
      "How Your Sadaqah Reaches Families in Need This Ramadan",
      "Sadaqah, Ramadan donation, family support, food distribution, welfare programs, community impact...",
    ),
    story(
      "blog-iftar",
      BLOG_IMAGE_C,
      "4/3/2026",
      "Stories from the Field: A Day at Our Iftar Distribution",
      "Iftar distribution, volunteer stories, Ramadan 2026, community service, free meals, underprivileged...",
    ),
    story(
      "blog-zakat",
      BLOG_IMAGE_D,
      "3/3/2026",
      "Zakat Guide 2026: Calculating and Distributing Your Zakat",
      "Zakat guide, Zakat calculation, Zakat distribution, Islamic charity, welfare trust, 2026...",
    ),
  ],
}

export const DEFAULT_MEDIA_UPDATES: StorySection = {
  visible: true,
  eyebrow: "Latest Update",
  titleLead: "Media",
  titleAccent: "Updates",
  description: "Making a difference in the lives of thousands every day through comprehensive welfare programs",
  items: [
    story(
      "media-attari",
      BLOG_IMAGE_E,
      "19/1/2025",
      "Maulana Abdul Habib Attari Visits Hiba Welfare Zaitoon Ashra Center",
      "EMPLOYMENT OPPORTUNITIES BY KAACIB AND HIBA WELFARE",
    ),
    story(
      "media-education",
      BLOG_IMAGE_A,
      "18/1/2025",
      "Hiba Welfare Education Drive Reaches 50 New Villages",
      "PAKISTAN KPK – Education for All Initiative",
    ),
    story(
      "media-langar",
      BLOG_IMAGE_C,
      "17/1/2025",
      "Daily Langar Distribution Crosses 450,000 Meals",
      "Making a difference in the lives of thousands every day",
    ),
  ],
}

export const DEFAULT_LATEST_NEWS: StorySection = {
  visible: true,
  eyebrow: "Latest News",
  titleLead: "Latest",
  titleAccent: "News",
  description: "Stay informed about our latest activities, events, and community impact",
  items: [
    story(
      "news-sindh",
      BLOG_IMAGE_D,
      "20/1/2026",
      "Maulana Bashir Farooq Qadri reaches among flood victims in Sindh",
      "Flood relief, Sindh, emergency response, welfare distribution...",
    ),
    story(
      "news-ramzan",
      BLOG_IMAGE_B,
      "19/1/2026",
      "Hiba Welfare Ramzan 2026 Campaign Launched Across 100+ Cities",
      "Ramzan 2026, campaign launch, food distribution, nationwide...",
    ),
    story(
      "news-medical",
      BLOG_IMAGE_B,
      "18/1/2026",
      "Free Medical Camp Serves Over 5,000 Patients in Lahore",
      "Medical camp, Lahore, free healthcare, community health...",
    ),
    story(
      "news-education",
      BLOG_IMAGE_A,
      "17/1/2026",
      "New Education Centers Open in Balochistan and KPK",
      "Education, Balochistan, KPK, schools, literacy...",
    ),
  ],
}

export const DEFAULT_TESTIMONIALS: TestimonialsSection = {
  visible: true,
  badge: "Our Testimonials",
  titleLead: "What We Are",
  titleAccent: "Say?",
  description: "Making a difference in the lives of thousands every day through comprehensive welfare programs",
  items: [
    {
      id: "testimonial-arshad",
      name: "Arshad Wali Muhammad",
      role: "Group Director, Meny's Group",
      quote:
        "Hiba Welfare Trust is a name that needs no introduction today. The journey this team embarked upon was made possible owing to their zeal, enthusiasm & commitment to the society and by the grace of Allah (SWT), it has become a name that we need and not just the one we want. I wish Hiba Welfare's team all the success and blessing that they deserve for future, May God bless Hiba Welfare and ensure prosperity and happiness for our people, Ameen!",
      time: "4 Days Ago",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=96&h=96&fit=crop&q=80",
      rating: 4.5,
      visible: true,
    },
    {
      id: "testimonial-asif",
      name: "Asif Ismail",
      role: "COO & Director, Premier Cables Pvt. Ltd",
      quote:
        "When we talk about serving humanity, no second thought occurs other than Hiba Welfare Trust. Hiba Welfare is doing a tremendous job in terms of everything they do for a troubled humanity. From offering food to the hungry to arranging jobs for jobless people, arranging marriages and dowry for orphaned girls, offering free medical facilities, and much more. We sincerely wish them success in their future endeavors and in raising their standards of serving mankind in a better and more professional way.",
      time: "4 Days Ago",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&q=80",
      rating: 4.5,
      visible: true,
    },
  ],
}

export const DEFAULT_DONATE_CTA: DonateCtaSettings = {
  visible: true,
  title: "YOUR DONATION CAN CHANGE LIVES",
  description: "Stand with us to support those in need and build a brighter, better future together.",
  buttonLabel: "DONATE NOW",
}

export const DEFAULT_NEWSLETTER_BANNER: NewsletterBannerSettings = {
  visible: true,
  title: "Subscribe Our Newsletter",
  description: "Our organization has a long tradition of serving humanity and empowering the underprivileged.",
}

export const DEFAULT_CONTENT: ContentSections = {
  blogs: DEFAULT_BLOGS,
  mediaUpdates: DEFAULT_MEDIA_UPDATES,
  latestNews: DEFAULT_LATEST_NEWS,
  testimonials: DEFAULT_TESTIMONIALS,
  donateCta: DEFAULT_DONATE_CTA,
  newsletterBanner: DEFAULT_NEWSLETTER_BANNER,
}

function asText(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return (trimmed || fallback).slice(0, max)
}

function asOptionalText(value: unknown, max: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

function asId(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : ""
  return (raw || fallback).slice(0, 48)
}

function normalizeStory(value: unknown, fallback: StorySection): StorySection {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const hasItems = Array.isArray(row.items)
  const source = hasItems ? (row.items as unknown[]) : fallback.items
  const items = source.slice(0, 24).flatMap((item, index): StoryItem[] => {
    if (!item || typeof item !== "object") return []
    const card = item as Record<string, unknown>
    return [
      {
        id: asId(card.id, `story-${index + 1}`),
        image: asOptionalText(card.image, 800),
        date: asOptionalText(card.date, 40),
        title: asText(card.title, "Untitled", 180),
        excerpt: asOptionalText(card.excerpt, 400),
        visible: card.visible !== false,
      },
    ]
  })
  return {
    visible: row.visible !== false,
    eyebrow: asText(row.eyebrow, fallback.eyebrow, 60),
    titleLead: asText(row.titleLead, fallback.titleLead, 40),
    titleAccent: asText(row.titleAccent, fallback.titleAccent, 40),
    description: asText(row.description, fallback.description, 300),
    items,
  }
}

function normalizeTestimonials(value: unknown): TestimonialsSection {
  const fallback = DEFAULT_TESTIMONIALS
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const hasItems = Array.isArray(row.items)
  const source = hasItems ? (row.items as unknown[]) : fallback.items
  const items = source.slice(0, 24).flatMap((item, index): TestimonialItem[] => {
    if (!item || typeof item !== "object") return []
    const card = item as Record<string, unknown>
    const rating = Number(card.rating)
    return [
      {
        id: asId(card.id, `testimonial-${index + 1}`),
        name: asText(card.name, "Name", 80),
        role: asOptionalText(card.role, 120),
        quote: asText(card.quote, "Quote", 800),
        time: asOptionalText(card.time, 40),
        avatar: asOptionalText(card.avatar, 800),
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 5,
        visible: card.visible !== false,
      },
    ]
  })
  return {
    visible: row.visible !== false,
    badge: asText(row.badge, fallback.badge, 60),
    titleLead: asText(row.titleLead, fallback.titleLead, 40),
    titleAccent: asText(row.titleAccent, fallback.titleAccent, 40),
    description: asText(row.description, fallback.description, 300),
    items,
  }
}

function normalizeDonateCta(value: unknown): DonateCtaSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    visible: row.visible !== false,
    title: asText(row.title, DEFAULT_DONATE_CTA.title, 120),
    description: asText(row.description, DEFAULT_DONATE_CTA.description, 300),
    buttonLabel: asText(row.buttonLabel, DEFAULT_DONATE_CTA.buttonLabel, 40),
  }
}

function normalizeNewsletter(value: unknown): NewsletterBannerSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    visible: row.visible !== false,
    title: asText(row.title, DEFAULT_NEWSLETTER_BANNER.title, 120),
    description: asText(row.description, DEFAULT_NEWSLETTER_BANNER.description, 300),
  }
}

export function normalizeContentSections(value: unknown): ContentSections {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    blogs: normalizeStory(row.blogs, DEFAULT_BLOGS),
    mediaUpdates: normalizeStory(row.mediaUpdates, DEFAULT_MEDIA_UPDATES),
    latestNews: normalizeStory(row.latestNews, DEFAULT_LATEST_NEWS),
    testimonials: normalizeTestimonials(row.testimonials),
    donateCta: normalizeDonateCta(row.donateCta),
    newsletterBanner: normalizeNewsletter(row.newsletterBanner),
  }
}
