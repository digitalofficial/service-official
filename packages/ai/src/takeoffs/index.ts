// ============================================================
// SERVICE OFFICIAL — AI Takeoff Engine
// Anthropic-powered material extraction from blueprints
// ============================================================

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface TakeoffExtractionInput {
  blueprint_url: string
  trade: string
  sheet_title?: string
  scale?: string
  context?: string
}

export interface ExtractedItem {
  name: string
  description: string
  category: string
  quantity: number
  unit: string
  confidence_score: number
  formula_used: string
  source_area: string
  notes?: string
}

export interface TakeoffExtractionResult {
  items: ExtractedItem[]
  summary: string
  total_confidence: number
  processing_time_ms: number
  raw_response: string
}

// Trade-specific rule sets
const TRADE_RULES: Record<string, string> = {
  roofing: `
    For roofing, extract:
    - Roof area in squares (1 square = 100 sq ft). Add 10% waste for gable, 15% for hip.
    - Linear feet of ridge, hip, valley, rake, and eave
    - Count of penetrations (vents, pipes, skylights)
    - Area of flat sections vs pitched
    - Calculate: shingles, underlayment, ice barrier, drip edge, ridge cap, nails, starter strip
    - For metal: panels, screws, tape, trim pieces
  `,
  drywall: `
    For drywall, extract:
    - Wall square footage (subtract 50% for openings unless under 10 sq ft)
    - Ceiling square footage
    - Calculate: drywall sheets (4x8 or 4x12), joint compound (1 gal per 300 sq ft), 
      drywall screws (5 lbs per 500 sq ft), corner bead (linear ft), tape (linear ft)
    - Add 10% waste factor
  `,
  concrete: `
    For concrete, extract:
    - Slab area and thickness → cubic yards (LxWxT/27)
    - Footings: linear ft and cross-section → cubic yards
    - Steps, walls, piers as separate items
    - Calculate: concrete, rebar (linear ft), mesh, form boards, vapor barrier
  `,
  framing: `
    For framing, extract:
    - Linear feet of walls at each height
    - Floor area for floor/ceiling joists
    - Calculate: studs (LF/1.5 * 1.1 for waste), plates (LF * 3), 
      headers (count * width), joists (area/spacing * 1.1), 
      sheathing (area * 1.1), fasteners
  `,
  electrical: `
    For electrical, extract:
    - Count of outlets, switches, lights, panels
    - Linear feet of conduit runs
    - Calculate: wire by circuit, boxes, conduit, breakers, devices
  `,
  plumbing: `
    For plumbing, extract:
    - Count of fixtures (sinks, toilets, showers, tubs)
    - Linear feet of pipe runs by size
    - Count of fittings, valves, shut-offs
  `,
}

export async function extractTakeoffFromBlueprint(
  input: TakeoffExtractionInput
): Promise<TakeoffExtractionResult> {
  const startTime = Date.now()
  const tradeRules = TRADE_RULES[input.trade] ?? 'Extract all measurable quantities visible in the blueprint.'

  const prompt = `You are an expert construction estimator analyzing a blueprint for a ${input.trade} takeoff.

Sheet: ${input.sheet_title ?? 'Unknown'}
Scale: ${input.scale ?? 'Unknown'}
Context: ${input.context ?? 'None'}

TRADE-SPECIFIC RULES:
${tradeRules}

Analyze the blueprint image and extract ALL measurable quantities. For each item:
1. Identify it from the drawing
2. Calculate quantity using appropriate formula
3. Assign confidence score (0-100) based on clarity
4. Note the formula or calculation used

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "name": "Architectural Shingles",
      "description": "30-year GAF Timberline shingles",
      "category": "roofing_material",
      "quantity": 24.5,
      "unit": "squares",
      "confidence_score": 87,
      "formula_used": "Roof area 2350 sq ft / 100 + 10% waste = 25.85 squares",
      "source_area": "Sheet A-1, main roof area",
      "notes": "Hip roof adds complexity"
    }
  ],
  "summary": "Takeoff complete. X items extracted covering Y trade categories.",
  "total_confidence": 82
}`

  // Note: In production, fetch the image and send as base64
  // For now, text-based extraction
  const response = await client.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          // When blueprint_url is provided, add image:
          // { type: 'image', source: { type: 'url', url: input.blueprint_url } }
        ],
      },
    ],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    return {
      items: parsed.items ?? [],
      summary: parsed.summary ?? '',
      total_confidence: parsed.total_confidence ?? 0,
      processing_time_ms: Date.now() - startTime,
      raw_response: rawText,
    }
  } catch {
    return {
      items: [],
      summary: 'Processing failed — manual review required.',
      total_confidence: 0,
      processing_time_ms: Date.now() - startTime,
      raw_response: rawText,
    }
  }
}

// Apply trade-specific material expansion rules
export function applyTradeRules(items: ExtractedItem[], trade: string): ExtractedItem[] {
  const expanded: ExtractedItem[] = [...items]

  if (trade === 'roofing') {
    const shingles = items.find(i => i.name.toLowerCase().includes('shingle'))
    if (shingles) {
      // Auto-add related materials
      expanded.push({
        name: 'Roofing Nails',
        description: '1.75" galvanized coil nails',
        category: 'fasteners',
        quantity: Math.ceil(shingles.quantity * 2.5),
        unit: 'lbs',
        confidence_score: 95,
        formula_used: `${shingles.quantity} squares × 2.5 lbs/square`,
        source_area: 'Calculated from shingle quantity',
      })
      expanded.push({
        name: 'Synthetic Underlayment',
        description: '10 sq roll synthetic felt',
        category: 'underlayment',
        quantity: Math.ceil(shingles.quantity),
        unit: 'squares',
        confidence_score: 95,
        formula_used: '1:1 with shingle area',
        source_area: 'Calculated from shingle quantity',
      })
    }
  }

  return expanded
}
