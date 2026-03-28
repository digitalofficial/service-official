import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceTemplateProps {
  invoice: any
  organization: any
  customer: any
  lineItems: any[]
  showActions?: boolean
}

export function InvoiceTemplate({ invoice, organization, customer, lineItems, showActions = false }: InvoiceTemplateProps) {
  const primaryColor = organization?.primary_color ?? '#2563eb'
  const secondaryColor = organization?.secondary_color ?? '#1e3a5f'

  return (
    <div className="bg-white max-w-[800px] mx-auto" id="invoice-content">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; size: letter; }
        }
      `}</style>

      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-start gap-4">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-14 w-auto object-contain" />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {organization?.name?.[0] ?? 'S'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: secondaryColor }}>
                {organization?.name}
              </h1>
              {organization?.phone && <p className="text-sm text-gray-500">{organization.phone}</p>}
              {organization?.email && <p className="text-sm text-gray-500">{organization.email}</p>}
              {organization?.website && <p className="text-sm text-gray-500">{organization.website}</p>}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>
              INVOICE
            </h2>
            <p className="text-sm text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Addresses + Invoice Details */}
        <div className="grid grid-cols-3 gap-8 mb-10">
          {/* From */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
            <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
            {organization?.address_line1 && <p className="text-sm text-gray-600">{organization.address_line1}</p>}
            {organization?.city && (
              <p className="text-sm text-gray-600">{organization.city}, {organization.state} {organization.zip}</p>
            )}
            {organization?.license_number && (
              <p className="text-xs text-gray-400 mt-1">License: {organization.license_number}</p>
            )}
          </div>

          {/* Bill To */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            {customer ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
                </p>
                {customer.company_name && customer.first_name && (
                  <p className="text-sm text-gray-600">{customer.first_name} {customer.last_name}</p>
                )}
                {customer.address_line1 && <p className="text-sm text-gray-600">{customer.address_line1}</p>}
                {customer.city && (
                  <p className="text-sm text-gray-600">{customer.city}, {customer.state} {customer.zip}</p>
                )}
                {customer.email && <p className="text-sm text-gray-500 mt-1">{customer.email}</p>}
                {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-400">No customer assigned</p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Date:</span>
                <span className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
              )}
              {invoice.type && invoice.type !== 'standard' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{invoice.type}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-500">Amount Due:</span>
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(invoice.amount_due ?? invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {invoice.status === 'paid' && (
          <div className="mb-6 py-2 px-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <span className="text-green-700 font-bold text-sm uppercase tracking-wider">Paid in Full</span>
            {invoice.paid_at && (
              <span className="text-green-600 text-sm ml-2">— {formatDate(invoice.paid_at)}</span>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th className="text-left text-xs font-semibold text-white px-4 py-3 rounded-tl-lg">Description</th>
                <th className="text-center text-xs font-semibold text-white px-4 py-3 w-20">Qty</th>
                <th className="text-center text-xs font-semibold text-white px-4 py-3 w-20">Unit</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-28">Unit Price</th>
                <th className="text-right text-xs font-semibold text-white px-4 py-3 w-28 rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item: any, i: number) => (
                <tr key={item.id ?? i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{item.unit ?? 'ea'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.unit_cost)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unit_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-base font-bold pt-3 mt-1 border-t-2"
              style={{ borderColor: primaryColor }}
            >
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            {(invoice.amount_paid ?? 0) > 0 && invoice.amount_paid < invoice.total && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-600">-{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-base font-bold" style={{ color: primaryColor }}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoice.amount_due)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms & Notes */}
        {(invoice.terms || invoice.notes) && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            {invoice.terms && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Thank you for your business — {organization?.name}
          </p>
        </div>
      </div>
    </div>
  )
}
