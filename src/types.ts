export interface User {
  id: string;
  username: string;
}

export interface PolicyViolation {
  platform: string;
  policy: string;
  reason: string;
}

export interface ProductClassification {
  product_name: string;
  category: string;
  classification: 'WHITE_HAT' | 'GREY_HAT' | 'BLACK_HAT' | string;
  risk_level: string;
  consumer_harm_risk: string;
  platform_compliance_risk: string;
  reasoning: string[];
}

export interface PlatformEnforcementRisk {
  meta: { risk_level: string; likely_action: string };
  google: { risk_level: string; likely_action: string };
  tiktok: { risk_level: string; likely_action: string };
  snapchat: { risk_level: string; likely_action: string };
}

export interface ImageAnalysis {
  image_id: string;
  image_url: string;
  description: string;
  ocr_text: string;
  detected_elements: string[];
  policy_violations: PolicyViolation[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  confidence: number;
  recommended_action: string;
  safe_for_ads: boolean;
}

export interface WebsiteLevelIssue {
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  description: string;
  remediation: string;
}

// --- Enterprise Types ---

export interface PolicyRule {
  rule_id: string;
  platform: string;
  category: string;
  restriction: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CrawledPage {
  url: string;
  page_type: string;
  text: string;
  images: Array<{ url: string; alt: string }>;
  meta: Record<string, string>;
  schema_data: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface DiscoveryResult {
  pages_crawled: CrawledPage[];
  critical_pages_found: string[];
  missing_pages: string[];
  pages_count: number;
}

export interface ClaimViolation {
  claim: string;
  claim_type: string;
  violates: boolean;
  affected_platforms: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  why_it_matters: string;
  recommended_fix: string;
  evidence: string[];
}

export interface EvidenceItem {
  issue: string;
  severity: string;
  platforms: string[];
  evidence: string[];
  why_it_matters: string;
  recommended_fix: string;
}

export interface RiskBreakdown {
  business_risk: number;
  product_risk: number;
  claim_risk: number;
  platform_violations: number;
  trust_deficiencies: number;
  dark_patterns_score: number;
  technical_manipulation: number;
}

export interface ScanPhaseEvent {
  type: 'phase' | 'complete' | 'error';
  phase?: number;
  name?: string;
  status?: 'running' | 'complete' | 'failed';
  data?: any;
  report?: EnterpriseScanReport;
  message?: string;
}

export interface EnterpriseScanReport {
  id?: string;
  timestamp?: number;
  url?: string;
  creativeText?: string;

  // Phase 1 — Discovery
  discovery?: DiscoveryResult;

  // Phase 2 — Business Intelligence
  business_model_type: string;
  revenue_model?: string;

  // Phase 3 — Products
  product_classifications: ProductClassification[];

  // Phase 6-7 — Claims
  claim_violations?: ClaimViolation[];

  // Phase 8 — Images
  images: ImageAnalysis[];

  // Phase 10 — Trust
  trust_score?: number;
  trust_signals: string[];

  // Phase 11 — Dark Patterns
  detected_dark_patterns: string[];

  // Phase 12 — Enforcement
  platform_enforcement_risk: PlatformEnforcementRisk;

  // Phase 13 — Classification
  website_classification: 'WHITE_HAT' | 'GREY_HAT' | 'BLACK_HAT' | string;

  // Phase 14 — Weighted Score
  risk_score: number;
  risk_breakdown?: RiskBreakdown;
  risk_level?: string;

  // Phase 15 — Evidence
  evidence?: EvidenceItem[];

  // Signals
  scam_signals: string[];
  policy_evasion_signals: string[];
  consumer_harm_signals: string[];

  // Legacy / derived fields
  website_risk_score: number;
  overall_status: 'COMPLIANT' | 'WARNING' | 'HIGH_RISK' | 'BLOCKED' | string;
  summary: string;
  website_level_issues: WebsiteLevelIssue[];
  final_recommendations: string[];
  final_verdict?: string;
}

// Backward-compatible alias
export type ScanReport = EnterpriseScanReport;

export interface LandingPageState {
  elements: {
    id: string;
    type: 'header' | 'hero' | 'benefits' | 'testimonial' | 'urgency' | 'badges' | 'pricing' | 'footer' | 'disclaimer';
    title: string;
    content: string;
    originalContent?: string;
    compliantContent?: string;
    status: 'compliant' | 'warning' | 'critical';
    issueDetails?: string;
    options?: any;
  }[];
}

export interface LandingPage {
  id?: string;
  userId?: string;
  title: string;
  pageState: LandingPageState;
  timestamp?: number;
}
