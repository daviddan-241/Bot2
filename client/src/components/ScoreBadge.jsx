export default function ScoreBadge({ score = 0, label }) {
  const resolved = label || (score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold');
  const styles = {
    Hot: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    Warm: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    Cold: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
  };
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${styles[resolved] || styles.Cold}`}><span>{score}</span>{resolved}</span>;
}
