import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { extractTakeoffFromBlueprint, applyTradeRules } from '@service-official/ai/takeoffs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()

    const allowedRoles = ['owner', 'admin', 'estimator', 'project_manager']
    if (!allowedRoles.includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { takeoff_id, blueprint_url, trade, sheet_title, scale } = await request.json()

    if (!takeoff_id || !blueprint_url || !trade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Mark takeoff as processing
    await supabase
      .from('takeoffs')
      .update({ status: 'processing', processing_started_at: new Date().toISOString() })
      .eq('id', takeoff_id)

    // Run AI extraction
    const result = await extractTakeoffFromBlueprint({
      blueprint_url,
      trade,
      sheet_title,
      scale,
    })

    // Apply trade-specific expansion rules
    const expandedItems = applyTradeRules(result.items, trade)

    // Save items to DB
    const itemInserts = expandedItems.map(item => ({
      takeoff_id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      ai_quantity: item.quantity,
      confidence_score: item.confidence_score,
      formula_used: item.formula_used,
      source_coordinates: { area: item.source_area },
      is_reviewed: false,
      is_overridden: false,
    }))

    if (itemInserts.length > 0) {
      await supabase.from('takeoff_items').insert(itemInserts)
    }

    // Mark as ready for review
    await supabase
      .from('takeoffs')
      .update({
        status: 'review',
        ai_confidence: result.total_confidence,
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', takeoff_id)

    return NextResponse.json({
      data: {
        takeoff_id,
        items_extracted: expandedItems.length,
        total_confidence: result.total_confidence,
        summary: result.summary,
        processing_time_ms: result.processing_time_ms,
      },
      success: true,
    })
  } catch (error) {
    console.error('Takeoff processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
