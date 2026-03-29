import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/alfred/system-prompt'

export const maxDuration = 60

// Rate limiting: 30 messages per user per hour
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Alfred: ANTHROPIC_API_KEY is missing')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'You\'ve reached the message limit (30/hour). Please try again later.' },
        { status: 429 }
      )
    }

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

    // Use non-streaming for reliability on Vercel
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ content: text })
  } catch (error: any) {
    const errMsg = error?.message ?? String(error)
    console.error('Alfred chat error:', errMsg)
    console.error('Alfred chat stack:', error?.stack)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
