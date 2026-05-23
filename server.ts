import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './data/db';
import * as cheerio from 'cheerio';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const POLICY_KB_FILE = path.join(__dirname, 'data', 'policy_kb.json');
const POLICY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────────────────────────
// DAILY SCAN LIMIT — configurable via DAILY_SCAN_LIMIT env var (default: 50)
// ─────────────────────────────────────────────────────────────────────────────
function getDailyScanLimit(): number {
  dotenv.config({ override: true });
  const raw = process.env.DAILY_SCAN_LIMIT;
  const parsed = parseInt(raw || '50', 10);
  return isNaN(parsed) || parsed < 1 ? 50 : parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-FLIGHT DEDUPLICATION — prevents concurrent scans from same user
// ─────────────────────────────────────────────────────────────────────────────
const inFlightScans = new Map<string, number>(); // userId → timestamp

function isUserScanning(userId: string): boolean {
  const ts = inFlightScans.get(userId);
  if (!ts) return false;
  // Auto-expire stale entries after 5 minutes (handles crashes)
  if (Date.now() - ts > 5 * 60 * 1000) { inFlightScans.delete(userId); return false; }
  return true;
}

function markUserScanning(userId: string) { inFlightScans.set(userId, Date.now()); }
function clearUserScanning(userId: string) { inFlightScans.delete(userId); }

// ─────────────────────────────────────────────────────────────────────────────
// KEY DIAGNOSTICS — safe helpers (never log full keys)
// ─────────────────────────────────────────────────────────────────────────────
function keyHash(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 12) + '…';
}
function keyMask(key: string): string {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '…' + key.slice(-4);
}

function validateProviderKey(provider: string, key: string): { valid: boolean; warning?: string } {
  if (!key || key.length < 5) return { valid: false, warning: 'Key is empty or too short' };
  if (key.startsWith('MY_')) return { valid: false, warning: 'Key is still the placeholder value from .env.example' };
  if (provider === 'grok' && key.startsWith('gsk_')) {
    return { valid: false, warning: 'GROK_API_KEY appears to be a Groq key (starts with gsk_). xAI Grok keys start with xai-. These are different providers.' };
  }
  if (provider === 'grok' && !key.startsWith('xai-')) {
    return { valid: true, warning: 'GROK_API_KEY does not start with xai- — verify this is a valid xAI key.' };
  }
  if (provider === 'gemini' && !key.startsWith('AIzaSy')) {
    return { valid: true, warning: 'GEMINI_API_KEY does not start with AIzaSy — verify this is a valid Google AI key.' };
  }
  return { valid: true };
}

