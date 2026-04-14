import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// ROC-standard inspection templates with comprehensive checklists
const SYSTEM_TEMPLATES = [
  {
    name: 'Rough Framing Inspection',
    description: 'Pre-drywall framing inspection per IRC/ROC standards',
    trade: 'framing',
    category: 'structural',
    sections: [
      { name: 'Foundation & Sill Plate', items: [
        { label: 'Anchor bolts properly placed (7" min embedment, 6ft max spacing)', type: 'pass_fail', is_required: true },
        { label: 'Sill plate properly attached and sealed', type: 'pass_fail', is_required: true },
        { label: 'Mudsill material is pressure-treated or approved species', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Wall Framing', items: [
        { label: 'Studs at correct spacing (16" or 24" OC per plans)', type: 'pass_fail', is_required: true },
        { label: 'Double top plates installed and properly lapped', type: 'pass_fail', is_required: true },
        { label: 'Headers sized correctly for span (per engineering)', type: 'pass_fail', is_required: true },
        { label: 'Cripple studs and king studs at openings', type: 'pass_fail', is_required: true },
        { label: 'Corner bracing or sheathing per code', type: 'pass_fail', is_required: true },
        { label: 'Fire blocking at 10ft vertical and floor levels', type: 'pass_fail', is_required: true },
        { label: 'Proper nailing schedule followed', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Floor/Ceiling Framing', items: [
        { label: 'Joists at correct spacing and size per plans', type: 'pass_fail', is_required: true },
        { label: 'Hangers installed where required', type: 'pass_fail', is_required: true },
        { label: 'Bridging/blocking installed', type: 'pass_fail', is_required: false },
        { label: 'Bearing points properly supported', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Roof Framing', items: [
        { label: 'Rafters/trusses at correct spacing', type: 'pass_fail', is_required: true },
        { label: 'Ridge board/beam properly sized', type: 'pass_fail', is_required: true },
        { label: 'Hurricane ties/straps installed', type: 'pass_fail', is_required: true },
        { label: 'Roof sheathing properly nailed (6" edges, 12" field)', type: 'pass_fail', is_required: true },
        { label: 'Ventilation openings per code (1:150 or 1:300)', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Rough Electrical Inspection',
    description: 'Pre-cover electrical rough-in per NEC standards',
    trade: 'electrical',
    category: 'electrical',
    sections: [
      { name: 'Service & Panel', items: [
        { label: 'Panel properly mounted and accessible (36" clearance)', type: 'pass_fail', is_required: true },
        { label: 'Service entrance cable properly sized', type: 'pass_fail', is_required: true },
        { label: 'Grounding electrode system installed', type: 'pass_fail', is_required: true },
        { label: 'Main breaker sized correctly', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Branch Circuits', items: [
        { label: 'Wire gauge matches breaker size (14AWG/15A, 12AWG/20A)', type: 'pass_fail', is_required: true },
        { label: 'Outlets every 12ft of wall space', type: 'pass_fail', is_required: true },
        { label: 'Outlet within 6ft of each doorway', type: 'pass_fail', is_required: true },
        { label: 'Dedicated circuits for kitchen, bath, laundry, garage', type: 'pass_fail', is_required: true },
        { label: 'GFCI protection at kitchen, bath, garage, outdoor, laundry', type: 'pass_fail', is_required: true },
        { label: 'AFCI protection in bedrooms and living areas', type: 'pass_fail', is_required: true },
        { label: 'Proper box fill calculations', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Wiring Methods', items: [
        { label: 'Romex properly stapled within 12" of box and every 4.5ft', type: 'pass_fail', is_required: true },
        { label: 'Wire protected where exposed (nail plates on studs)', type: 'pass_fail', is_required: true },
        { label: 'Proper wire connectors and no exposed splices', type: 'pass_fail', is_required: true },
        { label: 'Boxes flush with finished wall surface', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Safety Devices', items: [
        { label: 'Smoke detectors in every bedroom + hallway (hardwired, interconnected)', type: 'pass_fail', is_required: true },
        { label: 'CO detectors near sleeping areas', type: 'pass_fail', is_required: true },
        { label: 'Bathroom exhaust fan vented to exterior', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Rough Plumbing Inspection',
    description: 'Pre-cover plumbing rough-in per IPC/UPC standards',
    trade: 'plumbing',
    category: 'plumbing',
    sections: [
      { name: 'Supply Lines', items: [
        { label: 'Main supply line properly sized (3/4" min)', type: 'pass_fail', is_required: true },
        { label: 'Branch lines properly sized (1/2" to fixtures)', type: 'pass_fail', is_required: true },
        { label: 'Shut-off valves at each fixture', type: 'pass_fail', is_required: true },
        { label: 'Pressure test passed (no leaks at test pressure)', type: 'pass_fail', is_required: true },
        { label: 'Pipe properly supported and strapped', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Drain, Waste & Vent', items: [
        { label: 'Proper pipe sizing (3" toilet, 2" shower, 1.5" sink)', type: 'pass_fail', is_required: true },
        { label: 'Proper slope on horizontal drains (1/4" per foot)', type: 'pass_fail', is_required: true },
        { label: 'Cleanouts at base of stacks and every 100ft', type: 'pass_fail', is_required: true },
        { label: 'Vent pipes extend through roof (6" min above)', type: 'pass_fail', is_required: true },
        { label: 'Trap-to-vent distances within code limits', type: 'pass_fail', is_required: true },
        { label: 'DWV pressure test passed', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Fixtures', items: [
        { label: 'Toilet flange at correct height and distance from wall (12" center)', type: 'pass_fail', is_required: true },
        { label: 'Shower/tub drain properly positioned with trap', type: 'pass_fail', is_required: true },
        { label: 'Water heater TPR valve and discharge pipe installed', type: 'pass_fail', is_required: true },
        { label: 'Water heater on platform/stand if in garage', type: 'pass_fail', is_required: false },
      ]},
    ],
  },
  {
    name: 'Rough HVAC Inspection',
    description: 'Pre-cover HVAC rough-in inspection',
    trade: 'hvac',
    category: 'mechanical',
    sections: [
      { name: 'Equipment', items: [
        { label: 'Unit properly sized per Manual J load calculation', type: 'pass_fail', is_required: true },
        { label: 'Clearances around equipment per manufacturer specs', type: 'pass_fail', is_required: true },
        { label: 'Condensate drain properly routed', type: 'pass_fail', is_required: true },
        { label: 'Secondary drain pan in attic installations', type: 'pass_fail', is_required: false },
        { label: 'Refrigerant line set properly insulated', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Ductwork', items: [
        { label: 'Ducts properly sized per Manual D', type: 'pass_fail', is_required: true },
        { label: 'Duct connections sealed (mastic or approved tape)', type: 'pass_fail', is_required: true },
        { label: 'Return air not from bathroom, kitchen, or garage', type: 'pass_fail', is_required: true },
        { label: 'Supply registers in all habitable rooms', type: 'pass_fail', is_required: true },
        { label: 'Duct insulation R-value per code', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Combustion & Venting', items: [
        { label: 'Combustion air openings properly sized', type: 'pass_fail', is_required: true },
        { label: 'Flue/vent properly terminated', type: 'pass_fail', is_required: true },
        { label: 'CO detector installed near equipment', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Roofing Inspection',
    description: 'Roof installation inspection per IRC/manufacturer specs',
    trade: 'roofing',
    category: 'roofing',
    sections: [
      { name: 'Deck & Substrate', items: [
        { label: 'Roof decking properly nailed and in good condition', type: 'pass_fail', is_required: true },
        { label: 'No more than 2 layers of existing shingles', type: 'pass_fail', is_required: true },
        { label: 'Damaged sheathing replaced', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Underlayment & Barriers', items: [
        { label: 'Underlayment installed per code', type: 'pass_fail', is_required: true },
        { label: 'Ice & water shield at eaves, valleys, and penetrations', type: 'pass_fail', is_required: false },
        { label: 'Drip edge installed at eaves and rakes', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Shingles/Material', items: [
        { label: 'Shingles installed per manufacturer specs', type: 'pass_fail', is_required: true },
        { label: 'Proper exposure and offset maintained', type: 'pass_fail', is_required: true },
        { label: 'Starter strip at eaves', type: 'pass_fail', is_required: true },
        { label: 'Ridge cap properly installed', type: 'pass_fail', is_required: true },
        { label: 'Nailing in manufacturer nail zone (4-6 nails per shingle)', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Flashing & Penetrations', items: [
        { label: 'Step flashing at wall intersections', type: 'pass_fail', is_required: true },
        { label: 'Valley flashing/weaving properly done', type: 'pass_fail', is_required: true },
        { label: 'Pipe boots/flashing at all penetrations', type: 'pass_fail', is_required: true },
        { label: 'Chimney flashing and counter-flashing', type: 'pass_fail', is_required: false },
      ]},
      { name: 'Ventilation', items: [
        { label: 'Ridge vent or adequate exhaust ventilation', type: 'pass_fail', is_required: true },
        { label: 'Soffit/intake vents clear and functional', type: 'pass_fail', is_required: true },
        { label: 'Balanced intake and exhaust per code (1:150 or 1:300)', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Final Building Inspection',
    description: 'Final walkthrough inspection before CO/occupancy',
    trade: 'general',
    category: 'general',
    sections: [
      { name: 'Life Safety', items: [
        { label: 'Smoke detectors functional in all required locations', type: 'pass_fail', is_required: true },
        { label: 'CO detectors functional', type: 'pass_fail', is_required: true },
        { label: 'Egress windows operable and meet min size requirements', type: 'pass_fail', is_required: true },
        { label: 'Stair handrails/guards properly installed (34-38" height)', type: 'pass_fail', is_required: true },
        { label: 'Guard rails at 30"+ above grade (max 4" baluster spacing)', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Electrical Final', items: [
        { label: 'All outlets and switches have covers', type: 'pass_fail', is_required: true },
        { label: 'GFCI outlets test properly', type: 'pass_fail', is_required: true },
        { label: 'Panel cover on and circuits labeled', type: 'pass_fail', is_required: true },
        { label: 'All fixtures operational', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Plumbing Final', items: [
        { label: 'All fixtures operational (no leaks)', type: 'pass_fail', is_required: true },
        { label: 'Hot water functional', type: 'pass_fail', is_required: true },
        { label: 'Toilets flush and fill properly', type: 'pass_fail', is_required: true },
        { label: 'No visible leaks at any connection', type: 'pass_fail', is_required: true },
      ]},
      { name: 'HVAC Final', items: [
        { label: 'System heats and cools properly', type: 'pass_fail', is_required: true },
        { label: 'Thermostat functional', type: 'pass_fail', is_required: true },
        { label: 'All registers deliver air', type: 'pass_fail', is_required: true },
      ]},
      { name: 'General', items: [
        { label: 'Address numbers visible from street', type: 'pass_fail', is_required: true },
        { label: 'Doors and windows operate properly', type: 'pass_fail', is_required: true },
        { label: 'Floor surfaces complete and level', type: 'pass_fail', is_required: true },
        { label: 'Drywall finished and painted', type: 'pass_fail', is_required: true },
        { label: 'Minimum ceiling height met (7ft habitable, 6\'8" bath)', type: 'pass_fail', is_required: true },
        { label: 'Site drainage away from building', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Concrete/Foundation Inspection',
    description: 'Pre-pour foundation and footing inspection',
    trade: 'concrete',
    category: 'structural',
    sections: [
      { name: 'Excavation & Forms', items: [
        { label: 'Footing depth below frost line per local code', type: 'pass_fail', is_required: true },
        { label: 'Footing width meets minimum (2x wall width)', type: 'pass_fail', is_required: true },
        { label: 'Forms plumb, level, and properly braced', type: 'pass_fail', is_required: true },
        { label: 'Soil bearing capacity adequate (no soft spots)', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Reinforcement', items: [
        { label: 'Rebar size and spacing per plans', type: 'pass_fail', is_required: true },
        { label: 'Rebar properly tied and supported on chairs', type: 'pass_fail', is_required: true },
        { label: 'Minimum 3" cover from soil, 2" from forms', type: 'pass_fail', is_required: true },
        { label: 'Dowels for vertical connection properly placed', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Slab Prep', items: [
        { label: 'Vapor barrier installed (10-mil minimum)', type: 'pass_fail', is_required: true },
        { label: 'Gravel/base material compacted', type: 'pass_fail', is_required: true },
        { label: 'Wire mesh or fiber reinforcement per plans', type: 'pass_fail', is_required: false },
        { label: 'Control/expansion joints planned', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
  {
    name: 'Insulation Inspection',
    description: 'Pre-drywall insulation inspection per energy code',
    trade: 'insulation',
    category: 'energy',
    sections: [
      { name: 'Wall Insulation', items: [
        { label: 'R-value meets code requirement for climate zone', type: 'pass_fail', is_required: true },
        { label: 'No gaps, voids, or compression in batts', type: 'pass_fail', is_required: true },
        { label: 'Vapor barrier on warm side (if required)', type: 'pass_fail', is_required: false },
        { label: 'Insulation around outlets and penetrations', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Ceiling/Attic Insulation', items: [
        { label: 'R-value meets code (R-38 to R-60 depending on zone)', type: 'pass_fail', is_required: true },
        { label: 'Baffles at eaves to maintain ventilation', type: 'pass_fail', is_required: true },
        { label: 'No insulation blocking recessed lights (unless IC-rated)', type: 'pass_fail', is_required: true },
        { label: 'Attic access insulated', type: 'pass_fail', is_required: true },
      ]},
      { name: 'Air Sealing', items: [
        { label: 'Penetrations sealed (plumbing, electrical, HVAC)', type: 'pass_fail', is_required: true },
        { label: 'Rim/band joist insulated and sealed', type: 'pass_fail', is_required: true },
        { label: 'Window and door frames sealed', type: 'pass_fail', is_required: true },
      ]},
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
    if ('error' in result) return result.error
    const { user, profile, supabase } = result

    let created = 0

    for (const tmpl of SYSTEM_TEMPLATES) {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('inspection_templates')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('name', tmpl.name)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Create template
      const { data: template, error } = await supabase
        .from('inspection_templates')
        .insert({
          organization_id: profile.organization_id,
          name: tmpl.name,
          description: tmpl.description,
          trade: tmpl.trade,
          category: tmpl.category,
          is_system: false,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single()

      if (error || !template) { console.error('Template create error:', error?.message); continue }

      // Create sections and items
      for (let si = 0; si < tmpl.sections.length; si++) {
        const section = tmpl.sections[si]
        const { data: sec } = await supabase
          .from('template_sections')
          .insert({
            template_id: template.id,
            name: section.name,
            order_index: si,
          })
          .select()
          .single()

        if (sec && section.items.length > 0) {
          await supabase.from('template_items').insert(
            section.items.map((item, ii) => ({
              template_id: template.id,
              section_id: sec.id,
              label: item.label,
              type: item.type,
              is_required: item.is_required,
              order_index: ii,
            }))
          )
        }
      }

      created++
    }

    return NextResponse.json({ success: true, created, total: SYSTEM_TEMPLATES.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to seed templates' }, { status: 500 })
  }
}
