import BrandPanel from '@/features/signup/BrandPanel'
import SignUpForm from '@/features/signup/SignUpForm'
import { MODEL_NAME } from '@/config'

export default function SignUpPage({ onNavigate }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-ink-50 lg:grid-cols-2">
      <BrandPanel />
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-bold tracking-tight text-navy-500">
              {MODEL_NAME}
            </span>
          </div>

          <header className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy-500 sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Join thousands of clinical practitioners using {MODEL_NAME}.
            </p>
          </header>

          <SignUpForm onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  )
}