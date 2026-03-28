import { HardHat } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
          <HardHat className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Service Official</h1>
        <p className="text-sm text-gray-500 mt-0.5">The Contractor Operating System</p>
      </div>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
