const ACCENTS = {
  default: { color: '#a5b0ff', bg: 'rgba(92,103,255,.1)',  border: 'rgba(92,103,255,.2)'  },
  green:   { color: '#34d399', bg: 'rgba(52,211,153,.1)',  border: 'rgba(52,211,153,.2)'  },
  amber:   { color: '#fbbf24', bg: 'rgba(251,191,36,.1)',  border: 'rgba(251,191,36,.2)'  },
  red:     { color: '#f87171', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.2)' },
  cyan:    { color: '#22d3ee', bg: 'rgba(34,211,238,.1)',  border: 'rgba(34,211,238,.2)'  },
};

export default function StatCard({ label, value, hint, accent = 'default', icon: Icon }) {
  const a = ACCENTS[accent] || ACCENTS.default;
  return (
    <div className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-black text-white tabular-nums">{value ?? '—'}</p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: a.bg, border: `1px solid ${a.border}` }}>
            <Icon size={18} color={a.color}/>
          </div>
        )}
        {!Icon && (
          <div className="h-1 w-10 rounded-full mt-1" style={{ background: a.color, opacity: 0.6 }}/>
        )}
      </div>
    </div>
  );
}
