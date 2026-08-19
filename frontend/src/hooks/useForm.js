import { useCallback, useState } from 'react'

/**
 * Minimal controlled-form state machine — no form library needed.
 *
 * @param initialValues  starting field values
 * @param validate       (values) => { field: 'message' }  for invalid fields only
 * @param onSubmit       async (values) => void; throw to surface a form-level error
 */
export function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const setValue = useCallback(
    (name, value) => {
      const nextValues = { ...values, [name]: value }
      setValues(nextValues)
      setFormError('')

      // Re-validate every field the user has already interacted with, so an
      // error clears the moment it's fixed — and so editing `password` also
      // refreshes the mismatch message on `confirmPassword`.
      const nextErrors = validate(nextValues)
      setErrors((prev) => {
        const merged = { ...prev }
        for (const key of Object.keys(touched)) {
          if (touched[key]) merged[key] = nextErrors[key]
        }
        return merged
      })
    },
    [touched, validate, values]
  )

  const handleChange = useCallback(
    (event) => {
      const { name, type, checked, value } = event.target
      setValue(name, type === 'checkbox' ? checked : value)
    },
    [setValue]
  )

  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target
      setTouched((prev) => ({ ...prev, [name]: true }))
      setErrors((prev) => ({ ...prev, [name]: validate(values)[name] }))
    },
    [validate, values]
  )

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const nextErrors = validate(values)
      setErrors(nextErrors)
      setTouched(Object.fromEntries(Object.keys(values).map((key) => [key, true])))

      const firstInvalid = Object.keys(values).find((key) => nextErrors[key])
      if (firstInvalid) {
        document.querySelector(`[name="${firstInvalid}"]`)?.focus()
        return
      }

      setIsSubmitting(true)
      setFormError('')
      try {
        await onSubmit(values)
        setIsSubmitted(true)
      } catch (error) {
        setFormError(error?.message || 'Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, validate, values]
  )

  /** Props to spread onto a text input so it wires itself up. */
  const fieldProps = useCallback(
    (name) => ({
      name,
      value: values[name],
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    }),
    [errors, handleBlur, handleChange, touched, values]
  )

  /** Same, for checkboxes — `checked` instead of `value`. */
  const checkboxProps = useCallback(
    (name) => ({
      name,
      checked: values[name],
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    }),
    [errors, handleBlur, handleChange, touched, values]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    formError,
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    fieldProps,
    checkboxProps,
  }
}
