export type SourceType = "OSINT" | "HUMINT" | "IMINT";
export type RiskLevel = "high" | "medium" | "low" | "verified";

export interface IntelNode {
  id: string;
  user_id: string;
  title: string;
  source_type: SourceType;
  risk_level: RiskLevel;
  latitude: number;
  longitude: number;
  region: string | null;
  description: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  high: "var(--color-risk-high)",
  medium: "var(--color-risk-medium)",
  low: "var(--color-risk-low)",
  verified: "var(--color-risk-verified)",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
  verified: "Verified",
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  OSINT: "OSINT",
  HUMINT: "HUMINT",
  IMINT: "IMINT",
};
