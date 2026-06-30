// Real Merantix Capital portfolio (public info from merantix-capital.com/portfolio),
// enriched with mock financial fields used by the internal Operator dashboard.
// LP UI must only render the public fields.

export type TeamMember = { name: string; role: string };
export type Company = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  founders: string[];
  website: string;
  status: "Active" | "Exited" | "Stealth";
  logo: string; // letter
  color: string;

  // Public profile
  about?: string;
  team?: TeamMember[];
  partners?: string[];
  currentActivity?: string[]; // bullets of what they're doing now

  // Internal-only (Operator) fields — never show on LP portal
  fund: string;
  investmentYear: number;
  valuation: number; // €M
  invested: number;  // €M
  growth: number;    // % YoY
  hq: string;
};

// Companies Merantix Capital is actively investigating in the last 6 months
export type Investigation = {
  id: string;
  name: string;
  sector: string;
  website: string;
  stage: "Sourced" | "Screening" | "Due Diligence" | "IC Review";
  note: string;
  firstSeen: string; // ISO month
};

export const INVESTIGATIONS: Investigation[] = [
  { id: "neuralforge", name: "NeuralForge", sector: "Industrial AI", website: "neuralforge.ai", stage: "Due Diligence", note: "Foundation models for factory floor optimization.", firstSeen: "2026-05" },
  { id: "axionlabs", name: "Axion Labs", sector: "Defense Tech", website: "axion.eu", stage: "IC Review", note: "Autonomous swarms for European defense procurement.", firstSeen: "2026-04" },
  { id: "helixmed", name: "Helix Medical", sector: "Healthtech", website: "helixmed.io", stage: "Screening", note: "AI-native clinical trial recruitment, EU-focused.", firstSeen: "2026-06" },
  { id: "verdantai", name: "Verdant AI", sector: "ClimateTech", website: "verdant.ai", stage: "Due Diligence", note: "Satellite-driven carbon MRV for industrial supply chains.", firstSeen: "2026-03" },
  { id: "kortexbio", name: "Kortex Bio", sector: "Techbio", website: "kortex.bio", stage: "Screening", note: "Generative protein design platform spun out of MPI.", firstSeen: "2026-05" },
  { id: "orbitalcap", name: "Orbital Capital OS", sector: "Fintech Infra", website: "orbital.so", stage: "Sourced", note: "AI-native middle office for private credit funds.", firstSeen: "2026-06" },
];

export const CATEGORIES = [
  "Biotech", "Manufacturing", "Healthcare", "Techbio", "Mobile AI",
  "Logistics", "Fintech", "Cybersecurity", "Ecommerce", "Recruitment",
  "Energy", "Fashion", "Data Management", "SaaS", "Legaltech",
];

export const FUNDS = ["Merantix Fund I", "Merantix Fund II", "Momentum Fund"];

const green = "oklch(0.92 0.25 120)";
const orange = "oklch(0.72 0.21 55)";
const black = "oklch(0.18 0.01 60)";
const tan = "oklch(0.65 0.12 85)";

