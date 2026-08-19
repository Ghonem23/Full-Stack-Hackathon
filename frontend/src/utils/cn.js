/**
 * Joins class names, dropping falsy values so conditionals stay inline:
 *   cn('btn', isActive && 'btn-active', errors.email && 'border-danger-500')
 */
export function cn(...inputs) {
  return inputs.flat(Infinity).filter(Boolean).join(' ')
}
