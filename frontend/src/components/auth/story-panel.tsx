import { useEffect, useState } from 'react'
import { Landmark, ShieldCheck, Timer, ArrowUpRight, Banknote } from 'lucide-react'

/* Shared branded "scene" panel used as the left side of auth pages. */

/** How long each background scene shows before crossfading to the next. */
const SCENE_INTERVAL_MS = 5000

function SceneIllustration() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="w-full h-full opacity-95"
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

/** Scene 2: a loan application card being approved. */
function ApprovalIllustration() {
  return (
    <svg viewBox="0 0 420 320" className="w-full h-full opacity-95" role="img" aria-label="Illustration of an approved loan application">
      <defs>
        <linearGradient id="badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(110 231 183)" />
          <stop offset="100%" stopColor="rgb(16 128 96)" />
        </linearGradient>
      </defs>
      {/* back card */}
      <rect x="120" y="58" width="200" height="230" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" transform="rotate(6 220 173)" />
      {/* application card */}
      <g className="animate-rise">
        <rect x="100" y="45" width="210" height="240" rx="18" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <rect x="124" y="72" width="96" height="12" rx="6" fill="rgba(255,255,255,0.55)" />
        <rect x="124" y="94" width="140" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
        <text x="124" y="148" fill="rgba(255,255,255,0.92)" fontSize="30" fontWeight="700">K15,000</text>
        <rect x="124" y="166" width="120" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
        {[196, 216, 236].map((y, i) => (
          <g key={y}>
            <circle cx="130" cy={y} r="5" fill="rgba(110,231,183,0.85)" />
            <rect x="144" y={y - 4} width={130 - i * 22} height="8" rx="4" fill="rgba(255,255,255,0.18)" />
          </g>
        ))}
      </g>
      {/* approved badge */}
      <g className="animate-float">
        <circle cx="318" cy="232" r="40" fill="url(#badge)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <path d="M300 233 l12 12 l24 -26" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

/** Sparkle: a small four-pointed star centred on (x, y). */
function Sparkle({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
  const s = size
  return (
    <path
      d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
      fill="rgba(255,255,255,0.85)"
    />
  )
}

/** Scene 3: a member smiling at their phone as the loan money arrives. */
function MoneyReceivedIllustration() {
  const skin = '#9a5b37'
  const skinShade = '#80472a'
  const hair = '#24140d'
  const shirt = 'rgb(52 211 153)'
  const shirtShade = 'rgb(16 150 110)'
  return (
    <svg viewBox="0 0 420 320" className="w-full h-full opacity-95" role="img" aria-label="Illustration of a smiling member receiving money on their phone">
      <defs>
        <linearGradient id="giftCoin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(253 230 138)" />
          <stop offset="100%" stopColor="rgb(217 119 6)" />
        </linearGradient>
      </defs>

      {/* soft halo behind the person */}
      <circle cx="170" cy="190" r="118" fill="rgba(255,255,255,0.05)" />

      <g className="animate-rise">
        {/* body */}
        <path d="M88 320 C 88 252, 116 222, 168 222 C 220 222, 248 252, 248 320 Z" fill={shirt} />
        <path d="M150 222 L168 246 L186 222 Z" fill={shirtShade} />
        {/* neck */}
        <rect x="155" y="192" width="26" height="36" rx="10" fill={skinShade} />
        {/* head */}
        <circle cx="127" cy="160" r="8" fill={skinShade} />
        <circle cx="209" cy="160" r="8" fill={skinShade} />
        <circle cx="168" cy="156" r="42" fill={skin} />
        {/* hair */}
        <path d="M126 152 C 122 112, 150 100, 170 102 C 198 102, 214 120, 210 150 C 203 132, 188 124, 168 125 C 148 125, 133 136, 126 152 Z" fill={hair} />
        {/* happy closed eyes, looking down at the phone */}
        <path d="M149 158 q7 -7 14 0" fill="none" stroke={hair} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M175 158 q7 -7 14 0" fill="none" stroke={hair} strokeWidth="3.2" strokeLinecap="round" />
        {/* cheeks and big smile */}
        <circle cx="146" cy="172" r="6" fill="rgba(255,150,130,0.35)" />
        <circle cx="192" cy="172" r="6" fill="rgba(255,150,130,0.35)" />
        <path d="M152 174 Q169 194 186 174 Z" fill="#3b1a10" />
        <path d="M156 176 Q169 183 182 176 Z" fill="#fff" opacity="0.9" />

        {/* arm raised, holding the phone */}
        <path d="M222 252 C 238 246, 254 232, 262 214" fill="none" stroke={shirt} strokeWidth="24" strokeLinecap="round" />

        {/* phone */}
        <g transform="rotate(-10 288 178)">
          <rect x="250" y="104" width="78" height="148" rx="14" fill="#0b1f19" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
          <rect x="257" y="114" width="64" height="128" rx="9" fill="rgba(236,253,245,0.96)" />
          <rect x="278" y="108" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
          {/* received notification */}
          <circle cx="289" cy="146" r="14" fill="rgb(16 185 129)" />
          <path d="M282 146 l5 5 l10 -11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="289" y="178" textAnchor="middle" fill="rgb(6 95 70)" fontSize="7.5" fontWeight="600">Money received</text>
          <text x="289" y="198" textAnchor="middle" fill="rgb(4 120 87)" fontSize="12.5" fontWeight="800">K15,000</text>
          <rect x="268" y="210" width="42" height="5" rx="2.5" fill="rgba(6,95,70,0.25)" />
          <rect x="274" y="221" width="30" height="5" rx="2.5" fill="rgba(6,95,70,0.15)" />
        </g>
        {/* hand around the phone */}
        <ellipse cx="262" cy="214" rx="13" ry="15" fill={skin} />
        <ellipse cx="270" cy="204" rx="6" ry="9" fill={skin} transform="rotate(-30 270 204)" />
      </g>

      {/* celebration: coins and sparkles */}
      <g className="animate-float">
        <circle cx="356" cy="92" r="20" fill="url(#giftCoin)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <text x="356" y="98" textAnchor="middle" fill="rgba(120,53,15,0.9)" fontSize="15" fontWeight="700">K</text>
        <circle cx="368" cy="222" r="13" fill="url(#giftCoin)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
        <text x="368" y="227" textAnchor="middle" fill="rgba(120,53,15,0.9)" fontSize="11" fontWeight="700">K</text>
        <Sparkle x={318} y={70} size={9} />
        <Sparkle x={384} y={154} size={7} />
        <Sparkle x={232} y={88} size={6} />
      </g>
    </svg>
  )
}

/** The scenes that cycle behind the story; each has its own colour wash. */
const SCENES = [
  { label: 'Growing balance', Illustration: SceneIllustration, wash: 'from-emerald-500/25 via-transparent to-teal-400/10' },
  { label: 'Loan approved', Illustration: ApprovalIllustration, wash: 'from-teal-400/25 via-transparent to-emerald-300/15' },
  { label: 'Money received', Illustration: MoneyReceivedIllustration, wash: 'from-amber-300/20 via-transparent to-emerald-500/15' },
]

/** Advances through the scenes every SCENE_INTERVAL_MS, unless the user prefers reduced motion. */
function useSceneCycle(count: number) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), SCENE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [count, index]) // restarting on index change gives a full interval after a manual pick
  return [index, setIndex] as const
}

