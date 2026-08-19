import { useState } from 'react'
import SignUpPage from '@/pages/SignUpPage'
import AuthCard from '@/components/AuthCard'
import ChatPage from '@/chat'
import DashboardPage from '@/features/dashboard/DashboardPage'
import { isSignedIn, startPreviewSession } from '@/features/dashboard/session'

/**
 * The whole app is four pages held in one piece of state.
 *
 * Where each page can go:
 *   signup    -> login                       (after the account is created)
 *   login     -> signup | chat               (chat on a successful sign-in)
 *   chat      -> dashboard | login           (sidebar, or sign out)
 *   dashboard -> chat | login                (sidebar CTA, or sign out)
 *
 * Signing in lands on the chat, not the dashboard: the assistant is what the
 * product is: the dashboard is the evidence behind it, reached from the chat
 * when someone wants to see how well it performs.
 *
 * AuthCard is the login screen rather than src/login.jsx: the two share the
 * same design, but only AuthCard talks to the Flask backend and stores the
 * token. src/login.jsx is the earlier mock and is left untouched.
 */
export default function App() {
  // A token left over from a previous visit skips the sign-in screen and opens
  // the chat. The #dashboard hash still opens the dashboard directly — it is
  // the development shortcut for working on that page without a backend, so it
  // has to keep pointing where its name says.
  const [currentPage, setCurrentPage] = useState(() => {
    if (startPreviewSession()) return 'dashboard'
    return isSignedIn() ? 'chat' : 'signup'
  })

  if (currentPage === 'signup') {
    return (
      <div>
        <SignUpPage onNavigate={setCurrentPage} />
      </div>
    )
  }

  if (currentPage === 'dashboard') {
    return (
      <div>
        <DashboardPage onNavigate={setCurrentPage} />
      </div>
    )
  }

  if (currentPage === 'chat') {
    return (
      <div>
        <ChatPage onNavigate={setCurrentPage} />
      </div>
    )
  }

  return (
    <div>
      <AuthCard
        onNavigate={setCurrentPage}
        onSuccess={() => setCurrentPage('chat')}
      />
    </div>
  )
}
