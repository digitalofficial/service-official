'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, Users, Receipt, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'

type ImportType = 'customers' | 'invoices'

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  total: number
}

export default function ImportDataPage() {
  const [importType, setImportType] = useState<ImportType>('customers')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        setColumns(results.meta.fields ?? [])
        setPreview(rows.slice(0, 5))
      },
      error: () => toast.error('Failed to parse CSV file'),
    })
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[]

        try {
          const res = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: importType, rows }),
          })

          const data = await res.json()
          if (!res.ok) {
            toast.error(data.error ?? 'Import failed')
            setImporting(false)
            return
          }

          setResult(data)
          toast.success(`Imported ${data.imported} ${importType}`)
        } catch {
          toast.error('Import failed — network error')
        }

        setImporting(false)
      },
    })
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setColumns([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const customerFields = [
    ['first_name', 'First Name'],
    ['last_name', 'Last Name'],
    ['company_name', 'Company Name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['address', 'Street Address'],
    ['city', 'City'],
    ['state', 'State'],
    ['zip', 'Zip Code'],
    ['type', 'Customer Type (residential, commercial)'],
    ['notes', 'Notes'],
  ]

  const invoiceFields = [
    ['invoice_number', 'Invoice Number'],
    ['customer', 'Customer Name'],
    ['title', 'Title / Description'],
    ['date', 'Invoice Date'],
    ['due_date', 'Due Date'],
    ['total', 'Total Amount'],
    ['amount_paid', 'Amount Paid'],
    ['status', 'Status (draft, sent, paid, overdue)'],
    ['item_name', 'Line Item Name'],
    ['quantity', 'Quantity'],
    ['unit_price', 'Unit Price'],
    ['notes', 'Notes'],
  ]

  const fields = importType === 'customers' ? customerFields : invoiceFields

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Import Data</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Import customers and invoices from CSV files exported from QuickBooks, Jobber, Housecall Pro, or any other software.
        </p>
      </div>

      {/* Import Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => { setImportType('customers'); reset() }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            importType === 'customers'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          Customers
        </button>
        <button
          onClick={() => { setImportType('invoices'); reset() }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            importType === 'invoices'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Receipt className="w-5 h-5" />
          Invoices
        </button>
      </div>

      {/* Expected Columns */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Expected CSV Columns for {importType === 'customers' ? 'Customers' : 'Invoices'}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Column names are flexible — we match common variations from QuickBooks, Jobber, Housecall Pro, and others.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">{key}</code>
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {!file ? (
          <label className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Supports .csv files from any platform</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{preview.length > 0 ? `${columns.length} columns detected` : 'Parsing...'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>Change File</Button>
            </div>

            {/* Column Preview */}
            {columns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Detected columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {columns.map(col => (
                    <span key={col} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{col}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Preview */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Preview (first {preview.length} rows):</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.slice(0, 8).map(col => (
                          <th key={col} className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{col}</th>
                        ))}
                        {columns.length > 8 && <th className="px-3 py-2 text-gray-400">+{columns.length - 8} more</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {columns.slice(0, 8).map(col => (
                            <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">{row[col]}</td>
                          ))}
                          {columns.length > 8 && <td className="px-3 py-2 text-gray-400">...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Button */}
      {file && preview.length > 0 && !result && (
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={importing} className="bg-blue-600 hover:bg-blue-700 px-6">
            {importing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Import {importType === 'customers' ? 'Customers' : 'Invoices'}</>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`border rounded-xl p-5 space-y-3 ${result.imported > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {result.imported > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="text-sm font-semibold text-gray-900">Import Complete</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Rows</p>
              <p className="font-bold text-gray-900">{result.total}</p>
            </div>
            <div>
              <p className="text-gray-500">Imported</p>
              <p className="font-bold text-green-700">{result.imported}</p>
            </div>
            <div>
              <p className="text-gray-500">Skipped</p>
              <p className="font-bold text-amber-700">{result.skipped}</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">{err}</p>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={reset}>Import More</Button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Export Tips</h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li><span className="font-medium text-gray-700">QuickBooks:</span> Reports &gt; Customer Contact List &gt; Export to CSV</li>
          <li><span className="font-medium text-gray-700">Jobber:</span> Clients &gt; Export &gt; Download CSV</li>
          <li><span className="font-medium text-gray-700">Housecall Pro:</span> Customers &gt; Export List</li>
          <li><span className="font-medium text-gray-700">ServiceTitan:</span> Customers &gt; Export &gt; CSV</li>
          <li><span className="font-medium text-gray-700">Excel/Sheets:</span> File &gt; Save As / Download as CSV</li>
        </ul>
      </div>
    </div>
  )
}
