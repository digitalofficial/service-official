import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatPhone, formatDate } from '@/lib/utils'
import { Plus, Users, Search, Mail, Phone, Building2, User, ChevronRight } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customers' }

interface Props {
  searchParams: { search?: string; type?: string; page?: string }
}

export default async function CustomersPage({ searchParams }: Props) {
  const { supabase, profile } = await getProfile()

  const page = Number(searchParams.page ?? 1)
  const perPage = 25

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (searchParams.search) {
    const s = searchParams.search
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,company_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`)
  }
  if (searchParams.type) {
    query = query.eq('type', searchParams.type)
  }

  const { data: customers, count } = await query

  const typeFilters = [
    { label: 'All', value: undefined },
    { label: 'Residential', value: 'residential' },
    { label: 'Commercial', value: 'commercial' },
    { label: 'Property Manager', value: 'property_manager' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        count={count ?? 0}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton entity="customers" />
            <Link href="/customers/new">
              <Button><Plus className="w-4 h-4 mr-2" />New Customer</Button>
            </Link>
          </div>
        }
      />

      {/* Type Filters */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {typeFilters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/customers?type=${f.value}` : '/customers'}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              searchParams.type === f.value || (!searchParams.type && !f.value)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <form>
          <input
            name="search"
            type="text"
            placeholder="Search customers..."
            defaultValue={searchParams.search}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Table — scrolls on mobile */}
      {!customers || customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No customers yet"
          description="Add your first customer to start managing your contacts."
          action={
            <Link href="/customers/new">
              <Button><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Contact</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Type</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Location</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Revenue</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Outstanding</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {c.company_name ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {c.company_name ?? `${c.first_name} ${c.last_name}`}
                          </p>
                          {c.company_name && c.first_name && (
                            <p className="text-xs text-gray-500">{c.first_name} {c.last_name}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {c.email && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {formatPhone(c.phone)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {c.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.city}{c.state ? `, ${c.state}` : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {formatCurrency(c.total_revenue ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={c.outstanding_balance > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                      {formatCurrency(c.outstanding_balance ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`}>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(count ?? 0) > perPage && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, count ?? 0)} of {count}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page * perPage < (count ?? 0) && (
              <Link
                href={`/customers?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
