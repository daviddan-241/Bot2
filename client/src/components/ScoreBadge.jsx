export default function ScoreBadge({ score = 0, label }) {
  const resolved = label || (score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold');
  const styles = {
    Hot:  { background: '#F0FDF4', color: '#15803d', border: '1px solid #BBF7D0' },
    Warm: { background: '#FFFBEB', color: '#b45309', border: '1px solid #FDE68A' },
    Cold: { background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' },
  };
  const s = styles[resolved] || styles.Cold;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={s}>
      <span className="tabular-nums">{score}</span>
      <span>{resolved}</span>
    </span>
  );
}
