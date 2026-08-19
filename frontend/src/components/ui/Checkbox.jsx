import { useId } from 'react'

import { AlertIcon, CheckIcon } from '@/components/icons'
import { cn } from '@/utils/cn'

export default function Checkbox({ label, error, className, id: idProp, ...props }) {
  const generatedId = useId()
  const id = idProp ?? `${props.name}-${generatedId}`
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          {/* The native input stays in the DOM (opacity-0) so focus, keyboard
              and form semantics keep working; the span below is the visual.
              Checkmark visibility is driven from the sibling box, not the svg
              directly — `peer-*` only reaches siblings, not their children. */}
          <input
            id={id}
            type="checkbox"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
            {...props}
          />
          <span
            className={cn(
              'grid size-5 place-items-center rounded-md border bg-white transition-all duration-150',
              'peer-checked:border-primary-500 peer-checked:bg-primary-500',
              'peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-primary-500/20',
              error ? 'border-danger-500/55' : 'border-border-strong peer-hover:border-primary-400'
            )}
          >
            <CheckIcon
              strokeWidth={3}
              className="size-3.5 scale-50 text-white opacity-0 transition-all duration-150"
            />
          </span>
        </span>

        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink-700">
          {label}
        </label>
      </div>

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 pl-8 text-xs font-medium text-danger-500"
        >
          <AlertIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
