// ============================================================
// SERVICE OFFICIAL — Automation Engine
// Trigger-based workflow automation
// ============================================================

export type TriggerEvent =
  // Project
  | 'project.created'
  | 'project.status_changed'
  | 'project.milestone_completed'
  // Lead
  | 'lead.created'
  | 'lead.status_changed'
  // Job
  | 'job.assigned'
  | 'job.status_changed'
  | 'job.completed'
  // Estimate
  | 'estimate.sent'
  | 'estimate.approved'
  | 'estimate.declined'
  | 'estimate.expiring_soon'
  // Invoice
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'invoice.partial_payment'
  // Expense
  | 'expense.submitted'
  | 'expense.approved'
  | 'expense.rejected'
  // RFI / CO
  | 'rfi.submitted'
  | 'rfi.answered'
  | 'change_order.submitted'
  | 'change_order.approved'
  | 'change_order.declined'
  // Messages
  | 'message.received'
  // Booking
  | 'booking.submitted'

export interface TriggerPayload {
  event: TriggerEvent
  organization_id: string
  entity_type: string
  entity_id: string
  data: Record<string, unknown>
  previous_data?: Record<string, unknown>
}

export interface AutomationAction {
  type: 'send_sms' | 'send_email' | 'send_push' | 'assign_job' | 'update_status' | 'create_notification' | 'webhook'
  config: Record<string, unknown>
}

export async function processTrigger(payload: TriggerPayload) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  // Find matching automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('organization_id', payload.organization_id)
    .eq('trigger_event', payload.event)
    .eq('is_active', true)

  if (!rules?.length) return

  for (const rule of rules) {
    if (!matchesConditions(payload.data, rule.trigger_conditions)) continue

    try {
      await executeActions(rule.actions as AutomationAction[], payload)

      // Log execution
      await supabase.from('automation_logs').insert({
        rule_id: rule.id,
        triggered_by: payload.event,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        status: 'success',
        actions_executed: rule.actions,
      })

      // Update run count
      await supabase
        .from('automation_rules')
        .update({ run_count: rule.run_count + 1, last_run_at: new Date().toISOString() })
        .eq('id', rule.id)
    } catch (error) {
      await supabase.from('automation_logs').insert({
        rule_id: rule.id,
        triggered_by: payload.event,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        status: 'error',
        error_message: String(error),
      })
    }
  }
}

function matchesConditions(data: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true

  for (const [key, value] of Object.entries(conditions)) {
    if (data[key] !== value) return false
  }
  return true
}

async function executeActions(actions: AutomationAction[], payload: TriggerPayload) {
  const { sendSMS, sendEmail, createNotification } = await import('@service-official/notifications')

  for (const action of actions) {
    switch (action.type) {
      case 'send_sms':
        if (action.config.to && action.config.body) {
          await sendSMS({
            to: interpolate(action.config.to as string, payload.data),
            body: interpolate(action.config.body as string, payload.data),
          })
        }
        break

      case 'send_email':
        if (action.config.to && action.config.subject) {
          await sendEmail({
            to: interpolate(action.config.to as string, payload.data),
            subject: interpolate(action.config.subject as string, payload.data),
            template: action.config.template as string ?? '',
            variables: payload.data,
          })
        }
        break

      case 'create_notification':
        if (action.config.user_id) {
          await createNotification({
            organization_id: payload.organization_id,
            user_id: action.config.user_id as string,
            type: action.config.notification_type as any ?? 'project_update',
            title: interpolate(action.config.title as string ?? '', payload.data),
            body: action.config.body ? interpolate(action.config.body as string, payload.data) : undefined,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
          })
        }
        break

      case 'webhook':
        if (action.config.url) {
          await fetch(action.config.url as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: payload.event, data: payload.data }),
          })
        }
        break
    }
  }
}

// Simple template interpolation: "Hello {{first_name}}"
function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''))
}

// ── Helper to fire triggers from API routes ──────────────────

export function trigger(event: TriggerEvent) {
  return (organization_id: string, entity_type: string, entity_id: string, data: Record<string, unknown>, previous_data?: Record<string, unknown>) => {
    // Fire and forget — don't await in critical path
    processTrigger({ event, organization_id, entity_type, entity_id, data, previous_data }).catch(console.error)
  }
}
