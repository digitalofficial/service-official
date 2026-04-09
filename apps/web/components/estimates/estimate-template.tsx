import { formatCurrency, formatDate } from '@/lib/utils'

interface EstimateTemplateProps {
  estimate: any
  organization: any
  customer: any
  lineItems: any[]
}

export function EstimateTemplate({ estimate, organization, customer, lineItems }: EstimateTemplateProps) {
  const primaryColor = organization?.primary_color ?? '#2563eb'
  const secondaryColor = organization?.secondary_color ?? '#1e3a5f'

  const optionalItems = lineItems.filter((i: any) => i.is_optional)
  const requiredItems = lineItems.filter((i: any) => !i.is_optional)

  return (
    <div className="bg-white max-w-[800px] mx-auto" id="estimate-content">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #estimate-content, #estimate-content * { visibility: visible; }
          #estimate-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; size: letter; }
        }
      `}</style>

      <div className="p-5 sm:p-8 md:p-10">
        {/* Header — stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-start gap-3 sm:gap-4">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-10 sm:h-14 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0" style={{ backgroundColor: primaryColor }}>
                {organization?.name?.[0] ?? 'S'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: secondaryColor }}>{organization?.name}</h1>
              {organization?.phone && <p className="text-xs sm:text-sm text-gray-500">{organization.phone}</p>}
              {organization?.email && <p className="text-xs sm:text-sm text-gray-500 truncate">{organization.email}</p>}
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>ESTIMATE</h2>
            <p className="text-sm text-gray-500 mt-0.5">{estimate.estimate_number}</p>
          </div>
        </div>

        {/* Addresses — 1 col on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">From</p>
            <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
            {organization?.address_line1 && <p className="text-sm text-gray-600">{organization.address_line1}</p>}
            {organization?.city && <p className="text-sm text-gray-600">{organization.city}, {organization.state} {organization.zip}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Prepared For</p>
            {customer ? (
              <>
                <p className="text-sm font-medium text-gray-900">{customer.company_name ?? `${customer.first_name} ${customer.last_name}`}</p>
                {customer.address_line1 && <p className="text-sm text-gray-600">{customer.address_line1}</p>}
                {customer.city && <p className="text-sm text-gray-600">{customer.city}, {customer.state} {customer.zip}</p>}
                {customer.email && <p className="text-sm text-gray-500 mt-1 break-all">{customer.email}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-400">No customer assigned</p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-medium">{formatDate(estimate.issue_date)}</span>
            </div>
            {estimate.expiry_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Valid Until:</span>
                <span className="font-medium">{formatDate(estimate.expiry_date)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">Total:</span>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>{formatCurrency(estimate.total)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {estimate.description && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Scope of Work</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.description}</p>
          </div>
        )}

        {/* Line Items */}
        <div className="mb-6 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th className="text-left text-xs font-semibold text-white px-4 py-3 rounded-tl-lg">Item</th>
                <th className="text-center text-xs font-semibold text-white px-4 py-3 w-16">Qty</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-28">Unit Price</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-28 rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody>
              {requiredItems.map((item: any, i: number) => (
                <tr key={item.id ?? i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.unit_cost)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total ?? item.quantity * item.unit_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Optional Items */}
        {optionalItems.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Optional Add-ons</p>
            <table className="w-full">
              <tbody>
                {optionalItems.map((item: any, i: number) => (
                  <tr key={item.id ?? i} className="border-b border-dashed border-gray-200">
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-gray-700">{item.name}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-gray-500">
                      +{formatCurrency(item.total ?? item.quantity * item.unit_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
            </div>
            {estimate.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-600">-{formatCurrency(estimate.discount_amount)}</span>
              </div>
            )}
            {estimate.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(estimate.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t-2" style={{ borderColor: primaryColor }}>
              <span>Total</span>
              <span>{formatCurrency(estimate.total)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {estimate.terms && (
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Terms & Conditions</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.terms}</p>
          </div>
        )}

        {/* Signature */}
        <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-gray-400 mb-8">Customer Signature</p>
            <div className="border-b border-gray-300 mb-1" />
            <p className="text-xs text-gray-400">Date</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-8">Authorized by {organization?.name}</p>
            <div className="border-b border-gray-300 mb-1" />
            <p className="text-xs text-gray-400">Date</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Thank you for considering {organization?.name}</p>
        </div>
      </div>
    </div>
  )
}
