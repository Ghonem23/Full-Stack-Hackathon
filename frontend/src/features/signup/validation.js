export const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PASSWORD_RULES = [
  { label: 'at least 8 characters', test: (v) => v.length >= 8 },
  { label: 'upper and lowercase letters', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'a number', test: (v) => /\d/.test(v) },
]

/**
 * Returns an object holding a message for each *invalid* field.
 * A field with no entry is valid.
 */
export function validateSignUp(values) {
  const errors = {}

  const fullName = values.fullName.trim()
  if (!fullName) {
    errors.fullName = 'Please enter your full name.'
  } else if (fullName.length < 3) {
    errors.fullName = 'Name must be at least 3 characters.'
  }

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Please enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'That does not look like a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Please choose a password.'
  } else {
    const unmet = PASSWORD_RULES.filter((rule) => !rule.test(values.password))
    if (unmet.length) {
      errors.password = `Password needs ${unmet.map((r) => r.label).join(', ')}.`
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = 'You need to accept the terms to continue.'
  }

  return errors
}
