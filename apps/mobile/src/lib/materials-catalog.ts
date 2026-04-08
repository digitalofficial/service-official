export interface CatalogItem {
  name: string
  category: string
  unit: string
  avgCost: number
}

export const MATERIAL_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Framing & Lumber',
  'Drywall & Finishing',
  'Flooring',
  'Painting',
  'Concrete & Masonry',
  'Hardware & Fasteners',
  'Safety & PPE',
  'General',
] as const

export const MATERIALS_CATALOG: CatalogItem[] = [
  // ─── Plumbing ───
  { name: 'PVC Pipe 1/2"', category: 'Plumbing', unit: 'ft', avgCost: 0.75 },
  { name: 'PVC Pipe 3/4"', category: 'Plumbing', unit: 'ft', avgCost: 1.10 },
  { name: 'PVC Pipe 1"', category: 'Plumbing', unit: 'ft', avgCost: 1.50 },
  { name: 'PVC Pipe 2"', category: 'Plumbing', unit: 'ft', avgCost: 2.50 },
  { name: 'PVC Pipe 4"', category: 'Plumbing', unit: 'ft', avgCost: 5.00 },
  { name: 'PVC Elbow 90°', category: 'Plumbing', unit: 'ea', avgCost: 1.25 },
  { name: 'PVC Tee', category: 'Plumbing', unit: 'ea', avgCost: 1.50 },
  { name: 'PVC Coupling', category: 'Plumbing', unit: 'ea', avgCost: 0.85 },
  { name: 'Copper Pipe 1/2"', category: 'Plumbing', unit: 'ft', avgCost: 3.50 },
  { name: 'Copper Pipe 3/4"', category: 'Plumbing', unit: 'ft', avgCost: 5.25 },
  { name: 'SharkBite Coupling 1/2"', category: 'Plumbing', unit: 'ea', avgCost: 8.50 },
  { name: 'SharkBite Coupling 3/4"', category: 'Plumbing', unit: 'ea', avgCost: 10.00 },
  { name: 'Ball Valve 1/2"', category: 'Plumbing', unit: 'ea', avgCost: 12.00 },
  { name: 'Gate Valve 3/4"', category: 'Plumbing', unit: 'ea', avgCost: 15.00 },
  { name: 'Water Heater Element', category: 'Plumbing', unit: 'ea', avgCost: 22.00 },
  { name: 'Wax Ring (Toilet)', category: 'Plumbing', unit: 'ea', avgCost: 5.00 },
  { name: 'Supply Line Braided', category: 'Plumbing', unit: 'ea', avgCost: 8.00 },
  { name: 'P-Trap 1-1/2"', category: 'Plumbing', unit: 'ea', avgCost: 7.50 },
  { name: 'Pipe Insulation 3/4"', category: 'Plumbing', unit: 'ft', avgCost: 1.00 },
  { name: 'Teflon Tape', category: 'Plumbing', unit: 'ea', avgCost: 1.50 },

  // ─── Electrical ───
  { name: 'Romex 14/2 NM-B', category: 'Electrical', unit: 'ft', avgCost: 0.65 },
  { name: 'Romex 12/2 NM-B', category: 'Electrical', unit: 'ft', avgCost: 0.85 },
  { name: 'Romex 10/3 NM-B', category: 'Electrical', unit: 'ft', avgCost: 2.00 },
  { name: 'THHN Wire 12 AWG', category: 'Electrical', unit: 'ft', avgCost: 0.35 },
  { name: 'THHN Wire 10 AWG', category: 'Electrical', unit: 'ft', avgCost: 0.55 },
  { name: 'Outlet Receptacle 15A', category: 'Electrical', unit: 'ea', avgCost: 1.50 },
  { name: 'Outlet Receptacle 20A', category: 'Electrical', unit: 'ea', avgCost: 3.00 },
  { name: 'GFCI Outlet 15A', category: 'Electrical', unit: 'ea', avgCost: 15.00 },
  { name: 'GFCI Outlet 20A', category: 'Electrical', unit: 'ea', avgCost: 18.00 },
  { name: 'Light Switch Single', category: 'Electrical', unit: 'ea', avgCost: 2.00 },
  { name: 'Light Switch 3-Way', category: 'Electrical', unit: 'ea', avgCost: 4.50 },
  { name: 'Dimmer Switch', category: 'Electrical', unit: 'ea', avgCost: 18.00 },
  { name: 'Breaker 15A Single Pole', category: 'Electrical', unit: 'ea', avgCost: 8.00 },
  { name: 'Breaker 20A Single Pole', category: 'Electrical', unit: 'ea', avgCost: 9.00 },
  { name: 'Breaker 30A Double Pole', category: 'Electrical', unit: 'ea', avgCost: 14.00 },
  { name: 'Junction Box', category: 'Electrical', unit: 'ea', avgCost: 2.50 },
  { name: 'Outlet Box (Old Work)', category: 'Electrical', unit: 'ea', avgCost: 3.50 },
  { name: 'Wire Nuts (bag of 25)', category: 'Electrical', unit: 'bag', avgCost: 4.00 },
  { name: 'EMT Conduit 1/2" x 10ft', category: 'Electrical', unit: 'ea', avgCost: 5.00 },
  { name: 'Electrical Tape', category: 'Electrical', unit: 'ea', avgCost: 2.50 },

  // ─── HVAC ───
  { name: 'Air Filter 16x20x1', category: 'HVAC', unit: 'ea', avgCost: 8.00 },
  { name: 'Air Filter 20x25x1', category: 'HVAC', unit: 'ea', avgCost: 10.00 },
  { name: 'Refrigerant R-410A (lb)', category: 'HVAC', unit: 'lb', avgCost: 15.00 },
  { name: 'Thermostat Wire 18/5', category: 'HVAC', unit: 'ft', avgCost: 0.45 },
  { name: 'Capacitor 35/5 MFD', category: 'HVAC', unit: 'ea', avgCost: 18.00 },
  { name: 'Capacitor 45/5 MFD', category: 'HVAC', unit: 'ea', avgCost: 20.00 },
  { name: 'Contactor 2-Pole 30A', category: 'HVAC', unit: 'ea', avgCost: 22.00 },
  { name: 'Condensate Drain Line', category: 'HVAC', unit: 'ft', avgCost: 1.00 },
  { name: 'Duct Tape (HVAC Grade)', category: 'HVAC', unit: 'ea', avgCost: 12.00 },
  { name: 'Flex Duct 6" x 25ft', category: 'HVAC', unit: 'ea', avgCost: 35.00 },

  // ─── Roofing ───
  { name: 'Asphalt Shingles (bundle)', category: 'Roofing', unit: 'bundle', avgCost: 35.00 },
  { name: 'Roofing Felt 15lb', category: 'Roofing', unit: 'roll', avgCost: 22.00 },
  { name: 'Roofing Felt 30lb', category: 'Roofing', unit: 'roll', avgCost: 28.00 },
  { name: 'Ice & Water Shield', category: 'Roofing', unit: 'roll', avgCost: 65.00 },
  { name: 'Ridge Vent', category: 'Roofing', unit: 'ft', avgCost: 3.50 },
  { name: 'Drip Edge', category: 'Roofing', unit: 'ft', avgCost: 1.50 },
  { name: 'Roof Flashing', category: 'Roofing', unit: 'ea', avgCost: 8.00 },
  { name: 'Roofing Nails 1-1/4" (5lb)', category: 'Roofing', unit: 'box', avgCost: 12.00 },
  { name: 'Roof Cement / Tar', category: 'Roofing', unit: 'ea', avgCost: 8.00 },
  { name: 'Pipe Boot Flashing', category: 'Roofing', unit: 'ea', avgCost: 12.00 },

  // ─── Framing & Lumber ───
  { name: '2x4 x 8ft Stud', category: 'Framing & Lumber', unit: 'ea', avgCost: 4.50 },
  { name: '2x4 x 10ft', category: 'Framing & Lumber', unit: 'ea', avgCost: 6.00 },
  { name: '2x6 x 8ft', category: 'Framing & Lumber', unit: 'ea', avgCost: 7.50 },
  { name: '2x6 x 12ft', category: 'Framing & Lumber', unit: 'ea', avgCost: 11.00 },
  { name: '4x8 Plywood 1/2"', category: 'Framing & Lumber', unit: 'sheet', avgCost: 35.00 },
  { name: '4x8 Plywood 3/4"', category: 'Framing & Lumber', unit: 'sheet', avgCost: 48.00 },
  { name: '4x8 OSB 7/16"', category: 'Framing & Lumber', unit: 'sheet', avgCost: 22.00 },
  { name: 'Simpson Joist Hanger', category: 'Framing & Lumber', unit: 'ea', avgCost: 3.00 },
  { name: 'Construction Adhesive', category: 'Framing & Lumber', unit: 'tube', avgCost: 5.00 },
  { name: 'Pressure Treated 4x4 x 8ft', category: 'Framing & Lumber', unit: 'ea', avgCost: 14.00 },

  // ─── Drywall & Finishing ───
  { name: '4x8 Drywall 1/2"', category: 'Drywall & Finishing', unit: 'sheet', avgCost: 12.00 },
  { name: '4x8 Drywall 5/8"', category: 'Drywall & Finishing', unit: 'sheet', avgCost: 15.00 },
  { name: 'Joint Compound (5 gal)', category: 'Drywall & Finishing', unit: 'bucket', avgCost: 18.00 },
  { name: 'Drywall Tape (paper)', category: 'Drywall & Finishing', unit: 'roll', avgCost: 4.00 },
  { name: 'Mesh Drywall Tape', category: 'Drywall & Finishing', unit: 'roll', avgCost: 5.50 },
  { name: 'Drywall Screws 1-1/4" (1lb)', category: 'Drywall & Finishing', unit: 'box', avgCost: 6.00 },
  { name: 'Corner Bead 8ft', category: 'Drywall & Finishing', unit: 'ea', avgCost: 3.50 },
  { name: 'Sanding Sponge', category: 'Drywall & Finishing', unit: 'ea', avgCost: 4.00 },

  // ─── Flooring ───
  { name: 'LVP Flooring (per sqft)', category: 'Flooring', unit: 'sqft', avgCost: 3.50 },
  { name: 'Underlayment Roll', category: 'Flooring', unit: 'roll', avgCost: 25.00 },
  { name: 'Transition Strip', category: 'Flooring', unit: 'ea', avgCost: 12.00 },
  { name: 'Floor Leveler (25lb)', category: 'Flooring', unit: 'bag', avgCost: 22.00 },
  { name: 'Tile Adhesive (thin-set)', category: 'Flooring', unit: 'bag', avgCost: 18.00 },
  { name: 'Grout (10lb)', category: 'Flooring', unit: 'bag', avgCost: 15.00 },
  { name: 'Tile Spacers 1/4"', category: 'Flooring', unit: 'bag', avgCost: 4.00 },
  { name: 'Quarter Round Trim 8ft', category: 'Flooring', unit: 'ea', avgCost: 5.00 },

  // ─── Painting ───
  { name: 'Interior Paint (gallon)', category: 'Painting', unit: 'gal', avgCost: 35.00 },
  { name: 'Exterior Paint (gallon)', category: 'Painting', unit: 'gal', avgCost: 45.00 },
  { name: 'Primer (gallon)', category: 'Painting', unit: 'gal', avgCost: 25.00 },
  { name: 'Painter\'s Tape', category: 'Painting', unit: 'roll', avgCost: 6.00 },
  { name: 'Drop Cloth 9x12', category: 'Painting', unit: 'ea', avgCost: 8.00 },
  { name: 'Roller Cover 9"', category: 'Painting', unit: 'ea', avgCost: 5.00 },
  { name: 'Paint Brush 2"', category: 'Painting', unit: 'ea', avgCost: 8.00 },
  { name: 'Caulk (paintable)', category: 'Painting', unit: 'tube', avgCost: 5.00 },

  // ─── Concrete & Masonry ───
  { name: 'Concrete Mix 60lb', category: 'Concrete & Masonry', unit: 'bag', avgCost: 5.50 },
  { name: 'Concrete Mix 80lb', category: 'Concrete & Masonry', unit: 'bag', avgCost: 7.00 },
  { name: 'Mortar Mix 60lb', category: 'Concrete & Masonry', unit: 'bag', avgCost: 6.50 },
  { name: 'Rebar #4 x 20ft', category: 'Concrete & Masonry', unit: 'ea', avgCost: 12.00 },
  { name: 'Anchor Bolt 1/2" x 6"', category: 'Concrete & Masonry', unit: 'ea', avgCost: 2.50 },
  { name: 'Concrete Sealer (gallon)', category: 'Concrete & Masonry', unit: 'gal', avgCost: 30.00 },

  // ─── Hardware & Fasteners ───
  { name: 'Wood Screws #8 x 2" (1lb)', category: 'Hardware & Fasteners', unit: 'box', avgCost: 8.00 },
  { name: 'Wood Screws #10 x 3" (1lb)', category: 'Hardware & Fasteners', unit: 'box', avgCost: 10.00 },
  { name: 'Lag Bolts 3/8" x 3"', category: 'Hardware & Fasteners', unit: 'ea', avgCost: 0.75 },
  { name: 'Concrete Anchors 3/8"', category: 'Hardware & Fasteners', unit: 'ea', avgCost: 1.50 },
  { name: 'Silicone Caulk', category: 'Hardware & Fasteners', unit: 'tube', avgCost: 6.00 },
  { name: 'Expanding Foam', category: 'Hardware & Fasteners', unit: 'can', avgCost: 7.00 },

  // ─── Safety & PPE ───
  { name: 'Safety Glasses', category: 'Safety & PPE', unit: 'ea', avgCost: 5.00 },
  { name: 'Work Gloves', category: 'Safety & PPE', unit: 'pair', avgCost: 8.00 },
  { name: 'Dust Mask N95', category: 'Safety & PPE', unit: 'ea', avgCost: 2.50 },
  { name: 'Hard Hat', category: 'Safety & PPE', unit: 'ea', avgCost: 15.00 },

  // ─── General ───
  { name: 'Shop Towels (roll)', category: 'General', unit: 'roll', avgCost: 5.00 },
  { name: 'Trash Bags (contractor)', category: 'General', unit: 'box', avgCost: 15.00 },
  { name: 'Zip Ties (bag of 100)', category: 'General', unit: 'bag', avgCost: 5.00 },
  { name: 'WD-40', category: 'General', unit: 'can', avgCost: 6.00 },
]
