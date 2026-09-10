#!/usr/bin/env node
/**
 * Pecker News Bot — Daily Nigerian Incident Reporter
 *
 * Fetches verified incident news from Nigerian sources via RSS/scraping,
 * classifies them, and posts to Pecker via the bot API.
 *
 * Run: node pecker-news-bot.js
 * Schedule: Windows Task Scheduler, daily at 8am
 */

const https = require("https");
const http = require("http");
const { DOMParser } = require("@xmldom/xmldom");

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const PECKER_API = "https://pecker-app.vercel.app/api/bot/report";
const BOT_SECRET = "415358849e7b1d02a08413b9bae33247c2b6827d7ba474a3689e2e1fe97a7b2c";
const MAX_INCIDENTS_PER_RUN = 10;
const LOG_FILE = require("path").join(__dirname, "pecker-bot.log");

// Nigerian news RSS feeds (free, no auth needed)
const RSS_FEEDS = [
  { name: "Punch",      url: "https://punchng.com/feed/" },
  { name: "Vanguard",   url: "https://www.vanguardngr.com/feed/" },
  { name: "Guardian",   url: "https://guardian.ng/feed/" },
  { name: "Channels",   url: "https://www.channelstv.com/feed/" },
  { name: "Premium Times", url: "https://www.premiumtimesng.com/feed/" },
  { name: "Daily Post", url: "https://dailypost.ng/feed/" },
  { name: "Tribune",    url: "https://tribuneonlineng.com/feed/" },
];

// ─── CLASSIFICATION ──────────────────────────────────────────────────────────
const CATEGORY_MAP = [
  { category: "SAFETY_SECURITY", keywords: ["kidnap", "abduct", "bandit", "robbery", "armed rob", "attack", "shooting", "killed", "murder", "arson", "terror", "insecurity", "gunmen", "cult", "riot", "massacre", "explosion", "bomb", "fire outbreak", "boko haram", "fulani herders"] },
  { category: "FLOODING",        keywords: ["flood", "flooding", "submerge", "overflow", "heavy rain", "waterlog", "erosion", "dam break", "water level", "displacement", "rainstorm"] },
  { category: "ROAD_DAMAGE",     keywords: ["pothole", "road damage", "highway collapse", "bridge collapse", "accident", "vehicle crash", "road crash", "traffic", "bad road"] },
  { category: "DRAINAGE_ISSUE",  keywords: ["drainage", "gutter", "sewage", "blocked drain", "stagnant water", "water supply"] },
  { category: "GARBAGE_OVERFLOW",keywords: ["waste", "garbage", "refuse", "dump", "landfill", "trash", "litter", "pollution"] },
  { category: "BROKEN_STREETLIGHT", keywords: ["power outage", "blackout", "electricity", "streetlight", "nepa", "ekedc", "ibedc"] },
  { category: "VANDALISM",       keywords: ["vandal", "graffiti", "looting", "theft", "steal", "broke into", "burglary"] },
];

const SEVERITY_MAP = [
  { severity: "CRITICAL", keywords: ["mass casualt", "many killed", "dozens killed", "mass kidnap", "major explosion", "dam breaks", "catastrophic", "emergency"] },
  { severity: "HIGH",     keywords: ["killed", "dead", "death", "casualties", "injured", "wounded", "collapsed", "destroyed", "displaced"] },
  { severity: "MEDIUM",   keywords: ["attack", "robbery", "flood", "damage", "fire", "crash", "accident"] },
];

// Nigerian states for location extraction
const NIGERIAN_STATES = [
  "Lagos", "Abuja", "Kano", "Ibadan", "Rivers", "Ogun", "Kaduna", "Anambra",
  "Enugu", "Delta", "Imo", "Plateau", "Borno", "Katsina", "Niger", "Oyo",
  "Cross River", "Akwa Ibom", "Edo", "Ondo", "Kwara", "Osun", "Ekiti",
  "Bayelsa", "Benue", "Nasarawa", "Kogi", "Kebbi", "Sokoto", "Zamfara",
  "Adamawa", "Taraba", "Gombe", "Yobe", "Bauchi", "Jigawa", "Abia",
  "Ebonyi", "FCT", "Abuja FCT",
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  require("fs").appendFileSync(LOG_FILE, line + "\n");
}

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const timer = setTimeout(() => reject(new Error(`Timeout: ${url}`)), timeoutMs);
    client.get(url, { headers: { "User-Agent": "Mozilla/5.0 Pecker-News-Bot/1.0" } }, (res) => {
      clearTimeout(timer);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", (err) => { clearTimeout(timer); reject(err); });
  });
}

