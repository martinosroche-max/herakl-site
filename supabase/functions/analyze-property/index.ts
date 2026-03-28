import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PropertyData {
  address: {
    street: string;
    city: string;
    postal_code: string;
    full: string;
  };
  property_type: string;
  surface: number;
  rooms: string;
  construction_year?: number;
  plu_zone?: string;
}

interface AnalysisResult {
  global_score: number;
  structure_score: number;
  risk_score: number;
  energy_score: number;
  synthesis: string;
  analysis_data: {
    priorities: Array<{
      urgence: string;
      titre: string;
      description: string;
      gain: string;
    }>;
    market_info?: {
      prixM2: number;
      marketTension: string;
    };
    risks?: {
      flood: boolean;
      seismic: string;
      clay: boolean;
      radon: boolean;
    };
  };
}

function calculateStructureScore(property: PropertyData): number {
  let score = 75;

  if (property.construction_year) {
    const age = new Date().getFullYear() - property.construction_year;
    if (age > 50) score -= 10;
    if (age > 80) score -= 15;
  }

  const roomsNum = parseInt(property.rooms);
  if (roomsNum < 2) score -= 5;
  if (roomsNum > 5) score += 5;

  return Math.max(40, Math.min(100, score + Math.random() * 15 - 7));
}

function calculateRiskScore(property: PropertyData, city: string): number {
  const cityRiskMap: { [key: string]: number } = {
    "Lyon": 65,
    "Paris": 72,
    "Marseille": 58,
    "Toulouse": 68,
    "Nice": 55,
  };

  let baseScore = cityRiskMap[city] || 65;
  baseScore += Math.random() * 20 - 10;

  return Math.max(30, Math.min(100, baseScore));
}

function calculateEnergyScore(constructionYear?: number): number {
  if (!constructionYear) return 45;

  if (constructionYear > 2015) return 75 + Math.random() * 15;
  if (constructionYear > 2000) return 55 + Math.random() * 25;
  if (constructionYear > 1980) return 35 + Math.random() * 30;
  return 20 + Math.random() * 35;
}

function calculateGlobalScore(structure: number, risk: number, energy: number): number {
  const weights = { structure: 0.4, risk: 0.35, energy: 0.25 };
  return Math.round(
    structure * weights.structure +
    risk * weights.risk +
    energy * weights.energy
  );
}

function getMarketValuation(
  surface: number,
  city: string,
  globalScore: number
): { prixM2: number; valueLow: number; valueHigh: number } {
  const basePriceM2Map: { [key: string]: number } = {
    "Lyon": 5200,
    "Paris": 8500,
    "Marseille": 4100,
    "Toulouse": 4800,
    "Nice": 6200,
  };

  let basePriceM2 = basePriceM2Map[city] || 4500;
  const scoreMultiplier = 0.8 + (globalScore / 100) * 0.4;
  const prixM2 = Math.round(basePriceM2 * scoreMultiplier);

  const valueLow = Math.round(surface * prixM2 * 0.88);
  const valueHigh = Math.round(surface * prixM2 * 1.12);

  return { prixM2, valueLow, valueHigh };
}

function generateRecommendations(
  property: PropertyData,
  energyScore: number,
  structureScore: number
): Array<{ urgence: string; titre: string; description: string; gain: string }> {
  const priorities = [];

  if (energyScore < 50) {
    priorities.push({
      urgence: "high",
      titre: "Amélioration énergétique",
      description: "Modernisation du système de chauffage et isolation",
      gain: `+${Math.round(property.surface * 15 * 10)}€`,
    });
  }

  if (structureScore < 60) {
    priorities.push({
      urgence: "high",
      titre: "Rénovation structurelle",
      description: "Audit et rénovation des éléments majeurs",
      gain: `+${Math.round(property.surface * 12 * 10)}€`,
    });
  }

  priorities.push({
    urgence: "medium",
    titre: "Rénovation salle de bain",
    description: "Mise aux normes et modernisation",
    gain: `+${Math.round(18000 + Math.random() * 8000)}€`,
  });

  priorities.push({
    urgence: "medium",
    titre: "Peinture intérieure",
    description: "Rafraîchissement cosmétique des pièces",
    gain: `+${Math.round(5000 + Math.random() * 3000)}€`,
  });

  if (Math.random() > 0.5 && property.property_type === "maison") {
    priorities.push({
      urgence: "low",
      titre: "Aménagement jardin",
      description: "Amélioration des espaces extérieurs",
      gain: "+8000€",
    });
  }

  return priorities.slice(0, 5);
}

async function analyzeProperty(property: PropertyData): Promise<AnalysisResult> {
  const city = property.address.city || "Paris";

  const structureScore = calculateStructureScore(property);
  const riskScore = calculateRiskScore(property, city);
  const energyScore = calculateEnergyScore(property.construction_year);
  const globalScore = calculateGlobalScore(structureScore, riskScore, energyScore);

  const { prixM2, valueLow, valueHigh } = getMarketValuation(
    property.surface,
    city,
    globalScore
  );

  const priorities = generateRecommendations(
    property,
    energyScore,
    structureScore
  );

  const qualityLevel =
    globalScore > 75 ? "très bonne" : globalScore > 60 ? "bonne" : "acceptable";

  const synthesis = `Bien de qualité ${qualityLevel} situé à ${city}.
Score HERAKL: ${Math.round(globalScore)}/100.
Estimation: ${(valueLow / 1000).toFixed(0)}k - ${(valueHigh / 1000).toFixed(0)}k€.
${structureScore > 70 ? "Structure en bon état." : "Travaux structurels recommandés."}
${energyScore > 60 ? "Performance énergétique satisfaisante." : "Amélioration énergétique recommandée."}
Potentiel de valorisation: ${priorities.length > 0 ? "significatif" : "limité"}.`;

  return {
    global_score: Math.round(globalScore),
    structure_score: Math.round(structureScore),
    risk_score: Math.round(riskScore),
    energy_score: Math.round(energyScore),
    synthesis,
    analysis_data: {
      priorities,
      market_info: {
        prixM2,
        marketTension: ["faible", "moyen", "fort"][
          Math.floor(Math.random() * 3)
        ],
      },
      risks: {
        flood: Math.random() > 0.7,
        seismic: ["faible", "moyen", "fort"][
          Math.floor(Math.random() * 3)
        ],
        clay: Math.random() > 0.6,
        radon: Math.random() > 0.8,
      },
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const property = body.property as PropertyData;

    if (!property || !property.address) {
      return new Response(
        JSON.stringify({ error: "Property data required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const analysis = await analyzeProperty(property);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Analysis failed",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
