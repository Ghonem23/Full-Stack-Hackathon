import { useState } from 'react'

import InputField from '@/components/ui/InputField'
import { EyeIcon, EyeOffIcon, LockIcon } from '@/components/icons'

export default function PasswordField({ label, ...props }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <InputField
      label={label}
      icon={LockIcon}
      type={isVisible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="grid size-9 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-surface-muted hover:text-navy-500"
        >
          {isVisible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      }
      {...props}
    />
  )
}
