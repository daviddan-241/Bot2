export default function EmptyState({ title, text, action, icon }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center rounded-2xl"
      style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
      <div className="mb-4 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(92,103,255,.1)', border: '1px solid rgba(92,103,255,.15)' }}>
        {icon || '✦'}
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
