import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

const STANDARD_ACCOUNTS = [
  // Assets (1000s)
  { account_number: '1000', name: 'Cash', type: 'asset', subtype: 'Current Asset' },
  { account_number: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'Current Asset' },
  { account_number: '1200', name: 'Retainage Receivable', type: 'asset', subtype: 'Current Asset' },
  { account_number: '1300', name: 'Inventory/Materials', type: 'asset', subtype: 'Current Asset' },
  { account_number: '1400', name: 'Prepaid Expenses', type: 'asset', subtype: 'Current Asset' },
  { account_number: '1500', name: 'Equipment', type: 'asset', subtype: 'Fixed Asset' },
  { account_number: '1600', name: 'Vehicles', type: 'asset', subtype: 'Fixed Asset' },
  { account_number: '1700', name: 'Accumulated Depreciation', type: 'asset', subtype: 'Fixed Asset' },
  // Liabilities (2000s)
  { account_number: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'Current Liability' },
  { account_number: '2100', name: 'Retainage Payable', type: 'liability', subtype: 'Current Liability' },
  { account_number: '2200', name: 'Accrued Expenses', type: 'liability', subtype: 'Current Liability' },
  { account_number: '2300', name: 'Sales Tax Payable', type: 'liability', subtype: 'Current Liability' },
  { account_number: '2400', name: 'Payroll Liabilities', type: 'liability', subtype: 'Current Liability' },
  { account_number: '2500', name: 'Notes Payable', type: 'liability', subtype: 'Long-term Liability' },
  { account_number: '2600', name: 'Credit Cards', type: 'liability', subtype: 'Current Liability' },
  // Equity (3000s)
  { account_number: '3000', name: "Owner's Equity", type: 'equity', subtype: 'Equity' },
  { account_number: '3100', name: 'Retained Earnings', type: 'equity', subtype: 'Equity' },
  { account_number: '3200', name: "Owner's Draw", type: 'equity', subtype: 'Equity' },
  // Revenue (4000s)
  { account_number: '4000', name: 'Contract Revenue', type: 'revenue', subtype: 'Operating Revenue' },
  { account_number: '4100', name: 'Change Order Revenue', type: 'revenue', subtype: 'Operating Revenue' },
  { account_number: '4200', name: 'T&M Revenue', type: 'revenue', subtype: 'Operating Revenue' },
  { account_number: '4300', name: 'Service Revenue', type: 'revenue', subtype: 'Operating Revenue' },
  { account_number: '4400', name: 'Other Income', type: 'revenue', subtype: 'Other Revenue' },
  // Expenses (5000-7000s)
  { account_number: '5000', name: 'Materials', type: 'expense', subtype: 'Cost of Goods Sold' },
  { account_number: '5100', name: 'Subcontractor Costs', type: 'expense', subtype: 'Cost of Goods Sold' },
  { account_number: '5200', name: 'Direct Labor', type: 'expense', subtype: 'Cost of Goods Sold' },
  { account_number: '5300', name: 'Equipment Rental', type: 'expense', subtype: 'Cost of Goods Sold' },
  { account_number: '5400', name: 'Permits & Fees', type: 'expense', subtype: 'Cost of Goods Sold' },
  { account_number: '6000', name: 'Payroll Expenses', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '6100', name: 'Insurance', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '6200', name: 'Vehicle Expenses', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '6300', name: 'Office Expenses', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '6400', name: 'Marketing', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '6500', name: 'Professional Services', type: 'expense', subtype: 'Operating Expense' },
  { account_number: '7000', name: 'Depreciation', type: 'expense', subtype: 'Operating Expense' },
]

export async function GET(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('account_number')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const body = await request.json()

    // Seed standard chart of accounts
    if (body.seed === true) {
      const rows = STANDARD_ACCOUNTS.map((a) => ({
        organization_id: profile.organization_id,
        ...a,
      }))

      const { data, error } = await supabase
        .from('accounts')
        .upsert(rows, { onConflict: 'organization_id,account_number' })
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ data, seeded: true })
    }

    // Single account create
    const { account_number, name, type, subtype, parent_id, description } = body

    if (!account_number || !name || !type) {
      return NextResponse.json({ error: 'Account number, name, and type are required' }, { status: 400 })
    }

    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        organization_id: profile.organization_id,
        account_number,
        name,
        type,
        subtype: subtype || null,
        parent_id: parent_id || null,
        description: description || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create account' }, { status: 500 })
  }
}
