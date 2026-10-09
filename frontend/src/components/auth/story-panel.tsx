import { Landmark, ShieldCheck, Timer, ArrowUpRight, Banknote } from 'lucide-react'

/* Shared branded "scene" panel used as the left side of auth pages. */

function SceneIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="w-full max-w-md opacity-95"
      role="img"
      aria-label="Illustration of stacked coins and a growing balance"
    >
      <defs>
        <linearGradient id="coinA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52 211 153)" />
          <stop offset="100%" stopColor="rgb(6 95 70)" />
        </linearGradient>
        <linearGradient id="coinB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(110 231 183)" />
          <stop offset="100%" stopColor="rgb(16 128 96)" />
        </linearGradient>
        <linearGradient id="growth" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
      </defs>

      {/* growth curve */}
      <path
        d="M20 275 C 120 265, 170 210, 240 160 S 360 70, 405 40"
        fill="none"
        stroke="url(#growth)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M20 275 C 120 265, 170 210, 240 160 S 360 70, 405 40 L 405 300 L 20 300 Z"
        fill="rgba(255,255,255,0.05)"
      />

      {/* coin stacks */}
      {[[60, 262, 7], [150, 250, 5], [250, 235, 4]].map(([cx, base, n], i) => (
        <g key={i} className="animate-rise" style={{ animationDelay: `${0.15 * i}s`, animationFillMode: 'backwards' }}>
          {Array.from({ length: n as number }).map((_, j) => (
            <ellipse
              key={j}
              cx={cx}
              cy={(base as number) - j * 13}
              rx="26"
              ry="9"
              fill={j % 2 ? 'url(#coinA)' : 'url(#coinB)'}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1"
            />
          ))}
        </g>
      ))}

      {/* apex coin */}
      <g className="animate-float">
        <circle cx="370" cy="55" r="26" fill="url(#coinB)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <text x="370" y="61" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="14" fontWeight="600">
          K
        </text>
      </g>
    </svg>
  )
}

const FEATURES = [
  { icon: Timer, title: 'Money in minutes, not meetings', body: 'Apply online and track every approval step in real time.' },
  { icon: ShieldCheck, title: 'Eligibility you can see', body: 'Clear criteria and automatic scoring before you commit.' },
  { icon: Banknote, title: 'Repayments that stay on schedule', body: 'Automated installment plans with gentle overdue reminders.' },
]

export function AuthStoryPanel({ headline }: { headline?: string }) {
  return (
    <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-10 xl:p-14 text-emerald-50">
      {/* depth layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-emerald-400/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-teal-400/10 blur-3xl animate-float-delayed" />
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.07]">
          <defs>
            <pattern id="auth-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0v28" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
      </div>

      {/* brand */}
      <div className="relative flex items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur flex items-center justify-center">
          <Landmark className="w-5 h-5 text-emerald-200" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">UNZALARU</p>
          <p className="text-xs text-emerald-200/80">Employees' Loan Management</p>
        </div>
      </div>

      {/* middle story */}
      <div className="relative space-y-8 animate-rise">
        <div className="max-w-md">
          <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
            {headline ?? 'Union loans, without the queue.'}
          </h1>
          <p className="mt-3 text-emerald-100/70 leading-relaxed text-sm xl:text-base">
            The official borrowing platform for UNZALARU staff — apply, get scored, and
            approve everything from one place.
          </p>
        </div>

        <SceneIllustration />

        <ul className="space-y-4 max-w-md">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex gap-3 animate-side-fade"
              style={{ animationDelay: `${0.2 + 0.12 * i}s`, animationFillMode: 'backwards' }}
            >
              <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-emerald-200" />
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-emerald-100/60 mt-0.5">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* footer stats */}
      <div className="relative flex items-center gap-6 text-xs text-emerald-100/60">
        <span className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
          Fast-tracked approvals
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          Fully audited decisions
        </span>
      </div>
    </aside>
  )
}

/** Compact brand row shown when the story panel is hidden (small screens). */
export function AuthBrandRow() {
  return (
    <div className="relative flex items-center gap-3 mb-8 lg:hidden animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20">
        <Landmark className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold tracking-tight text-foreground">UNZALARU</p>
        <p className="text-xs text-muted-foreground">Employees' Loan Management</p>
      </div>
    </div>
  )
}
