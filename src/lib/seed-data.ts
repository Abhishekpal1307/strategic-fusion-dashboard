import type { SourceType, RiskLevel } from "./intel-types";

export interface SeedNode {
  title: string;
  source_type: SourceType;
  risk_level: RiskLevel;
  latitude: number;
  longitude: number;
  region: string;
  description: string;
  notes: string;
  image_url: string | null;
}

export const SEED_NODES: SeedNode[] = [
  {
    title: "Unmarked convoy movement — Sector 7",
    source_type: "HUMINT",
    risk_level: "high",
    latitude: 28.6139, longitude: 77.2090, region: "Delhi",
    description: "Field operative reports unidentified convoy at 0340 IST.",
    notes: "Cross-correlate with sat pass 04:12.",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=70",
  },
  {
    title: "Suspicious comms uplink",
    source_type: "OSINT",
    risk_level: "high",
    latitude: 34.0837, longitude: 74.7973, region: "Kashmir",
    description: "Encrypted shortwave signature detected on open trackers.",
    notes: "Possible mobile relay station.",
    image_url: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=70",
  },
  {
    title: "Cross-border drone sighting",
    source_type: "IMINT",
    risk_level: "high",
    latitude: 31.6340, longitude: 74.8723, region: "Punjab",
    description: "Thermal frame shows quadcopter @ 220m AGL.",
    notes: "Image enhanced; tail-fin visible.",
    image_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=70",
  },
  {
    title: "Coastal radar anomaly",
    source_type: "OSINT",
    risk_level: "medium",
    latitude: 19.0760, longitude: 72.8777, region: "Mumbai",
    description: "Intermittent radar return 14nm offshore.",
    notes: "Likely fishing vessel cluster — verify.",
    image_url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=600&q=70",
  },
  {
    title: "Logistics depot expansion",
    source_type: "IMINT",
    risk_level: "medium",
    latitude: 26.9124, longitude: 75.7873, region: "Rajasthan",
    description: "New hangar visible since last imagery cycle.",
    notes: "Estimated footprint +1,800 sqm.",
    image_url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=70",
  },
  {
    title: "Local source debrief",
    source_type: "HUMINT",
    risk_level: "low",
    latitude: 30.7333, longitude: 76.7794, region: "Punjab",
    description: "Routine market chatter; nothing actionable.",
    notes: "Maintain monthly contact.",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=70",
  },
  {
    title: "Verified checkpoint relocation",
    source_type: "OSINT",
    risk_level: "verified",
    latitude: 28.7041, longitude: 77.1025, region: "Delhi",
    description: "Public notice confirms checkpoint moved 2km NW.",
    notes: "Update ops map layer 3.",
    image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=70",
  },
  {
    title: "Rail siding activity",
    source_type: "IMINT",
    risk_level: "medium",
    latitude: 27.0238, longitude: 74.2179, region: "Rajasthan",
    description: "Three rakes on previously dormant siding.",
    notes: "Possible logistics pre-stage.",
    image_url: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=70",
  },
];
