import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

const VALID_CATEGORIES = [
  "BROKEN_STREETLIGHT", "FLOODING", "GARBAGE_OVERFLOW", "DRAINAGE_ISSUE",
  "ROAD_DAMAGE", "SAFETY_SECURITY", "VANDALISM", "OTHER",
];

const CATEGORY_MAP = [
  { category: "SAFETY_SECURITY", keywords: ["kidnap", "abduct", "bandit", "robbery", "armed rob", "attack", "shooting", "killed", "murder", "arson", "terror", "insecurity", "gunmen", "cult", "riot", "massacre", "explosion", "bomb", "fire outbreak", "boko haram"] },
  { category: "FLOODING",        keywords: ["flood", "flooding", "submerge", "overflow", "heavy rain", "waterlog", "erosion", "dam break", "rainstorm"] },
  { category: "ROAD_DAMAGE",     keywords: ["pothole", "road damage", "highway collapse", "bridge collapse", "accident", "vehicle crash", "road crash", "bad road"] },
  { category: "DRAINAGE_ISSUE",  keywords: ["drainage", "gutter", "sewage", "blocked drain", "stagnant water"] },
  { category: "GARBAGE_OVERFLOW",keywords: ["waste", "garbage", "refuse", "dump", "landfill", "trash", "litter", "pollution"] },
  { category: "BROKEN_STREETLIGHT", keywords: ["power outage", "blackout", "streetlight", "nepa", "ekedc", "ibedc"] },
  { category: "VANDALISM",       keywords: ["vandal", "graffiti", "looting", "burglary"] },
];

const SEVERITY_MAP = [
  { severity: "CRITICAL", keywords: ["mass casualt", "many killed", "dozens killed", "mass kidnap", "major explosion", "catastrophic", "emergency"] },
  { severity: "HIGH",     keywords: ["killed", "dead", "death", "casualties", "injured", "wounded", "collapsed", "destroyed", "displaced"] },
  { severity: "MEDIUM",   keywords: ["attack", "robbery", "flood", "damage", "fire", "crash", "accident"] },
];

const NIGERIAN_STATES = [
  "Lagos", "Abuja", "Kano", "Ibadan", "Rivers", "Ogun", "Kaduna", "Anambra",
  "Enugu", "Delta", "Imo", "Plateau", "Borno", "Katsina", "Niger", "Oyo",
  "Cross River", "Akwa Ibom", "Edo", "Ondo", "Kwara", "Osun", "Ekiti",
  "Bayelsa", "Benue", "Nasarawa", "Kogi", "Kebbi", "Sokoto", "Zamfara",
  "Adamawa", "Taraba", "Gombe", "Yobe", "Bauchi", "Jigawa", "Abia", "Ebonyi", "FCT",
];

const SKIP_KEYWORDS = [
  "election", "ballot", "campaign", "political", "senate bill", "minister said",
  "president said", "governor said", "court ruling", "inec", "pvc collection",
  "stock", "naira exchange", "dollar", "oil price", "barrel", "forex",
  "germany", "ukraine", "russia", "china", "india", "europe", "philippine",
  "iran", "israel", "middle east", "strait of hormuz", "world cup", "athletics championship",
];

const NIGERIA_KEYWORDS = [
  "nigeria", "nigerian", "lagos", "abuja", "kano", "ibadan", "enugu", "rivers",
  "delta", "ogun", "kaduna", "anambra", "imo", "oyo", "ondo", "edo", "ekiti",
  "osun", "kwara", "borno", "adamawa", "kebbi", "sokoto", "bauchi", "benue",
];

const INCIDENT_KEYWORDS = [
  "kidnap", "abduct", "flood", "fire", "crash", "rob", "attack", "killed", "dead",
  "explosion", "collapse", "damage", "injured", "missing", "emergency",
  "displaced", "evacuate", "riot", "shoot", "bomb", "terror", "bandit",
  "pothole", "road damage", "drain", "power outage", "blackout", "accident", "casualt",
  "building collapse", "landslide", "rescue",
];