const FEATURES = [
  { icon: Timer, title: 'Money in minutes, not meetings', body: 'Apply online and track every approval step in real time.' },
  { icon: ShieldCheck, title: 'Eligibility you can see', body: 'Clear criteria and automatic scoring before you commit.' },
  { icon: Banknote, title: 'Repayments that stay on schedule', body: 'Automated installment plans with gentle overdue reminders.' },
]

export function AuthStoryPanel({ headline }: { headline?: string }) {
  const [scene, setScene] = useSceneCycle(SCENES.length)

  return (
    <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-10 xl:p-14 text-emerald-50">
      {/* colour wash for the current scene, crossfading */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {SCENES.map((s, i) => (
          <div
            key={s.label}
            className={`absolute inset-0 bg-gradient-to-br ${s.wash} transition-opacity duration-1000 ease-in-out ${
              i === scene ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

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
            {headline ?? 'Loans, without the queue.'}
          </h1>
          <p className="mt-3 text-emerald-100/70 leading-relaxed text-sm xl:text-base">
            The official borrowing platform for UNZALARU staff — apply, get scored, and
            approve everything from one place.
          </p>
        </div>

        {/* cycling scenes, stacked so they crossfade in place */}
        <div className="max-w-md">
          <div className="relative w-full aspect-[420/320]">
            {SCENES.map(({ label, Illustration }, i) => (
              <div
                key={label}
                aria-hidden={i !== scene}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  i === scene ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Illustration />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2" role="group" aria-label="Choose scene">
            {SCENES.map(({ label }, i) => (
              <button
                key={label}
                type="button"
                aria-label={`Show scene: ${label}`}
                aria-current={i === scene}
                onClick={() => setScene(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === scene ? 'w-6 bg-emerald-300' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

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
