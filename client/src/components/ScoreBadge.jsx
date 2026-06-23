export default function ScoreBadge({ score = 0, label }) {
  const resolved = label || (score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold');
  const styles = {
    Hot:  { background: 'rgba(16,185,129,.12)', color: '#34d399', border: '1px solid rgba(16,185,129,.2)' },
    Warm: { background: 'rgba(245,158,11,.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,.2)' },
    Cold: { background: 'rgba(148,163,184,.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,.15)' },
  };
  const s = styles[resolved] || styles.Cold;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={s}>
      <span className="tabular-nums">{score}</span>
      <span>{resolved}</span>
    </span>
  );
}