function logProviderSelection(provider: string, key: string, requestId: string) {
  const validation = validateProviderKey(provider, key);
  const status = validation.valid ? 'OK' : 'WARN';
  console.log(`[${requestId}] Provider: ${provider} | Key: ${keyMask(key)} | SHA256: ${keyHash(key)} | ${status}${validation.warning ? ' | ' + validation.warning : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF — handles AI provider 429 / 503 responses
// ─────────────────────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 2000, label = 'AI call' } = opts;
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const is429 = err.message?.includes('429') || err.status === 429;
      const is503 = err.message?.includes('503') || err.status === 503;
      if (attempt < maxAttempts && (is429 || is503)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.log(`[RETRY] ${label} attempt ${attempt}/${maxAttempts} failed (${is429 ? '429' : '503'}) — retrying in ${delay / 1000}s`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

function makeRequestId(): string {
  return 'req_' + crypto.randomBytes(4).toString('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// POLICY KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────

interface PolicyRule {
  rule_id: string;
  platform: string;
  category: string;
  restriction: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PolicyKB {
  rules: PolicyRule[];
  last_updated: number;
}

// Comprehensive base rules — refreshed by live fetch when possible
const BASE_POLICY_RULES: PolicyRule[] = [
  // META ── Financial
  { rule_id: 'META_FIN_01', platform: 'Meta', category: 'Financial Services', restriction: 'No guaranteed income, profit, or investment return claims', severity: 'CRITICAL' },
  { rule_id: 'META_FIN_02', platform: 'Meta', category: 'Financial Services', restriction: 'No get-rich-quick schemes, MLM without disclosure, or misleading income opportunities', severity: 'CRITICAL' },
  { rule_id: 'META_FIN_03', platform: 'Meta', category: 'Financial Services', restriction: 'Cryptocurrency ads require prior written permission from Meta', severity: 'HIGH' },
  { rule_id: 'META_FIN_04', platform: 'Meta', category: 'Financial Services', restriction: 'Pay-day loans and short-term high-interest credit are prohibited', severity: 'HIGH' },
  // META ── Health & Wellness
  { rule_id: 'META_HEALTH_01', platform: 'Meta', category: 'Health & Wellness', restriction: 'No disease cure, treatment, or prevention claims without medical evidence', severity: 'CRITICAL' },
  { rule_id: 'META_HEALTH_02', platform: 'Meta', category: 'Health & Wellness', restriction: 'No unrealistic before-and-after transformation images', severity: 'HIGH' },
  { rule_id: 'META_HEALTH_03', platform: 'Meta', category: 'Health & Wellness', restriction: 'Weight-loss claims must be realistic, evidence-based, and include disclaimer', severity: 'HIGH' },
  { rule_id: 'META_HEALTH_04', platform: 'Meta', category: 'Health & Wellness', restriction: 'Supplements may not claim to diagnose, cure, or treat any disease', severity: 'CRITICAL' },
  // META ── Misleading / Deceptive
  { rule_id: 'META_MISLEAD_01', platform: 'Meta', category: 'Misleading Content', restriction: 'No false urgency, fake countdown timers, or artificial scarcity claims', severity: 'HIGH' },
  { rule_id: 'META_MISLEAD_02', platform: 'Meta', category: 'Misleading Content', restriction: 'No fabricated testimonials, fake reviews, or staged before/after content', severity: 'HIGH' },
  { rule_id: 'META_MISLEAD_03', platform: 'Meta', category: 'Misleading Content', restriction: 'No misleading pricing, hidden fees, or subscription traps', severity: 'HIGH' },
  { rule_id: 'META_MISLEAD_04', platform: 'Meta', category: 'Misleading Content', restriction: 'No superlative claims (#1, best, fastest) without verifiable evidence', severity: 'MEDIUM' },
  // META ── Personal Attributes
  { rule_id: 'META_ATTR_01', platform: 'Meta', category: 'Personal Attributes', restriction: 'Cannot imply knowledge of personal health, financial, race, religion, or political attributes', severity: 'HIGH' },
  // META ── Prohibited Products
  { rule_id: 'META_PROHIB_01', platform: 'Meta', category: 'Prohibited Products', restriction: 'Tobacco, cigarettes, e-cigarettes, and vaping products are prohibited', severity: 'CRITICAL' },
  { rule_id: 'META_PROHIB_02', platform: 'Meta', category: 'Prohibited Products', restriction: 'Illegal drugs, drug paraphernalia, and controlled substances are prohibited', severity: 'CRITICAL' },
  { rule_id: 'META_PROHIB_03', platform: 'Meta', category: 'Prohibited Products', restriction: 'Weapons, ammunition, and explosives are prohibited', severity: 'CRITICAL' },
  // META ── Landing Page Quality
  { rule_id: 'META_LAND_01', platform: 'Meta', category: 'Landing Page', restriction: 'Landing page content must match the ad and be fully functional', severity: 'HIGH' },
  { rule_id: 'META_LAND_02', platform: 'Meta', category: 'Landing Page', restriction: 'Must have a working, accessible privacy policy', severity: 'MEDIUM' },
  { rule_id: 'META_LAND_03', platform: 'Meta', category: 'Landing Page', restriction: 'No interstitial pop-ups or overlays that prevent access to content', severity: 'MEDIUM' },
  { rule_id: 'META_LAND_04', platform: 'Meta', category: 'Landing Page', restriction: 'No cloaking — ad destination must match what reviewers see', severity: 'CRITICAL' },

  // GOOGLE ── Misrepresentation
  { rule_id: 'GOOGLE_MISLEAD_01', platform: 'Google', category: 'Misrepresentation', restriction: 'No false claims about products, services, or the advertiser', severity: 'CRITICAL' },
  { rule_id: 'GOOGLE_MISLEAD_02', platform: 'Google', category: 'Misrepresentation', restriction: 'No unrealistic promises, guarantees, or exaggerated claims of effectiveness', severity: 'HIGH' },
  { rule_id: 'GOOGLE_MISLEAD_03', platform: 'Google', category: 'Misrepresentation', restriction: 'Business must clearly and accurately represent itself and its business model', severity: 'HIGH' },
  { rule_id: 'GOOGLE_MISLEAD_04', platform: 'Google', category: 'Misrepresentation', restriction: 'No omission of material information that would affect purchasing decisions', severity: 'HIGH' },
  // GOOGLE ── Financial
  { rule_id: 'GOOGLE_FIN_01', platform: 'Google', category: 'Financial Services', restriction: 'No guaranteed investment returns or unrealistic financial performance claims', severity: 'CRITICAL' },
  { rule_id: 'GOOGLE_FIN_02', platform: 'Google', category: 'Financial Services', restriction: 'Crypto exchange and wallet ads require Google certification', severity: 'HIGH' },
  { rule_id: 'GOOGLE_FIN_03', platform: 'Google', category: 'Financial Services', restriction: 'Trading signal services and investment advisory require appropriate licenses', severity: 'HIGH' },
  // GOOGLE ── Healthcare
  { rule_id: 'GOOGLE_HEALTH_01', platform: 'Google', category: 'Healthcare', restriction: 'Unapproved drugs, supplements with disease claims, and miracle cures are prohibited', severity: 'CRITICAL' },
  { rule_id: 'GOOGLE_HEALTH_02', platform: 'Google', category: 'Healthcare', restriction: 'Clinical trials and healthcare requires LegitScript certification', severity: 'HIGH' },
  // GOOGLE ── Prohibited
  { rule_id: 'GOOGLE_PROHIB_01', platform: 'Google', category: 'Prohibited', restriction: 'Counterfeit goods, enabling dishonest behavior, and dangerous products prohibited', severity: 'CRITICAL' },
  // GOOGLE ── Landing Page
  { rule_id: 'GOOGLE_LAND_01', platform: 'Google', category: 'Landing Page', restriction: 'Landing page must be fully functional, easy to navigate, and match ad intent', severity: 'HIGH' },
  { rule_id: 'GOOGLE_LAND_02', platform: 'Google', category: 'Landing Page', restriction: 'Must provide accurate contact information and business details', severity: 'MEDIUM' },

  // TIKTOK ── Misleading
  { rule_id: 'TIKTOK_MISLEAD_01', platform: 'TikTok', category: 'Misleading Ads', restriction: 'No false, deceptive, or misleading claims about products or services', severity: 'CRITICAL' },
  { rule_id: 'TIKTOK_MISLEAD_02', platform: 'TikTok', category: 'Misleading Ads', restriction: 'No fabricated social proof, fake engagement metrics, or staged results', severity: 'HIGH' },
  { rule_id: 'TIKTOK_MISLEAD_03', platform: 'TikTok', category: 'Misleading Ads', restriction: 'No exaggerated or unsubstantiated product effectiveness claims', severity: 'HIGH' },
  // TIKTOK ── Financial
  { rule_id: 'TIKTOK_FIN_01', platform: 'TikTok', category: 'Financial Services', restriction: 'No guaranteed investment returns or get-rich-quick promises', severity: 'CRITICAL' },
  { rule_id: 'TIKTOK_FIN_02', platform: 'TikTok', category: 'Financial Services', restriction: 'Cryptocurrency trading platforms restricted in most regions', severity: 'HIGH' },
  { rule_id: 'TIKTOK_FIN_03', platform: 'TikTok', category: 'Financial Services', restriction: 'Financial services require appropriate local licensing and disclosure', severity: 'HIGH' },
  // TIKTOK ── Health
  { rule_id: 'TIKTOK_HEALTH_01', platform: 'TikTok', category: 'Health', restriction: 'No cure or treatment claims for medical conditions without clinical evidence', severity: 'CRITICAL' },
  { rule_id: 'TIKTOK_HEALTH_02', platform: 'TikTok', category: 'Health', restriction: 'Weight loss ads must follow specific platform guidelines and include disclaimers', severity: 'HIGH' },
  // TIKTOK ── Prohibited
  { rule_id: 'TIKTOK_PROHIB_01', platform: 'TikTok', category: 'Prohibited Products', restriction: 'Tobacco, weapons, illegal substances, and adult products are prohibited', severity: 'CRITICAL' },

  // SNAPCHAT ── Misleading
  { rule_id: 'SNAP_MISLEAD_01', platform: 'Snapchat', category: 'Misleading Content', restriction: 'No deceptive, false, or misleading claims about any product or service', severity: 'HIGH' },
  { rule_id: 'SNAP_MISLEAD_02', platform: 'Snapchat', category: 'Misleading Content', restriction: 'No fake urgency, fake scarcity, or manipulative persuasion techniques', severity: 'HIGH' },
  // SNAPCHAT ── Financial
  { rule_id: 'SNAP_FIN_01', platform: 'Snapchat', category: 'Financial Services', restriction: 'No guaranteed income or unrealistic financial return claims', severity: 'CRITICAL' },
  { rule_id: 'SNAP_FIN_02', platform: 'Snapchat', category: 'Financial Services', restriction: 'Crypto and investment products require prior Snapchat approval', severity: 'HIGH' },
  // SNAPCHAT ── Prohibited
  { rule_id: 'SNAP_PROHIB_01', platform: 'Snapchat', category: 'Prohibited Products', restriction: 'Weapons, tobacco, illegal drugs, and dangerous products prohibited', severity: 'CRITICAL' },
  { rule_id: 'SNAP_PROHIB_02', platform: 'Snapchat', category: 'Prohibited Products', restriction: 'Age-restricted products must verify audience is of appropriate age', severity: 'HIGH' },
  // SNAPCHAT ── Landing Page
  { rule_id: 'SNAP_LAND_01', platform: 'Snapchat', category: 'Landing Page', restriction: 'Landing page must be accessible, functional, and match the ad content', severity: 'HIGH' },
];

let cachedPolicyKB: PolicyKB | null = null;

function loadPolicyKB(): PolicyKB {
  if (cachedPolicyKB && Date.now() - cachedPolicyKB.last_updated < POLICY_TTL_MS) {
    return cachedPolicyKB;
  }
  try {
    if (fs.existsSync(POLICY_KB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(POLICY_KB_FILE, 'utf-8')) as PolicyKB;
      if (Date.now() - raw.last_updated < POLICY_TTL_MS) {
        cachedPolicyKB = raw;
        return raw;
      }
    }
  } catch (_) {}
  // Fall back to base rules
  const kb: PolicyKB = { rules: BASE_POLICY_RULES, last_updated: Date.now() };
  savePolicyKB(kb);
  return kb;
}

function savePolicyKB(kb: PolicyKB) {
  try {
    if (!fs.existsSync(path.dirname(POLICY_KB_FILE))) {
      fs.mkdirSync(path.dirname(POLICY_KB_FILE), { recursive: true });
    }
    fs.writeFileSync(POLICY_KB_FILE, JSON.stringify(kb, null, 2));
    cachedPolicyKB = kb;
  } catch (_) {}
}

async function fetchAndAugmentPolicies(generateAI: Function): Promise<PolicyRule[]> {
  const policyUrls = [
    { platform: 'Meta', url: 'https://www.facebook.com/policies/ads/' },
    { platform: 'Google', url: 'https://support.google.com/adspolicy/answer/6008942' },
  ];
  const augmentedRules: PolicyRule[] = [...BASE_POLICY_RULES];
  for (const src of policyUrls) {
    try {
      const resp = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ComplianceBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const $ = cheerio.load(html);
      $('script, style').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 6000);
      if (text.length < 100) continue;
      const aiText = await generateAI({
        systemInstruction: `Extract ad policy rules from the following policy page text for ${src.platform}. Return JSON array of rules.`,
        promptContent: `Policy text:\n${text}`,
        geminiSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rule_id: { type: Type.STRING },
              platform: { type: Type.STRING },
              category: { type: Type.STRING },
              restriction: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ['rule_id', 'platform', 'category', 'restriction', 'severity'],
          },
        },
        plainJsonSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule_id: { type: 'string' },
              platform: { type: 'string' },
              category: { type: 'string' },
              restriction: { type: 'string' },
              severity: { type: 'string' },
            },
          },
        },
      });
      const parsed = JSON.parse(aiText);
      if (Array.isArray(parsed)) augmentedRules.push(...parsed.slice(0, 20));
    } catch (_) {}
  }
  return augmentedRules;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE CRAWLER (Phase 1)
// ─────────────────────────────────────────────────────────────────────────────

interface CrawledPage {
  url: string;
  page_type: string;
  text: string;
  images: Array<{ url: string; alt: string }>;
  links: string[];
  meta: Record<string, string>;
  schema_data: string;
  status: 'success' | 'failed';
  error?: string;
}

const PAGE_TYPE_KEYWORDS: Record<string, string[]> = {
  about: ['about', 'who-we-are', 'our-story', 'team', 'mission'],
  contact: ['contact', 'get-in-touch', 'reach-us', 'support', 'help'],
  pricing: ['pricing', 'plans', 'cost', 'buy', 'subscribe', 'order'],
  privacy: ['privacy', 'privacy-policy', 'data-policy'],
  terms: ['terms', 'tos', 'terms-of-service', 'terms-and-conditions'],
  refund: ['refund', 'return', 'cancellation', 'money-back'],
  shipping: ['shipping', 'delivery', 'fulfillment'],
  faq: ['faq', 'questions', 'frequently-asked'],
  products: ['products', 'services', 'shop', 'store', 'catalog'],
};

function detectPageType(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    for (const [type, keywords] of Object.entries(PAGE_TYPE_KEYWORDS)) {
      if (keywords.some(kw => pathname.includes(kw))) return type;
    }
    if (pathname === '/' || pathname === '') return 'home';
  } catch (_) {}
  return 'other';
}

async function crawlSinglePage(targetUrl: string, baseUrl: string): Promise<CrawledPage> {
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Meta tags
    const meta: Record<string, string> = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || '';
      const content = $(el).attr('content') || '';
      if (name && content) meta[name] = content.substring(0, 300);
    });

    // Schema.org
    const schemaParts: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      schemaParts.push(($(el).html() || '').substring(0, 1000));
    });

    // Links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        links.push(href);
      }
    });

    // Images
    const images: Array<{ url: string; alt: string }> = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
      const alt = $(el).attr('alt') || '';
      if (src && !src.startsWith('data:')) {
        try {
          images.push({ url: new URL(src, baseUrl).href, alt });
        } catch {
          images.push({ url: src, alt });
        }
      }
    });

    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    return {
      url: targetUrl,
      page_type: detectPageType(targetUrl),
      text,
      images: images.slice(0, 25),
      links,
      meta,
      schema_data: schemaParts.join('\n').substring(0, 2000),
      status: 'success',
    };
  } catch (err: any) {
    return {
      url: targetUrl,
      page_type: detectPageType(targetUrl),
      text: '',
      images: [],
      links: [],
      meta: {},
      schema_data: '',
      status: 'failed',
      error: err.message,
    };
  }
}

async function crawlWebsite(baseUrl: string): Promise<{
  pages: CrawledPage[];
  critical_pages_found: string[];
  missing_pages: string[];
}> {
  const MAX_PAGES = 12;
  const CRITICAL_TYPES = ['privacy', 'terms', 'contact', 'refund'];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return { pages: [], critical_pages_found: [], missing_pages: CRITICAL_TYPES };
  }

  // Crawl homepage first
  const home = await crawlSinglePage(baseUrl, baseUrl);
  pages.push(home);
  visited.add(baseUrl);

  // Build a prioritised queue from homepage links
  const priorityOrder = ['about', 'contact', 'pricing', 'privacy', 'terms', 'refund', 'faq', 'products', 'services', 'shipping'];
  const rawLinks = home.links
    .map(link => { try { return new URL(link, baseUrl).href; } catch { return null; } })
    .filter((l): l is string => !!l && l.startsWith(origin) && !visited.has(l));

  const uniqueLinks = [...new Set(rawLinks)];
  uniqueLinks.sort((a, b) => {
    const aScore = priorityOrder.findIndex(kw => a.toLowerCase().includes(kw)) > -1 ? 1 : 0;
    const bScore = priorityOrder.findIndex(kw => b.toLowerCase().includes(kw)) > -1 ? 1 : 0;
    return bScore - aScore;
  });

  for (const link of uniqueLinks) {
    if (pages.length >= MAX_PAGES) break;
    if (visited.has(link)) continue;
    visited.add(link);
    const page = await crawlSinglePage(link, baseUrl);
    pages.push(page);
    // Polite delay
    await new Promise(r => setTimeout(r, 250));
  }

  const foundTypes = pages.map(p => p.page_type);
  const critical_pages_found = CRITICAL_TYPES.filter(t => foundTypes.includes(t));
  const missing_pages = CRITICAL_TYPES.filter(t => !foundTypes.includes(t));

  return { pages, critical_pages_found, missing_pages };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHTED SCORING ENGINE (Phase 14)
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_SCORE: Record<string, number> = { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25 };
const BUSINESS_RISK_MAP: Record<string, number> = {
  ecommerce: 20, saas: 15, agency: 15, education: 25, coaching: 40,
  lead: 50, affiliate: 55, crypto: 85, finance: 65, health: 65,
  supplement: 75, nutraceutical: 75, gambling: 90, adult: 95, mlm: 80,
  'make money': 80, forex: 80, trading: 75,
};

function calculateWeightedScore(analysis: any, missing_pages: string[]) {
  const w = { business: 0.30, product: 0.20, claim: 0.15, platform: 0.15, trust: 0.10, dark: 0.05, tech: 0.05 };

  // Business risk
  const bizType = (analysis.business_model_type || '').toLowerCase();
  let businessRisk = 30;
  for (const [key, score] of Object.entries(BUSINESS_RISK_MAP)) {
    if (bizType.includes(key)) { businessRisk = score; break; }
  }

  // Product risk
  const products: any[] = analysis.product_classifications || [];
  let productRisk = 0;
  if (products.length > 0) {
    productRisk = Math.max(
      ...products.map(p => SEVERITY_SCORE[p.risk_level?.toUpperCase()] || (p.classification === 'BLACK_HAT' ? 95 : p.classification === 'GREY_HAT' ? 55 : 15))
    );
  }

  // Claim risk
  const claims: any[] = analysis.claim_violations || [];
  let claimRisk = 0;
  if (claims.length > 0) {
    const maxSev = Math.max(...claims.filter(c => c.violates).map(c => SEVERITY_SCORE[c.severity?.toUpperCase()] || 25));
    claimRisk = Math.min(100, maxSev + Math.min(25, claims.filter(c => c.violates).length * 5));
  }

  // Platform violations
  const issues: any[] = analysis.website_level_issues || [];
  let platformRisk = 0;
  if (issues.length > 0) {
    const maxSev = Math.max(...issues.map(i => SEVERITY_SCORE[i.severity?.toUpperCase()] || 25));
    platformRisk = Math.min(100, maxSev + Math.min(20, issues.length * 3));
  }

  // Trust deficiencies
  const missingPenalty = missing_pages.length * 18;
  const trustBonus = Math.min(30, (analysis.trust_signals || []).length * 6);
  const trustRisk = Math.min(100, Math.max(0, missingPenalty + 5 - trustBonus));

  // Dark patterns
  const darkPatterns: any[] = analysis.detected_dark_patterns || [];
  const darkRisk = Math.min(100, darkPatterns.length * 18);

  // Technical manipulation
  const evasion: any[] = analysis.policy_evasion_signals || [];
  const techRisk = Math.min(100, evasion.length * 28);

  const breakdown = {
    business_risk: Math.round(businessRisk),
    product_risk: Math.round(productRisk),
    claim_risk: Math.round(claimRisk),
    platform_violations: Math.round(platformRisk),
    trust_deficiencies: Math.round(trustRisk),
    dark_patterns_score: Math.round(darkRisk),
    technical_manipulation: Math.round(techRisk),
  };

  const total = Math.round(
    breakdown.business_risk * w.business +
    breakdown.product_risk * w.product +
    breakdown.claim_risk * w.claim +
    breakdown.platform_violations * w.platform +
    breakdown.trust_deficiencies * w.trust +
    breakdown.dark_patterns_score * w.dark +
    breakdown.technical_manipulation * w.tech
  );

  let risk_level = 'COMPLIANT';
  let overall_status = 'COMPLIANT';
  if (total > 80) { risk_level = 'CRITICAL'; overall_status = 'BLOCKED'; }
  else if (total > 60) { risk_level = 'HIGH_RISK'; overall_status = 'HIGH_RISK'; }
  else if (total > 40) { risk_level = 'WARNING'; overall_status = 'WARNING'; }
  else if (total > 20) { risk_level = 'LOW_RISK'; overall_status = 'WARNING'; }

  return { total, breakdown, risk_level, overall_status };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE ANALYSIS — AI PROMPT & SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

function buildEnterprisePrompt(allText: string, allImages: string, policyRules: PolicyRule[], missing_pages: string[]): string {
  const rulesText = policyRules.map(r => `[${r.rule_id}] ${r.platform} | ${r.category} | ${r.severity}: ${r.restriction}`).join('\n');
  return `
You are an Enterprise Advertising Compliance Intelligence System performing a comprehensive multi-phase audit.
Simulate how a real Meta, Google, TikTok, and Snapchat reviewer evaluates a business — not just the HTML, but the entire business, product, claims, trust signals, and user risk.

=== POLICY KNOWLEDGE BASE (${policyRules.length} active rules) ===
${rulesText}

=== MISSING CRITICAL PAGES ===
${missing_pages.length > 0 ? missing_pages.join(', ') : 'None detected'}

=== MULTI-PAGE WEBSITE CONTENT ===
${allText.substring(0, 22000)}

=== EXTRACTED IMAGES (URL | Alt text) ===
${allImages.substring(0, 3000)}

Perform ALL of the following analysis phases and return a single comprehensive JSON object:

PHASE 2 — BUSINESS INTELLIGENCE: Identify business type, revenue model, monetization method.
PHASE 3 — PRODUCT DETECTION: Identify every product/service sold. Assess risk level.
PHASE 6 — CLAIM EXTRACTION: Extract ALL marketing claims. Categorize as financial, medical, performance, educational, business, legal.
PHASE 7 — CLAIM vs POLICY MATCHING: For each claim, check against the policy rules above. Identify which platforms it violates and WHY. Reference the rule_id.
PHASE 8 — IMAGE ANALYSIS: For every image provided, perform deep analysis: OCR text detection, brand/logo detection, sensitive content, manipulative elements, platform violations.
PHASE 9 — USER JOURNEY SIMULATION: Based on DOM content, detect: forced email gates, hidden pricing, popup abuse, redirect indicators, cloaking patterns, upsell tactics.
PHASE 10 — TRUST & LEGITIMACY AUDIT: Check for phone, email, address, privacy policy, terms, refund policy, business registration signals. Generate trust_score (0-100, 100 = fully trusted).
PHASE 11 — DARK PATTERN DETECTION: Detect fake countdowns, FOMO manipulation, scarcity abuse, emotional manipulation (fear, shame, panic), misleading UI elements.
PHASE 12 — ENFORCEMENT PREDICTION: For Meta, Google, TikTok, Snapchat: predict risk_level (LOW/MEDIUM/HIGH/CRITICAL) and likely_action.
PHASE 13 — WEBSITE CLASSIFICATION: Classify as WHITE_HAT, GREY_HAT, or BLACK_HAT based on platform ad policies, consumer risk, and business legitimacy.
PHASE 15 — EVIDENCE REPORTING: For every significant violation, provide issue, severity, affected platforms, exact evidence quotes, why_it_matters, and recommended_fix.

CRITICAL RULES:
1. Never fabricate violations — only report what is present in the content.
2. Reference specific text evidence for every claim violation.
3. Be strict: even implied violations count.
4. Dark patterns include: fake "Only X left", live visitor counts, auto-renewing subscriptions buried in fine print.
5. Trust signals include: real phone number, physical address, BBB/Trustpilot badges, clear return policy, SSL indicators.
`;
}

function buildEnterpriseGeminiSchema() {
  const claimViolationSchema = {
    type: Type.OBJECT,
    properties: {
      claim: { type: Type.STRING },
      claim_type: { type: Type.STRING },
      violates: { type: Type.BOOLEAN },
      affected_platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      severity: { type: Type.STRING },
      why_it_matters: { type: Type.STRING },
      recommended_fix: { type: Type.STRING },
      evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['claim', 'claim_type', 'violates', 'affected_platforms', 'severity', 'why_it_matters', 'recommended_fix', 'evidence'],
  };

  const evidenceSchema = {
    type: Type.OBJECT,
    properties: {
      issue: { type: Type.STRING },
      severity: { type: Type.STRING },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
      why_it_matters: { type: Type.STRING },
      recommended_fix: { type: Type.STRING },
    },
    required: ['issue', 'severity', 'platforms', 'evidence', 'why_it_matters', 'recommended_fix'],
  };

  return {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      business_model_type: { type: Type.STRING },
      revenue_model: { type: Type.STRING },
      website_classification: { type: Type.STRING },
      trust_score: { type: Type.INTEGER },
      final_verdict: { type: Type.STRING },
      claim_violations: { type: Type.ARRAY, items: claimViolationSchema },
      images: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            image_id: { type: Type.STRING },
            image_url: { type: Type.STRING },
            description: { type: Type.STRING },
            ocr_text: { type: Type.STRING },
            detected_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
            policy_violations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  policy: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['platform', 'policy', 'reason'],
              },
            },
            severity: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            recommended_action: { type: Type.STRING },
            safe_for_ads: { type: Type.BOOLEAN },
          },
          required: ['image_id', 'image_url', 'description', 'ocr_text', 'detected_elements', 'policy_violations', 'severity', 'confidence', 'recommended_action', 'safe_for_ads'],
        },
      },
      product_classifications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            product_name: { type: Type.STRING },
            category: { type: Type.STRING },
            classification: { type: Type.STRING },
            risk_level: { type: Type.STRING },
            consumer_harm_risk: { type: Type.STRING },
            platform_compliance_risk: { type: Type.STRING },
            reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['product_name', 'category', 'classification', 'risk_level', 'consumer_harm_risk', 'platform_compliance_risk', 'reasoning'],
        },
      },
      website_level_issues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            issue: { type: Type.STRING },
            severity: { type: Type.STRING },
            description: { type: Type.STRING },
            remediation: { type: Type.STRING },
          },
          required: ['issue', 'severity', 'description', 'remediation'],
        },
      },
      platform_enforcement_risk: {
        type: Type.OBJECT,
        properties: {
          meta: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] },
          google: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] },
          tiktok: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] },
          snapchat: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] },
        },
        required: ['meta', 'google', 'tiktok', 'snapchat'],
      },
      detected_dark_patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
      scam_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      trust_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      policy_evasion_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      consumer_harm_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      final_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      evidence: { type: Type.ARRAY, items: evidenceSchema },
    },
    required: [
      'summary', 'business_model_type', 'revenue_model', 'website_classification',
      'trust_score', 'final_verdict', 'claim_violations', 'images',
      'product_classifications', 'website_level_issues', 'platform_enforcement_risk',
      'detected_dark_patterns', 'scam_signals', 'trust_signals',
      'policy_evasion_signals', 'consumer_harm_signals', 'final_recommendations', 'evidence',
    ],
  };
}

function buildEnterprisePlainSchema() {
  return {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      business_model_type: { type: 'string' },
      revenue_model: { type: 'string' },
      website_classification: { type: 'string' },
      trust_score: { type: 'integer' },
      final_verdict: { type: 'string' },
      claim_violations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            claim: { type: 'string' }, claim_type: { type: 'string' }, violates: { type: 'boolean' },
            affected_platforms: { type: 'array', items: { type: 'string' } },
            severity: { type: 'string' }, why_it_matters: { type: 'string' },
            recommended_fix: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      images: { type: 'array', items: { type: 'object' } },
      product_classifications: { type: 'array', items: { type: 'object' } },
      website_level_issues: { type: 'array', items: { type: 'object' } },
      platform_enforcement_risk: { type: 'object' },
      detected_dark_patterns: { type: 'array', items: { type: 'string' } },
      scam_signals: { type: 'array', items: { type: 'string' } },
      trust_signals: { type: 'array', items: { type: 'string' } },
      policy_evasion_signals: { type: 'array', items: { type: 'string' } },
      consumer_harm_signals: { type: 'array', items: { type: 'string' } },
      final_recommendations: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'object' } },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

function getUserId(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.substring(7);
  return 'anonymous';
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  function getAI(): GoogleGenAI | null {
    dotenv.config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.length < 20) return null;
    // New instance per call — never a stale singleton
    return new GoogleGenAI({ apiKey: key });
  }

  async function generateAIContent(options: {
    systemInstruction: string;
    promptContent: string;
    geminiSchema: any;
    plainJsonSchema: any;
    fallbackGeminiModel?: string;
    _requestId?: string;
  }): Promise<string> {
    // ── Re-read .env on EVERY call so key changes take effect immediately ──
    dotenv.config({ override: true });
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const requestId = options._requestId || makeRequestId();

    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY || '';
      const validation = validateProviderKey('gemini', key);
      if (!validation.valid) throw new Error(`Gemini key invalid: ${validation.warning}`);
      if (validation.warning) console.warn(`[${requestId}] Gemini key warning: ${validation.warning}`);
      logProviderSelection('gemini', key, requestId);

      const ai = getAI()!;
      return withRetry(async () => {
        const response = await ai.models.generateContent({
          model: options.fallbackGeminiModel || 'gemini-2.5-flash',
          contents: options.promptContent,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: options.geminiSchema,
          },
        });
        return response.text || '{}';
      }, { label: `Gemini/${options.fallbackGeminiModel || 'gemini-2.5-flash'}`, maxAttempts: 3, baseDelayMs: 3000 });
    }

    let apiKey = '', apiUrl = '', modelName = '';
    if (provider === 'groq') {
      apiKey = process.env.GROQ_API_KEY || '';
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const v = validateProviderKey('groq', apiKey);
      if (!v.valid) throw new Error(`Groq API Key invalid: ${v.warning}`);
    } else if (provider === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY || '';
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      modelName = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';
      const v = validateProviderKey('openrouter', apiKey);
      if (!v.valid) throw new Error(`OpenRouter API Key invalid: ${v.warning}`);
    } else if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const v = validateProviderKey('openai', apiKey);
      if (!v.valid) throw new Error(`OpenAI API Key invalid: ${v.warning}`);
    } else if (provider === 'grok') {
      apiKey = process.env.GROK_API_KEY || '';
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      modelName = process.env.GROK_MODEL || 'grok-2-latest';
      const v = validateProviderKey('grok', apiKey);
      if (!v.valid) throw new Error(`Grok (xAI) API Key invalid: ${v.warning}`);
      if (v.warning) console.warn(`[${requestId}] Grok key warning: ${v.warning}`);
    } else {
      throw new Error(`Unsupported AI Provider: "${provider}". Supported: gemini, groq, grok, openrouter, openai.`);
    }

    logProviderSelection(provider, apiKey, requestId);

    const enhancedSystem = `${options.systemInstruction}\n\nCRITICAL: Respond with a single valid JSON object matching the schema below. No markdown, no code fences.\n\n${JSON.stringify(options.plainJsonSchema, null, 2)}`;

    return withRetry(async () => {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Compliance.OS',
        },
        body: JSON.stringify({
          model: modelName,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: enhancedSystem },
            { role: 'user', content: options.promptContent },
          ],
          temperature: 0.1,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        // Preserve status code in error for retry logic
        const err: any = new Error(`AI API "${provider}" error (${resp.status}): ${errText}`);
        err.status = resp.status;
        throw err;
      }
      const result = await resp.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error(`AI API "${provider}" returned empty response.`);
      return content;
    }, { label: `${provider}/${modelName}`, maxAttempts: 3, baseDelayMs: 3000 });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const existing = db.users.find(username);
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const newUser = db.users.create({ username, password });
    return res.json({ id: newUser.id, username: newUser.username });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const user = db.users.find(username);
    if (!user || user.password !== password) return res.status(400).json({ error: 'Invalid credentials' });
    return res.json({ id: user.id, username: user.username });
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = getUserId(req);
    if (userId === 'anonymous') return res.status(401).json({ error: 'Unauthorized' });
    const user = db.users.findById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ id: user.id, username: user.username });
  });

  // ── Contact ───────────────────────────────────────────────────────────────

  app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });
    const newMsg = db.contact_messages.create({ name, email, message });
    return res.json({ success: true, message: newMsg });
  });

  app.get('/api/contact/messages', (req, res) => {
    const userId = getUserId(req);
    const user = db.users.findById(userId);
    if (!user || !user.username.toLowerCase().includes('admin')) return res.status(403).json({ error: 'Forbidden' });
    return res.json(db.contact_messages.listAll());
  });

  // ── Page Builder ──────────────────────────────────────────────────────────

  app.get('/api/builder/pages', (req, res) => {
    const userId = getUserId(req);
    return res.json(db.landing_pages.listByUserId(userId));
  });

  app.post('/api/builder/save', (req, res) => {
    const userId = getUserId(req);
    const { id, title, pageState } = req.body;
    if (!title || !pageState) return res.status(400).json({ error: 'Title and pageState are required' });
    if (id) {
      const updated = db.landing_pages.update(id, { title, pageState });
      if (updated) return res.json(updated);
      return res.status(404).json({ error: 'Page not found' });
    }
    return res.json(db.landing_pages.create({ userId, title, pageState }));
  });

  app.delete('/api/builder/:id', (req, res) => {
    const userId = getUserId(req);
    const success = db.landing_pages.delete(req.params.id, userId);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: 'Page not found or unauthorized' });
  });

  // ── Policy Generator ──────────────────────────────────────────────────────

  app.post('/api/policies/generate', (req, res) => {
    const userId = getUserId(req);
    const { companyName, companyAddress, supportEmail, supportPhone, selectedPolicies } = req.body;
    if (!companyName || !companyAddress || !supportEmail || !supportPhone)
      return res.status(400).json({ error: 'Missing business information requirements' });
    return res.json(db.generated_policies.create({ userId, companyName, companyAddress, supportEmail, supportPhone, selectedPolicies }));
  });

  // ── Scan History ──────────────────────────────────────────────────────────

  app.get('/api/scans', (req, res) => {
    const userId = getUserId(req);
    return res.json(db.scans.listByUserId(userId));
  });

  // ── Policy KB refresh (manual trigger) ───────────────────────────────────

  app.post('/api/policies/refresh-kb', async (req, res) => {
    try {
      const rules = await fetchAndAugmentPolicies(generateAIContent);
      const kb: PolicyKB = { rules, last_updated: Date.now() };
      savePolicyKB(kb);
      return res.json({ success: true, rules_count: rules.length, last_updated: new Date(kb.last_updated).toISOString() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENTERPRISE COMPLIANCE SCAN — Streaming NDJSON
  // POST /api/compliance/scan-enterprise
  // ─────────────────────────────────────────────────────────────────────────

  // ── Config / Diagnostics endpoint ─────────────────────────────────────────
  app.get('/api/config/status', (req, res) => {
    dotenv.config({ override: true });
    const userId = getUserId(req);
    const today = new Date().setHours(0, 0, 0, 0);
    const scansToday = userId !== 'anonymous'
      ? db.scans.listByUserId(userId).filter((s: any) => s.timestamp > today).length
      : 0;
    const dailyLimit = getDailyScanLimit();
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

    const keyMap: Record<string, string> = {
      gemini: process.env.GEMINI_API_KEY || '',
      groq: process.env.GROQ_API_KEY || '',
      grok: process.env.GROK_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      openrouter: process.env.OPENROUTER_API_KEY || '',
    };
    const activeKey = keyMap[provider] || '';
    const validation = validateProviderKey(provider, activeKey);

    const warnings: string[] = [];
    if (validation.warning) warnings.push(validation.warning);
    // Check for Grok/Groq key confusion
    if ((process.env.GROK_API_KEY || '').startsWith('gsk_')) {
      warnings.push('CRITICAL: GROK_API_KEY starts with gsk_ which is a Groq key format. xAI Grok keys start with xai-. Update GROK_API_KEY in .env if you intend to use xAI Grok.');
    }
    // Check for unconfigured keys
    for (const [p, k] of Object.entries(keyMap)) {
      if (k.startsWith('MY_') || k === '') warnings.push(`${p.toUpperCase()}_API_KEY is not configured (still placeholder).`);
    }

    return res.json({
      timestamp: new Date().toISOString(),
      active_provider: provider,
      active_key_mask: keyMask(activeKey),
      active_key_hash_sha256: keyHash(activeKey),
      key_valid: validation.valid,
      env_source: '.env (re-read per-request with override:true)',
      dotenv_version: '17.x (dotenvx)',
      client_singleton: false,
      key_cached: false,
      scans_today: scansToday,
      daily_limit: dailyLimit,
      scans_remaining: Math.max(0, dailyLimit - scansToday),
      in_flight_scans: inFlightScans.size,
      providers_configured: Object.fromEntries(
        Object.entries(keyMap).map(([p, k]) => [p, { configured: !!k && !k.startsWith('MY_') && k.length > 5, key_mask: keyMask(k) }])
      ),
      warnings,
    });
  });

  app.post('/api/compliance/scan-enterprise', async (req, res) => {
    const { url, creativeText } = req.body;
    const userId = getUserId(req);
    const requestId = makeRequestId();

    // ── In-flight deduplication ──────────────────────────────────────────────
    if (isUserScanning(userId)) {
      res.status(409).json({
        error: 'A scan is already in progress for your account. Please wait for it to complete before starting a new one.',
        error_type: 'SCAN_IN_PROGRESS',
      });
      return;
    }

    // ── Rate limit (configurable via DAILY_SCAN_LIMIT env var) ───────────────
    const dailyLimit = getDailyScanLimit();
    const today = new Date().setHours(0, 0, 0, 0);
    const scansToday = db.scans.listByUserId(userId).filter((s: any) => s.timestamp > today).length;
    if (scansToday >= dailyLimit) {
      // Midnight reset time
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const hoursUntilReset = Math.ceil((midnight.getTime() - Date.now()) / (1000 * 60 * 60));
      res.status(429).json({
        error: `Daily scan limit of ${dailyLimit} scans reached for your account. This is an application-level limit (not an AI provider issue). Resets in ~${hoursUntilReset} hour${hoursUntilReset !== 1 ? 's' : ''}. To increase this limit, set DAILY_SCAN_LIMIT=100 in your .env file.`,
        error_type: 'APP_RATE_LIMIT',
        limit: dailyLimit,
        used: scansToday,
        resets_in_hours: hoursUntilReset,
      });
      return;
    }

    console.log(`[${requestId}] Enterprise scan START | user:${userId} | scans_today:${scansToday}/${dailyLimit} | url:${url || 'creative-text'}`);
    markUserScanning(userId);

    // Set up streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const emit = (event: object) => {
      try { res.write(JSON.stringify(event) + '\n'); } catch (_) {}
    };

    try {
      let allText = '';
      let allImages = '';
      let discoveryResult: any = { pages: [], critical_pages_found: [], missing_pages: [] };

      // ── Phase 1: Website Discovery ────────────────────────────────────────
      if (url) {
        emit({ type: 'phase', phase: 1, name: 'Website Discovery', status: 'running', message: `Crawling ${url}...` });
        try {
          const { pages, critical_pages_found, missing_pages } = await crawlWebsite(url);
          discoveryResult = { pages, critical_pages_found, missing_pages, pages_count: pages.length };

          allText = pages
            .filter(p => p.status === 'success')
            .map(p => `\n[PAGE: ${p.page_type.toUpperCase()} — ${p.url}]\n${p.text}`)
            .join('\n');

          allImages = pages
            .flatMap(p => p.images)
            .slice(0, 60)
            .map((img, i) => `Image ${i + 1}: ${img.url} | Alt: "${img.alt}"`)
            .join('\n');

          emit({
            type: 'phase', phase: 1, name: 'Website Discovery', status: 'complete',
            data: { pages_found: pages.length, critical_pages_found, missing_pages },
          });
        } catch (crawlErr: any) {
          emit({ type: 'phase', phase: 1, name: 'Website Discovery', status: 'failed', message: crawlErr.message });
          // Fall back to single-page scrape
          try {
            const fetchRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ComplianceBot' } });
            const html = await fetchRes.text();
            const $ = cheerio.load(html);
            const imageSet = new Set<string>();
            $('img').each((_, el) => {
              const src = $(el).attr('src') || $(el).attr('data-src') || '';
              if (src && !src.startsWith('data:')) {
                try { imageSet.add(`${new URL(src, url).href} | Alt: "${$(el).attr('alt') || ''}"`); } catch { imageSet.add(src); }
              }
            });
            $('script, style, noscript').remove();
            allText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);
            allImages = Array.from(imageSet).slice(0, 40).join('\n');
          } catch (_) {}
        }
      } else if (creativeText) {
        allText = `[AD COPY TEXT]\n${creativeText}`;
        emit({ type: 'phase', phase: 1, name: 'Content Ingestion', status: 'complete', data: { source: 'creative_text' } });
      }

      // ── Phase 4: Policy Knowledge Base ───────────────────────────────────
      emit({ type: 'phase', phase: 4, name: 'Policy Knowledge Base', status: 'running', message: 'Loading policy rules...' });
      const kb = loadPolicyKB();
      emit({
        type: 'phase', phase: 4, name: 'Policy Knowledge Base', status: 'complete',
        data: { rules_count: kb.rules.length, last_updated: new Date(kb.last_updated).toISOString() },
      });

      // ── Phases 2–3–6–7–8–9–10–11–12–13–15: Comprehensive AI Analysis ────
      emit({ type: 'phase', phase: 2, name: 'Business & Product Intelligence', status: 'running', message: 'Extracting business model and products...' });
      emit({ type: 'phase', phase: 6, name: 'Claim Extraction & Policy Matching', status: 'running', message: 'Mapping claims against policy rules...' });
      emit({ type: 'phase', phase: 8, name: 'Image Analysis', status: 'running', message: 'Analyzing images for violations...' });
      emit({ type: 'phase', phase: 10, name: 'Trust & Legitimacy Audit', status: 'running', message: 'Auditing trust signals and legal pages...' });
      emit({ type: 'phase', phase: 11, name: 'Dark Pattern Detection', status: 'running', message: 'Scanning for manipulation tactics...' });

      const aiText = await generateAIContent({
        systemInstruction: 'You are an Enterprise Advertising Compliance Intelligence System. Analyze the provided website content against the given policy knowledge base and return a comprehensive JSON compliance report.',
        promptContent: buildEnterprisePrompt(allText, allImages, kb.rules, discoveryResult.missing_pages || []),
        geminiSchema: buildEnterpriseGeminiSchema(),
        plainJsonSchema: buildEnterprisePlainSchema(),
        fallbackGeminiModel: 'gemini-2.5-flash',
        _requestId: requestId,
      });

      const analysis = JSON.parse(aiText || '{}');

      emit({ type: 'phase', phase: 2, name: 'Business & Product Intelligence', status: 'complete', data: { business_type: analysis.business_model_type } });
      emit({ type: 'phase', phase: 6, name: 'Claim Extraction & Policy Matching', status: 'complete', data: { claims_found: (analysis.claim_violations || []).length } });
      emit({ type: 'phase', phase: 8, name: 'Image Analysis', status: 'complete', data: { images_analyzed: (analysis.images || []).length } });
      emit({ type: 'phase', phase: 10, name: 'Trust & Legitimacy Audit', status: 'complete', data: { trust_score: analysis.trust_score } });
      emit({ type: 'phase', phase: 11, name: 'Dark Pattern Detection', status: 'complete', data: { dark_patterns_found: (analysis.detected_dark_patterns || []).length } });

      // ── Phase 14: Weighted Scoring ────────────────────────────────────────
      emit({ type: 'phase', phase: 14, name: 'Risk Score Calculation', status: 'running', message: 'Applying weighted scoring formula...' });
      const scoring = calculateWeightedScore(analysis, discoveryResult.missing_pages || []);
      emit({
        type: 'phase', phase: 14, name: 'Risk Score Calculation', status: 'complete',
        data: { risk_score: scoring.total, risk_level: scoring.risk_level, breakdown: scoring.breakdown },
      });

      // ── Assemble final report ─────────────────────────────────────────────
      const finalReport: any = {
        ...analysis,
        url,
        creativeText,
        discovery: discoveryResult,
        risk_score: scoring.total,
        risk_breakdown: scoring.breakdown,
        risk_level: scoring.risk_level,
        overall_status: scoring.overall_status,
        // Legacy field — keep for backward compat with ReportView
        website_risk_score: scoring.total,
      };

      // Save to DB
      try {
        db.scans.create({ userId, url, creativeText, channel: 'All', ...finalReport });
      } catch (_) {}

      emit({ type: 'complete', report: finalReport });
      res.end();
    } catch (err: any) {
      console.error(`[${requestId}] Enterprise scan error:`, err);
      emit({ type: 'error', message: err.message || 'Scan failed unexpectedly.' });
      res.end();
    } finally {
      clearUserScanning(userId);
      console.log(`[${requestId}] Enterprise scan END | user:${userId}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // LEGACY SCAN (kept for backward compat) — POST /api/compliance/scan
  // ─────────────────────────────────────────────────────────────────────────

  app.post('/api/compliance/scan', async (req, res) => {
    try {
      const { url, creativeText } = req.body;
      const userId = getUserId(req);

      let scrapedText = '', scrapedLinks = '', scrapedImages = '';
      if (url) {
        try {
          const fetchRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Compliance-Bot' } });
          const html = await fetchRes.text();
          const $ = cheerio.load(html);
          const linkSet = new Set<string>();
          $('a').each((_, el) => {
            const txt = $(el).text().replace(/\s+/g, ' ').trim();
            const href = $(el).attr('href');
            if (txt && href && !href.startsWith('javascript:')) linkSet.add(`[${txt}](${href})`);
          });
          scrapedLinks = Array.from(linkSet).join('\n');
          const imageSet = new Set<string>();
          $('*').each((_, el) => {
            const tag = (el as any).tagName?.toLowerCase();
            let src = '';
            const alt = $(el).attr('alt') || '';
            if (tag === 'img' || tag === 'source') {
              src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('srcset') || '';
            }
            if (src && !src.startsWith('data:')) {
              const firstSrc = src.split(',')[0].trim().split(' ')[0];
              if (firstSrc) {
                try { imageSet.add(`Image URL: ${new URL(firstSrc, url).href} | Alt text: ${alt}`); } catch { imageSet.add(`Image URL: ${firstSrc} | Alt text: ${alt}`); }
              }
            }
          });
          scrapedImages = Array.from(imageSet).slice(0, 40).join('\n');
          $('script, style, noscript').remove();
          scrapedText = $('body').text().replace(/\s+/g, ' ').trim();
        } catch (_) {
          scrapedText = '[Error fetching URL content.]';
        }
      }

      const today = new Date().setHours(0, 0, 0, 0);
      if (db.scans.listByUserId(userId).filter(s => s.timestamp > today).length >= 10) {
        return res.status(429).json({ error: 'Daily scan limit (10) reached.' });
      }

      let promptContent = `Perform a hyper-aggressive ad policy compliance scan for Meta, Google, TikTok, and Snapchat.\n`;
      if (url) {
        promptContent += `URL: "${url}"\n\nContent:\n"""\n${scrapedText.substring(0, 15000)}\n"""\n\nLinks:\n"""\n${scrapedLinks.substring(0, 5000)}\n"""\n\nImages:\n"""\n${scrapedImages.substring(0, 5000)}\n"""\n`;
      }
      if (creativeText) promptContent += `\nAd Copy:\n"${creativeText}"`;

      const systemInstruction = `You are an advanced AI Compliance Auditor. Analyze the website for advertising policy compliance across Meta, Google, TikTok, and Snapchat. Check DOM, images, claims, dark patterns, trust signals, and business model. Return strict JSON.`;

      const plainJsonSchema = {
        type: 'object',
        properties: {
          website_risk_score: { type: 'integer' }, overall_status: { type: 'string' }, summary: { type: 'string' },
          images: { type: 'array', items: { type: 'object' } },
          website_level_issues: { type: 'array', items: { type: 'object' } },
          final_recommendations: { type: 'array', items: { type: 'string' } },
          website_classification: { type: 'string' }, business_model_type: { type: 'string' },
          product_classifications: { type: 'array', items: { type: 'object' } },
          platform_enforcement_risk: { type: 'object' },
          detected_dark_patterns: { type: 'array', items: { type: 'string' } },
          scam_signals: { type: 'array', items: { type: 'string' } },
          trust_signals: { type: 'array', items: { type: 'string' } },
          policy_evasion_signals: { type: 'array', items: { type: 'string' } },
          consumer_harm_signals: { type: 'array', items: { type: 'string' } },
          final_verdict: { type: 'string' },
        },
      };

      const geminiSchema = {
        type: Type.OBJECT,
        properties: {
          website_risk_score: { type: Type.INTEGER }, overall_status: { type: Type.STRING }, summary: { type: Type.STRING },
          images: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { image_id: { type: Type.STRING }, image_url: { type: Type.STRING }, description: { type: Type.STRING }, ocr_text: { type: Type.STRING }, detected_elements: { type: Type.ARRAY, items: { type: Type.STRING } }, policy_violations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, policy: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['platform', 'policy', 'reason'] } }, severity: { type: Type.STRING }, confidence: { type: Type.INTEGER }, recommended_action: { type: Type.STRING }, safe_for_ads: { type: Type.BOOLEAN } }, required: ['image_id', 'image_url', 'description', 'ocr_text', 'detected_elements', 'policy_violations', 'severity', 'confidence', 'recommended_action', 'safe_for_ads'] } },
          website_level_issues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, severity: { type: Type.STRING }, description: { type: Type.STRING }, remediation: { type: Type.STRING } }, required: ['issue', 'severity', 'description', 'remediation'] } },
          final_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          website_classification: { type: Type.STRING }, business_model_type: { type: Type.STRING },
          product_classifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { product_name: { type: Type.STRING }, category: { type: Type.STRING }, classification: { type: Type.STRING }, risk_level: { type: Type.STRING }, consumer_harm_risk: { type: Type.STRING }, platform_compliance_risk: { type: Type.STRING }, reasoning: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['product_name', 'category', 'classification', 'risk_level', 'consumer_harm_risk', 'platform_compliance_risk', 'reasoning'] } },
          platform_enforcement_risk: { type: Type.OBJECT, properties: { meta: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] }, google: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] }, tiktok: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] }, snapchat: { type: Type.OBJECT, properties: { risk_level: { type: Type.STRING }, likely_action: { type: Type.STRING } }, required: ['risk_level', 'likely_action'] } }, required: ['meta', 'google', 'tiktok', 'snapchat'] },
          detected_dark_patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          scam_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          trust_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          policy_evasion_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          consumer_harm_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          final_verdict: { type: Type.STRING },
        },
        required: ['website_risk_score', 'overall_status', 'summary', 'images', 'website_level_issues', 'final_recommendations', 'website_classification', 'business_model_type', 'product_classifications', 'platform_enforcement_risk', 'detected_dark_patterns', 'scam_signals', 'trust_signals', 'policy_evasion_signals', 'consumer_harm_signals', 'final_verdict'],
      };

      const aiText = await generateAIContent({ systemInstruction, promptContent, geminiSchema, plainJsonSchema, fallbackGeminiModel: 'gemini-2.5-flash' });
      const parsedJSON = JSON.parse(aiText || '{}');
      db.scans.create({ userId, url, creativeText, channel: 'All', ...parsedJSON });
      return res.json(parsedJSON);
    } catch (err: any) {
      console.error('Scan Error:', err);
      let statusCode = 500, errorMessage = err.message || 'An error occurred during the AI scan.';
      try {
        if (err.message?.includes('{"error":')) {
          const match = err.message.match(/(\{.*\})/);
          if (match) { const p = JSON.parse(match[0]); if (p.error?.code) statusCode = p.error.code; if (p.error?.message) errorMessage = p.error.message; }
        } else if (err.status) { statusCode = err.status; }
      } catch (_) {}
      return res.status(statusCode).json({ error: errorMessage });
    }
  });

  // ── Copy Checker ──────────────────────────────────────────────────────────

  app.post('/api/compliance/check-copy', async (req, res) => {
    try {
      const { text, channel = 'Meta' } = req.body;
      if (!text) return res.status(400).json({ error: 'Text is required.' });

      const systemInstruction = `You are a compliance copywriting validator. Review the provided ad/website text for ${channel} network policies. Return JSON with compliant (bool), score (0-100), feedback (string), suggestions (string[]).`;
      const plainJsonSchema = { type: 'object', properties: { compliant: { type: 'boolean' }, score: { type: 'integer' }, feedback: { type: 'string' }, suggestions: { type: 'array', items: { type: 'string' } } }, required: ['compliant', 'score', 'feedback'] };
      const geminiSchema = { type: Type.OBJECT, properties: { compliant: { type: Type.BOOLEAN }, score: { type: Type.INTEGER }, feedback: { type: Type.STRING }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['compliant', 'score', 'feedback'] };

      const aiText = await generateAIContent({ systemInstruction, promptContent: `Ad Copy:\n"${text}"`, geminiSchema, plainJsonSchema, fallbackGeminiModel: 'gemini-2.5-flash' });
      return res.json(JSON.parse(aiText || '{}'));
    } catch (err: any) {
      console.error('Check Copy Error:', err);
      return res.status(500).json({ error: err.message || 'Copy check failed.' });
    }
  });

  // ── Static / Vite ─────────────────────────────────────────────────────────

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Compliance.OS Enterprise server running on port ${PORT}`);
    console.log(`Policy KB: ${BASE_POLICY_RULES.length} base rules loaded`);
  });
}

startServer();
