import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/alfred/system-prompt'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, role, organization:organizations(name, industry)')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { messages, currentPage } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const org = (profile as any)?.organization
    const systemPrompt = buildSystemPrompt({
      userName: profile?.first_name ?? 'there',
      userRole: profile?.role ?? 'user',
      orgName: org?.name ?? 'your organization',
      orgIndustry: org?.industry?.replace(/_/g, ' ') ?? 'contracting',
      currentPage: currentPage ?? '/',
    })

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Alfred chat error:', error?.message ?? error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
