export default function EmptyState({ title, text, action }) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-3xl bg-blue-50 p-4 text-3xl dark:bg-blue-500/10">✦</div>
      <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
