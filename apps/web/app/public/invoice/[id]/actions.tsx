'use client'

export function PublicInvoiceActions() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 no-print"
    >
      Download PDF
    </button>
  )
}
