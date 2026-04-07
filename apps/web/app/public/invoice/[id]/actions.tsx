'use client'

interface PublicInvoiceActionsProps {
  paymentIntentId: string | null
  amountDue: number
  invoiceStatus: string
  paymentsEnabled: boolean
}

export function PublicInvoiceActions({
  paymentIntentId,
  amountDue,
  invoiceStatus,
  paymentsEnabled,
}: PublicInvoiceActionsProps) {
  const showPayButton = amountDue > 0 && invoiceStatus !== 'paid'

  return (
    <div className="flex items-center gap-2 no-print">
      {showPayButton && (
        paymentIntentId && paymentsEnabled ? (
          <a
            href={`/pay/${paymentIntentId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Pay Now
          </a>
        ) : (
          <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
            Payment not available
          </span>
        )
      )}
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Download PDF
      </button>
    </div>
  )
}
