import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/alfred/system-prompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, role, organization:organizations(name, industry)')
    .eq('id', user.id)
    .single()

  const { messages, currentPage } = await request.json()

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
    max_tokens: 1024,
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
    },
  })
}
