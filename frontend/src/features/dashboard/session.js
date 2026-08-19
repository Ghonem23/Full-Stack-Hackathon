/**
 * Reads the session the login screen already writes.
 *
 * AuthCard stores `authToken` and `user` in localStorage on a successful
 * sign-in; this file only reads those keys back, so the auth flow itself stays
 * exactly as its author wrote it. If the storage keys ever change, this is the
 * single file that has to follow.
 */

const TOKEN_KEY = 'authToken'
const USER_KEY = 'user'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    // Safari in private mode throws on localStorage rather than returning null.
    return null
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isSignedIn() {
  return Boolean(getToken())
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* nothing to clear */
  }

  // Drop the #dashboard preview hash too, otherwise a reload right after
  // signing out would seed a fresh preview session and bounce straight back in.
  if (typeof window !== 'undefined' && window.location.hash === '#dashboard') {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

/**
 * Development-only shortcut: opening the app at #dashboard skips sign-in.
 *
 * The Flask backend has to be running before anyone can actually log in, which
 * makes the dashboard impossible to work on while the backend is someone
 * else's half-finished branch. This seeds a throwaway session so the page can
 * be opened on its own.
 *
 * Vite replaces import.meta.env.DEV with `false` in a production build and the
 * bundler drops the whole branch, so this cannot ship to a real deployment.
 */
export function startPreviewSession() {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  if (window.location.hash !== '#dashboard') return false

  if (!getToken()) {
    try {
      localStorage.setItem(TOKEN_KEY, 'preview-token')
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({ id: 0, fullName: 'Preview User', email: 'preview@local' })
      )
    } catch {
      /* storage blocked — the dashboard still renders, just without a name */
    }
  }

  return true
}

/** "Habiba Saad" -> "HS". Falls back to the email when no name was given. */
export function getInitials(user) {
  const source = user?.fullName?.trim() || user?.email || ''
  if (!source) return '?'

  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
