export default function EmptyState({ title, text, action, icon }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center p-8 text-center rounded-2xl"
      style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-2)' }}>
      <div className="mb-4 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'var(--brand-light)', border: '1px solid rgba(37,99,235,.15)' }}>
        {icon || '✦'}
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
