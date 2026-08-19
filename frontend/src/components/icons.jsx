/**
 * Inline stroke icons, sized by the className passed in.
 * Kept local so the bundle stays free of an icon dependency.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const PulseLogoIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M2.5 12.5h4l2-5.5 3.2 11 2.6-7.2 1.7 2.8h5.5" />
  </svg>
)

export const UserIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
)

export const MailIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" />
    <path d="m3.5 7 7.4 5.3a2 2 0 0 0 2.2 0L20.5 7" />
  </svg>
)

export const LockIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.75" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

export const EyeIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M9.9 5.98A9.6 9.6 0 0 1 12 5.75c6 0 9.5 6.25 9.5 6.25a17.4 17.4 0 0 1-3.35 4.11M6.5 7.6A17.3 17.3 0 0 0 2.5 12S6 18.25 12 18.25c1.6 0 3-.44 4.2-1.09" />
    <path d="M10 10.1a2.75 2.75 0 0 0 3.9 3.87" />
    <path d="m3.5 3.5 17 17" />
  </svg>
)

export const CheckIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

export const AlertIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 7.5v5.25" />
    <circle cx="12" cy="16.25" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const SpinnerIcon = ({ className = '', ...props }) => (
  <svg {...base} {...props} className={`animate-spin ${className}`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
)
