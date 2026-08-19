import { SpinnerIcon } from '@/components/icons'
import { cn } from '@/utils/cn'

export default function Button({ isLoading = false, className, children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6',
        'bg-gradient-to-r from-primary-500 to-teal-500 font-semibold text-white',
        'shadow-lg shadow-primary-500/25 transition-all duration-200 select-none',
        'hover:from-primary-600 hover:to-teal-600 hover:shadow-primary-500/35 active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0',
        className
      )}
      {...props}
    >
      {isLoading && <SpinnerIcon className="size-4" />}
      {children}
    </button>
  )
}
