export default function StatCard({ label, value, hint, accent = 'blue' }) {
  const accentClass = accent === 'green' ? 'from-emerald-500 to-teal-400' : accent === 'amber' ? 'from-amber-500 to-orange-400' : 'from-blue-600 to-indigo-500';
  return (
    <div className="glass-card p-5">
      <div className={`mb-5 h-1.5 w-16 rounded-full bg-gradient-to-r ${accentClass}`} />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