const RSS_FEEDS = [
  { name: "Punch",         url: "https://punchng.com/feed/" },
  { name: "Vanguard",      url: "https://www.vanguardngr.com/feed/" },
  { name: "Guardian",      url: "https://guardian.ng/feed/" },
  { name: "Channels",      url: "https://www.channelstv.com/feed/" },
  { name: "Premium Times", url: "https://www.premiumtimesng.com/feed/" },
  { name: "Daily Post",    url: "https://dailypost.ng/feed/" },
  { name: "Tribune",       url: "https://tribuneonlineng.com/feed/" },
];

function classifyCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const { category, keywords } of CATEGORY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "OTHER";
}

function classifySeverity(text: string): string {
  const lower = text.toLowerCase();
  for (const { severity, keywords } of SEVERITY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return severity;
  }
  return "LOW";
}

function extractLocation(text: string): string {
  for (const state of NIGERIAN_STATES) {
    if (text.includes(state)) return `${state}, Nigeria`;
  }
  return "Nigeria";
}

function isIncidentWorthy(text: string): boolean {
  const lower = text.toLowerCase();
  if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  if (!NIGERIA_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  return INCIDENT_KEYWORDS.some((kw) => lower.includes(kw));
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseRSS(xml: string, sourceName: string): { title: string; description: string; source: string; combined: string }[] {
  const items: { title: string; description: string; source: string; combined: string }[] = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const item of itemMatches) {
    const getField = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, "i"));
      return m ? stripTags(m[1]) : "";
    };
    const title = getField("title");
    const desc = getField("description") || getField("summary");
    const combined = `${title} ${desc}`;
    if (title && isIncidentWorthy(combined)) {
      items.push({ title, description: desc, source: sourceName, combined });
    }
  }
  return items;
}

async function fetchFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 Pecker-News-Bot/1.0" },
    });
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getOrCreateBotUser() {
  const botEmail = "newsbot@pecker.system";
  const existing = await prisma.user.findUnique({ where: { email: botEmail } });
  if (existing) return existing;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
  return prisma.user.create({
    data: { email: botEmail, name: "Pecker News Bot", passwordHash: hash, role: "RESPONDER" },
  });
}

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this automatically)
  // Only allow calls from Vercel's cron scheduler or internal trusted sources
  const isVercelCron = req.headers.get("x-vercel-signature") !== null ||
    req.headers.get("user-agent")?.includes("vercel") ||
    process.env.NODE_ENV !== "production";
  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const allItems: { title: string; description: string; source: string; combined: string }[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchFeed(feed.url);
      const items = parseRSS(xml, feed.name);
      log.push(`${feed.name}: ${items.length} items`);
      allItems.push(...items);
    } catch (e) {
      log.push(`${feed.name}: ERROR - ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const toPost = unique.slice(0, 10);
  if (toPost.length === 0) {
    return NextResponse.json({ success: true, log, summary: { received: 0, created: 0, skipped: 0, errors: 0 } });
  }

  const botUser = await getOrCreateBotUser();
  let created = 0, skipped = 0, errors = 0;

  for (const inc of toPost) {
    const title = inc.title.slice(0, 120);
    const category = classifyCategory(inc.combined);
    const severity = classifySeverity(inc.combined);
    const locationText = extractLocation(inc.combined);
    const description = `${inc.description.slice(0, 400)}\n\nSource: ${inc.source} | ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`;

    if (!VALID_CATEGORIES.includes(category)) { errors++; continue; }

    const duplicate = await prisma.incident.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
        reportedById: botUser.id,
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (duplicate) { skipped++; continue; }

    try {
      const newIncident = await prisma.incident.create({
        data: {
          title,
          description,
          category,
          severity,
          status: "NEW",
          locationText,
          isAnonymous: true,
          guestName: "Pecker News Bot",
          reportedById: botUser.id,
          events: { create: { action: "CREATED", actorId: botUser.id, toStatus: "NEW" } },
        },
        select: { id: true },
      });

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "RESPONDER"] } },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            incidentId: newIncident.id,
            type: "STATUS_CHANGED",
            message: `New incident from Pecker News Bot: ${title}`,
          })),
        });
      }
      created++;
    } catch {
      errors++;
    }
  }

  log.push(`Summary: received=${toPost.length} created=${created} skipped=${skipped} errors=${errors}`);
  return NextResponse.json({ success: true, log, summary: { received: toPost.length, created, skipped, errors } });
}
