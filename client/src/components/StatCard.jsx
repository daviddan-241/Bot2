export default function StatCard({ label, value, hint, accent = 'default', icon: Icon, trend }) {
  const accentMap = {
    default: { bg: '#EFF6FF', icon: '#2563EB' },
    green:   { bg: '#F0FDF4', icon: '#16A34A' },
    amber:   { bg: '#FFFBEB', icon: '#D97706' },
    red:     { bg: '#FEF2F2', icon: '#DC2626' },
    purple:  { bg: '#F5F3FF', icon: '#7C3AED' },
    cyan:    { bg: '#ECFEFF', icon: '#0891B2' },
  };
  const colors = accentMap[accent] || accentMap.default;

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lifted"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</p>
        {Icon && (
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
            <Icon size={15} color={colors.icon}/>
          </div>
        )}
      </div>
      <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
      </p>
      <div className="flex items-center justify-between min-h-[16px]">
        {hint && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{hint}</p>}
        {trend && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#F0FDF4', color: '#16A34A' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
