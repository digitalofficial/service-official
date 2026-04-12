import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { extractTakeoffFromBlueprint, applyTradeRules } from '@service-official/ai/takeoffs'

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile({ requireRole: ['owner', 'admin', 'estimator', 'project_manager'] })
    if ('error' in result) return result.error
    const { supabase } = result

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
    const extraction = await extractTakeoffFromBlueprint({
      blueprint_url,
      trade,
      sheet_title,
      scale,
    })

    // Apply trade-specific expansion rules
    const expandedItems = applyTradeRules(extraction.items, trade)

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
        ai_confidence: extraction.total_confidence,
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', takeoff_id)

    return NextResponse.json({
      data: {
        takeoff_id,
        items_extracted: expandedItems.length,
        total_confidence: extraction.total_confidence,
        summary: extraction.summary,
        processing_time_ms: extraction.processing_time_ms,
      },
      success: true,
    })
  } catch (error) {
    console.error('Takeoff processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
