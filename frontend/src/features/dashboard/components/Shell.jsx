import {
  Activity,
  BarChart3,
  BookOpen,
  FileSearch,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { getInitials, getUser } from '@/features/dashboard/session'

const NAV = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'cohort', label: 'Cohort', icon: Users },
  { id: 'retrieval', label: 'Retrieval', icon: FileSearch },
  { id: 'safety', label: 'Safety', icon: ShieldCheck },
  { id: 'corpus', label: 'Corpus', icon: BookOpen },
  { id: 'evidence', label: 'Evidence', icon: Activity },
]

/**
 * Left rail. The links scroll to the matching section rather than routing —
 * the whole benchmark is meant to be read top to bottom in one pass during the
 * demo, and a router would break that.
 */
export function Sidebar({ active, onNavigate, onOpenChat }) {
  return (
    <nav className="dsh-side" aria-label="Dashboard sections">
      <div className="dsh-brand">
        <span className="dsh-brand-mark">
          <Activity size={16} strokeWidth={2.5} />
        </span>
        <span className="dsh-brand-word">Model Name</span>
      </div>

      <ul className="dsh-nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              className={`dsh-nav-link${active === id ? ' is-active' : ''}`}
              onClick={() => onNavigate(id)}
              aria-current={active === id ? 'true' : undefined}
            >
              <Icon size={17} />
              {label}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="dsh-side-cta" onClick={onOpenChat}>
        <MessageSquare size={16} />
        Ask the assistant
      </button>
    </nav>
  )
}

/**
 * Top bar: who is signed in, the run picker, and sign-out. The run picker lives
 * here rather than inside a card because it re-scopes every panel at once —
 * per-chart filters would let two panels disagree about which run they show.
 */
export function Topbar({ runs, runId, onRunChange, caption, onSignOut }) {
  const user = getUser()
  const name = user?.fullName?.split(' ')[0] || 'there'

  return (
    <header className="dsh-top">
      <div>
        <h1 className="dsh-top-title">Evaluation &amp; guardrail benchmark</h1>
        <p className="dsh-top-sub">
          Welcome back, {name} — {caption}
        </p>
      </div>

      <div className="dsh-top-actions">
        <label className="dsh-select">
          <span className="dsh-sr">Evaluation run</span>
          <select value={runId} onChange={(event) => onRunChange(event.target.value)}>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.label}
              </option>
            ))}
          </select>
        </label>

        <span className="dsh-avatar" title={user?.email || ''}>
          {getInitials(user)}
        </span>

        <button type="button" className="dsh-ghost-btn" onClick={onSignOut}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  )
}
