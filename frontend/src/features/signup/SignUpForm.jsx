import { useState } from 'react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import InputField from '@/components/ui/InputField'
import PasswordField from '@/components/ui/PasswordField'
import { CheckIcon, MailIcon, UserIcon } from '@/components/icons'
import { useForm } from '@/hooks/useForm'
import { initialValues, validateSignUp } from '@/features/signup/validation'
import { API_BASE_URL } from '@/config'

export default function SignUpForm({ onNavigate }) {
  const [apiError, setApiError] = useState(null)

  const { values, fieldProps, checkboxProps, isSubmitting, isSubmitted, handleSubmit } = useForm({
    initialValues,
    validate: validateSignUp,
    onSubmit: async (data) => {
      setApiError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            fullName: data.fullName,
            email: data.email,
            password: data.password,
          }),
        })

        const resData = await response.json().catch(() => ({}))

        if (!response.ok) {
          const errorMessage = resData.error || `Server error (${response.status})`
          setApiError(errorMessage)
          throw new Error(errorMessage)
        }
      } catch (err) {
        if (!apiError) {
          setApiError(err.message || 'Unable to connect to the server. Please check your backend.')
        }
        throw err
      }
    },
  })

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-600">
          <CheckIcon className="size-7" strokeWidth={2.25} />
        </span>
        <h2 className="text-lg font-semibold text-navy-500">Account created</h2>
        <p className="text-sm leading-relaxed text-ink-500">
          Welcome aboard, {values.fullName.trim().split(' ')[0]}.
        </p>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('login')}
          className="mt-4 rounded-xl bg-[#046DD6] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0493AE]"
        >
          Proceed to Sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
          {apiError}
        </div>
      )}

      <InputField
        label="Full name"
        icon={UserIcon}
        placeholder="John Doe"
        autoComplete="name"
        {...fieldProps('fullName')}
      />

      <InputField
        label="Email address"
        icon={MailIcon}
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...fieldProps('email')}
      />

      <PasswordField
        label="Password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        {...fieldProps('password')}
      />

      <PasswordField
        label="Confirm password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        {...fieldProps('confirmPassword')}
      />

      <Checkbox
        {...checkboxProps('acceptedTerms')}
        label={
          <>
            I agree to the{' '}
            <a href="#terms" className="font-medium text-primary-500 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" className="font-medium text-primary-500 hover:underline">
              Privacy Policy
            </a>
            .
          </>
        }
      />

      <Button type="submit" isLoading={isSubmitting} className="mt-1">
        {isSubmitting ? 'Creating your account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('login')}
          className="font-semibold text-primary-500 transition-colors hover:text-primary-600 hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}