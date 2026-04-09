import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <Image src="/icon.png" alt="Service Official" width={48} height={48} className="rounded-xl mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Service Official</h1>
        <p className="text-sm text-gray-500 mt-0.5">The Contractor Operating System</p>
      </div>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