function classifyCategory(text) {
  const lower = text.toLowerCase();
  for (const { category, keywords } of CATEGORY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "OTHER";
}

function classifySeverity(text) {
  const lower = text.toLowerCase();
  for (const { severity, keywords } of SEVERITY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return severity;
  }
  return "LOW";
}

function extractLocation(text) {
  for (const state of NIGERIAN_STATES) {
    if (text.includes(state)) return `${state}, Nigeria`;
  }
  return "Nigeria";
}

// Keywords that indicate this is NOT a local incident (skip these)
const SKIP_KEYWORDS = [
  "election", "vote", "ballot", "campaign", "political", "senate", "minister",
  "president said", "governor said", "court", "inec", "pvc", "tribunal",
  "stock", "naira", "dollar", "oil price", "barrel", "forex", "economy",
  "germany", "ukraine", "russia", "us ", "china", "india", "europe", "philippine",
  "iran", "israel", "middle east", "strait of hormuz",
];

function isIncidentWorthy(text) {
  const lower = text.toLowerCase();
  // Skip political / international / financial stories
  if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  // Must mention Nigeria or a Nigerian location
  const nigeriaKeywords = ["nigeria", "nigerian", "lagos", "abuja", "kano", "ibadan",
    "enugu", "rivers", "delta", "ogun", "kaduna", "anambra", "imo", "oyo", "ondo",
    "edo", "ekiti", "osun", "kwara", "borno", "adamawa", "kebbi", "sokoto", "bauchi"];
  if (!nigeriaKeywords.some((kw) => lower.includes(kw))) return false;
  // Must match at least one incident keyword
  const incidentKeywords = [
    "kidnap", "abduct", "flood", "fire", "crash", "rob", "attack", "killed", "dead",
    "explosion", "collapse", "damage", "injured", "missing", "emergency",
    "displaced", "evacuate", "riot", "shoot", "bomb", "terror", "bandit",
    "pothole", "road damage", "drain", "waste", "power outage", "blackout",
    "building collapse", "landslide", "accident", "casualt",
  ];
  return incidentKeywords.some((kw) => lower.includes(kw));
}

function parseRSS(xml, sourceName) {
  const items = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const nodes = doc.getElementsByTagName("item");
    for (let i = 0; i < nodes.length; i++) {
      const item = nodes[i];
      const getText = (tag) => {
        const el = item.getElementsByTagName(tag)[0];
        return el ? (el.textContent || el.innerHTML || "").replace(/<[^>]+>/g, "").trim() : "";
      };
      const title = getText("title");
      const desc = getText("description") || getText("summary");
      const combined = `${title} ${desc}`;
      if (title && isIncidentWorthy(combined)) {
        items.push({ title, description: desc, source: sourceName, combined });
      }
    }
  } catch (e) {
    log(`RSS parse error (${sourceName}): ${e.message}`);
  }
  return items;
}

async function postToPecker(incidents) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ incidents });
    const options = {
      hostname: "pecker-app.vercel.app",
      path: "/api/bot/report",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BOT_SECRET}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ success: false, raw: data }); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== Pecker News Bot starting ===");
  const allItems = [];

  // Fetch from each RSS feed
  for (const feed of RSS_FEEDS) {
    log(`Fetching ${feed.name}...`);
    try {
      const xml = await fetchUrl(feed.url, 12000);
      const items = parseRSS(xml, feed.name);
      log(`  Found ${items.length} incident-worthy items from ${feed.name}`);
      allItems.push(...items);
    } catch (err) {
      log(`  ERROR fetching ${feed.name}: ${err.message}`);
    }
  }

  log(`Total candidate items: ${allItems.length}`);
  if (allItems.length === 0) {
    log("No incidents found today. Exiting.");
    return;
  }

  // Deduplicate by title similarity (simple exact-title check)
  const seen = new Set();
  const unique = allItems.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Build Pecker incident payloads
  const toPost = unique.slice(0, MAX_INCIDENTS_PER_RUN).map((item) => {
    const category = classifyCategory(item.combined);
    const severity = classifySeverity(item.combined);
    const locationText = extractLocation(item.combined);

    // Trim title to 120 chars
    const title = item.title.slice(0, 120);
    // Build description with source attribution
    const rawDesc = item.description.replace(/\s+/g, " ").slice(0, 400);
    const description = `${rawDesc}\n\nSource: ${item.source} | ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`;

    return { title, description, category, severity, locationText };
  });

  log(`Posting ${toPost.length} incidents to Pecker...`);

  // Log what we're posting
  toPost.forEach((inc, i) => {
    log(`  [${i + 1}] [${inc.category}/${inc.severity}] ${inc.title.slice(0, 80)}`);
  });

  const result = await postToPecker(toPost);

  if (result.success) {
    const { received, created, skipped, errors } = result.summary;
    log(`SUCCESS: received=${received} created=${created} skipped=${skipped} errors=${errors}`);
    if (result.results) {
      result.results.forEach((r) => {
        log(`  ${r.status.toUpperCase().padEnd(8)} ${r.title.slice(0, 70)}${r.reason ? ` (${r.reason})` : ""}`);
      });
    }
  } else {
    log(`FAILED: ${JSON.stringify(result)}`);
  }

  log("=== Pecker News Bot done ===\n");
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