export const COMPANIES: Company[] = [
  {
    id: "cambrium", name: "Cambrium", tagline: "Developing sustainable materials of tomorrow",
    category: "Biotech", stage: "Pre-Idea", founders: ["Mitchell Duffy", "Charlie Cotton"],
    website: "cambrium.bio", status: "Active", logo: "C", color: green,
    fund: "Merantix Fund II", investmentYear: 2021, valuation: 65, invested: 5, growth: 140, hq: "Berlin, DE",
  },
  {
    id: "deltia", name: "Deltia", tagline: "Unlocking a new level of productivity in assembly lines",
    category: "Manufacturing", stage: "Pre-Idea", founders: ["Maximilian Fischer", "Silviu Homoceanu"],
    website: "deltia.ai", status: "Active", logo: "D", color: orange,
    fund: "Merantix Fund II", investmentYear: 2021, valuation: 80, invested: 6, growth: 165, hq: "Berlin, DE",
  },
  {
    id: "vara", name: "Vara", tagline: "AI-powered breast cancer screenings",
    category: "Healthcare", stage: "Pre-Idea", founders: ["Jonas Muff", "Stefan Bunk"],
    website: "vara.ai", status: "Active", logo: "V", color: black,
    fund: "Merantix Fund I", investmentYear: 2018, valuation: 180, invested: 9, growth: 96, hq: "Berlin, DE",
  },
  {
    id: "graphtx", name: "GraphTx", tagline: "AI-driven precision medicine for immune diseases",
    category: "Techbio", stage: "Pre-Idea", founders: ["Gregory Vladimer", "Robert Sehlke", "Berend Snijder"],
    website: "graphtx.com", status: "Active", logo: "G", color: green,
    fund: "Merantix Fund II", investmentYear: 2022, valuation: 55, invested: 5, growth: 220, hq: "Vienna, AT",
  },
  {
    id: "ovomcare", name: "Ovom Care", tagline: "Personalising and augmenting reproductive care",
    category: "Healthcare", stage: "Pre-Idea", founders: ["Felicia von Reden", "Lynae Brayboy"],
    website: "ovomcare.com", status: "Active", logo: "O", color: orange,
    fund: "Merantix Fund II", investmentYear: 2023, valuation: 40, invested: 4, growth: 180, hq: "Berlin, DE",
  },
  {
    id: "droidrun", name: "Droidrun", tagline: "Developing the infrastructure for mobile AI agents",
    category: "Mobile AI", stage: "Pre-Seed", founders: ["Peter Lachner", "Niels Schmidt", "Christian Ninstel", "Nikolai Duck"],
    website: "droidrun.ai", status: "Active", logo: "D", color: green,
    fund: "Momentum Fund", investmentYear: 2024, valuation: 35, invested: 3, growth: 380, hq: "Berlin, DE",
  },
  {
    id: "arqh", name: "Arqh", tagline: "Decision intelligence engine for logistics",
    category: "Logistics", stage: "Pre-Seed", founders: ["Antonia Unger", "Mert Erkul"],
    website: "arqh.ai", status: "Active", logo: "A", color: black,
    fund: "Momentum Fund", investmentYear: 2024, valuation: 28, invested: 2, growth: 0, hq: "Berlin, DE",
  },
  {
    id: "briink", name: "Briink", tagline: "ESG reporting automation",
    category: "Fintech", stage: "Pre-Idea", founders: ["Tomas van der Heijden", "Samuel King"],
    website: "briink.com", status: "Active", logo: "B", color: green,
    fund: "Merantix Fund II", investmentYear: 2022, valuation: 48, invested: 4, growth: 145, hq: "Berlin, DE",
  },
  {
    id: "revel8", name: "Revel8", tagline: "Activating the human layer in cyber security defense",
    category: "Cybersecurity", stage: "Pre-Idea", founders: ["Julius Muth", "Tom Müller", "Robert Seilbeck"],
    website: "revel8.ai", status: "Active", logo: "R", color: orange,
    fund: "Merantix Fund II", investmentYear: 2022, valuation: 60, invested: 5, growth: 190, hq: "Munich, DE",
  },
  {
    id: "byndlooks", name: "Looks", tagline: "AI-powered immersive Ecommerce experiences",
    category: "Ecommerce", stage: "Pre-Idea", founders: ["Jaime Gomez"],
    website: "byndlooks.co", status: "Active", logo: "L", color: tan,
    fund: "Merantix Fund II", investmentYear: 2023, valuation: 22, invested: 2, growth: 110, hq: "Berlin, DE",
  },
  {
    id: "ficus", name: "Ficus Health", tagline: "Medical documentation for healthcare providers",
    category: "Healthcare", stage: "Pre-Idea", founders: ["Benjamin Pochhammer", "Mario Elstner"],
    website: "ficus-health.com", status: "Active", logo: "F", color: green,
    fund: "Merantix Fund II", investmentYear: 2023, valuation: 32, invested: 3, growth: 240, hq: "Berlin, DE",
  },
  {
    id: "outpost", name: "Outpost Bio", tagline: "Decoding the human microbiome",
    category: "Techbio", stage: "Pre-Seed", founders: ["Jenny Yang", "Alex Merwin"],
    website: "outpost.bio", status: "Active", logo: "O", color: black,
    fund: "Momentum Fund", investmentYear: 2024, valuation: 30, invested: 3, growth: 0, hq: "London, UK",
  },
  {
    id: "whybrilliant", name: "Why Brilliant", tagline: "AI agents for talent sourcing and hiring",
    category: "Recruitment", stage: "Pre-Idea", founders: ["Patrick Böert", "Aleksander Heimrath"],
    website: "whybrilliant.com", status: "Active", logo: "W", color: orange,
    fund: "Merantix Fund II", investmentYear: 2023, valuation: 26, invested: 2, growth: 160, hq: "Berlin, DE",
  },
  {
    id: "brighter-ai", name: "Brighter AI", tagline: "Privacy-preserving deep natural anonymization for video",
    category: "Cybersecurity", stage: "Series A", founders: ["Marian Gläser", "Patrick Kern"],
    website: "brighter.ai", status: "Active", logo: "B", color: black,
    fund: "Merantix Fund I", investmentYear: 2019, valuation: 95, invested: 6, growth: 75, hq: "Berlin, DE",
  },
  {
    id: "vionix", name: "Vionix Biosciences", tagline: "AI-powered diagnostics for infectious disease",
    category: "Healthcare", stage: "Seed", founders: ["Dario Bressanini", "Lena Kühl"],
    website: "vionix.bio", status: "Active", logo: "V", color: green,
    fund: "Merantix Fund II", investmentYear: 2023, valuation: 42, invested: 4, growth: 210, hq: "Berlin, DE",
  },
  {
    id: "atlas-metrics", name: "Atlas Metrics", tagline: "Sustainability data infrastructure for enterprises",
    category: "Fintech", stage: "Seed", founders: ["Mikael Hagström", "Erika Bock"],
    website: "atlasmetrics.io", status: "Active", logo: "A", color: green,
    fund: "Merantix Fund II", investmentYear: 2022, valuation: 58, invested: 5, growth: 180, hq: "Berlin, DE",
  },
  {
    id: "stealth-fintech", name: "Stealth · Fintech", tagline: "Stealth venture in Fintech",
    category: "Fintech", stage: "Pre-Idea", founders: ["Anouk Moll", "Richin Kabra"],
    website: "tbd", status: "Stealth", logo: "S", color: tan,
    fund: "Momentum Fund", investmentYear: 2024, valuation: 0, invested: 1, growth: 0, hq: "Berlin, DE",
  },
  {
    id: "stealth-energy", name: "Stealth · Energy", tagline: "Stealth venture in Energy",
    category: "Energy", stage: "Pre-Idea", founders: ["tbc"],
    website: "tbd", status: "Stealth", logo: "S", color: tan,
    fund: "Momentum Fund", investmentYear: 2024, valuation: 0, invested: 1, growth: 0, hq: "Berlin, DE",
  },
  {
    id: "libratech", name: "Libra (acq. Wolters Kluwer)", tagline: "The tailor-made legal AI platform",
    category: "Legaltech", stage: "Acquired", founders: ["Viktor von Essen", "Bo Tranberg"],
    website: "libratech.ai", status: "Exited", logo: "L", color: black,
    fund: "Merantix Fund I", investmentYear: 2019, valuation: 0, invested: 4, growth: 0, hq: "Berlin, DE",
  },
  {
    id: "siasearch", name: "SiaSearch (acq. Scale AI)", tagline: "The smart data refinery",
    category: "Data Management", stage: "Acquired", founders: ["Clemens Viernickel", "Mark Pfeiffer"],
    website: "scale.com", status: "Exited", logo: "S", color: black,
    fund: "Merantix Fund I", investmentYear: 2018, valuation: 0, invested: 4, growth: 0, hq: "Berlin, DE",
  },
  {
    id: "kausa", name: "Kausa (acq. SAP)", tagline: "AI-empowered business analytics",
    category: "SaaS", stage: "Acquired", founders: ["Stefan Dörfelt", "Michael Klaput"],
    website: "sap.com", status: "Exited", logo: "K", color: black,
    fund: "Merantix Fund I", investmentYear: 2019, valuation: 0, invested: 3, growth: 0, hq: "Berlin, DE",
  },
];

// Internal-only dashboard data
export const PIPELINE_DATA = [
  { stage: "Sourced", count: 1240 },
  { stage: "Screened", count: 380 },
  { stage: "DD", count: 86 },
  { stage: "IC", count: 24 },
  { stage: "Invested", count: 12 },
];

export const SECTOR_ALLOCATION = [
  { name: "Healthcare", value: 22 },
  { name: "Techbio", value: 16 },
  { name: "Manufacturing", value: 14 },
  { name: "Fintech", value: 12 },
  { name: "Cybersecurity", value: 10 },
  { name: "Logistics", value: 9 },
  { name: "Mobile AI", value: 9 },
  { name: "Other", value: 8 },
];

export const PORTFOLIO_VALUE_HISTORY = [
  { year: "2019", value: 45 },
  { year: "2020", value: 78 },
  { year: "2021", value: 142 },
  { year: "2022", value: 240 },
  { year: "2023", value: 380 },
  { year: "2024", value: 560 },
  { year: "2025", value: 730 },
];
