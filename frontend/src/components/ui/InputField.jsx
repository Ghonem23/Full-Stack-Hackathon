import { useId } from 'react'

import { AlertIcon } from '@/components/icons'
import { cn } from '@/utils/cn'

/**
 * Labelled text input with a leading icon, an optional trailing slot
 * (used by PasswordField for the show/hide toggle) and an error message
 * that is wired up for screen readers via aria-describedby.
 */
export default function InputField({
  label,
  icon: Icon,
  error,
  hint,
  trailing,
  className,
  id: idProp,
  ...props
}) {
  const generatedId = useId()
  const id = idProp ?? `${props.name}-${generatedId}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(error)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-navy-500">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 transition-colors',
              hasError ? 'text-danger-500/70' : 'text-ink-400'
            )}
          />
        )}

        <input
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(hasError && errorId, hint && hintId) || undefined}
          className={cn(
            'h-12 w-full rounded-xl border bg-white text-[0.95rem] text-ink-900',
            'placeholder:text-ink-300',
            'transition-[border-color,box-shadow] duration-200 outline-none',
            Icon ? 'pl-11' : 'pl-4',
            trailing ? 'pr-12' : 'pr-4',
            hasError
              ? 'border-danger-500/45 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10'
              : 'border-border hover:border-border-strong focus:border-primary-500 focus:ring-4 focus:ring-primary-500/12'
          )}
          {...props}
        />

        {trailing && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</div>
        )}
      </div>

      {hasError ? (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-danger-500">
          <AlertIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
