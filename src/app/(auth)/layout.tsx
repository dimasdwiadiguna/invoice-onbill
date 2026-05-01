import { Logo } from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <a href="/" className="mb-8 flex items-center select-none">
        <Logo variant="full" height={40} />
      </a>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm px-8 py-10">
        {children}
      </div>
    </div>
  )
}
