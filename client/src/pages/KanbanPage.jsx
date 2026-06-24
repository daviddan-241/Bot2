import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, Mail, MessageCircle, Plus, RefreshCw, Trophy } from 'lucide-react';
import { api } from '../utils/api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

const STAGES = [
  { id: 'new',        label: 'New',        color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🆕' },
  { id: 'contacted',  label: 'Contacted',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', emoji: '📧' },
  { id: 'replied',    label: 'Replied',    color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', emoji: '💬' },
  { id: 'won',        label: 'Won',        color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', emoji: '🏆' },
  { id: 'lost',       label: 'Lost',       color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', emoji: '❌' },
];

const STAGE_IDS = STAGES.map(s => s.id);

function stageOf(lead) {
  return STAGE_IDS.includes(lead.status) ? lead.status : 'new';
}

function LeadCard({ lead, stage, stages, onMove, onDragStart }) {
  const stageIdx = STAGE_IDS.indexOf(stage.id);
  const canLeft  = stageIdx > 0;
  const canRight = stageIdx < STAGE_IDS.length - 1;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className="rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-lifted select-none"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      }}>

      {/* Top row: initials + name + score */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: stage.color }}>
          {(lead.company || lead.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/leads/${lead.id}`}
            className="text-sm font-semibold leading-tight truncate block hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text)' }}>
            {lead.company || lead.name}
          </Link>
          {lead.company && lead.name && lead.name !== lead.company && (
            <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{lead.name}</p>
          )}
        </div>
        <ScoreBadge score={lead.score} label={lead.score_label}/>
      </div>

      {/* Contact info */}
      {(lead.email || lead.website || lead.location) && (
        <div className="space-y-1 mb-3">
          {lead.email && (
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 text-[11px] hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-3)' }}>
              <Mail size={11}/> <span className="truncate">{lead.email}</span>
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-3)' }}>
              <ExternalLink size={11}/> <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {!lead.email && !lead.website && lead.location && (
            <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{lead.location}</p>
          )}
        </div>
      )}

      {/* WhatsApp link */}
      {lead.whatsapp_link && (
        <a href={lead.whatsapp_link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-semibold mb-3"
          style={{ color: '#16A34A' }}>
          <MessageCircle size={11}/> WhatsApp
        </a>
      )}

      {/* Stage move buttons */}
      <div className="flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          disabled={!canLeft}
          onClick={() => onMove(lead.id, STAGE_IDS[stageIdx - 1])}
          className="flex-1 h-7 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold transition-all disabled:opacity-25"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          <ChevronLeft size={12}/> {canLeft ? STAGES[stageIdx - 1].label : ''}
        </button>
        <button
          disabled={!canRight}
          onClick={() => onMove(lead.id, STAGE_IDS[stageIdx + 1])}
          className="flex-1 h-7 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold transition-all disabled:opacity-25"
          style={{
            background: canRight ? STAGES[stageIdx + 1].bg : 'var(--surface-2)',
            border: `1px solid ${canRight ? STAGES[stageIdx + 1].border : 'var(--border)'}`,
            color: canRight ? STAGES[stageIdx + 1].color : 'var(--text-3)',
          }}>
          {canRight ? STAGES[stageIdx + 1].label : ''} <ChevronRight size={12}/>
        </button>
      </div>
    </div>
  );
}

function Column({ stage, leads, onMove, onDrop, onDragStart, onDragOver }) {
  const totalValue = leads.length;
  const hotCount  = leads.filter(l => l.score_label === 'Hot').length;

  return (
    <div
      className="flex flex-col shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: 280,
        minWidth: 280,
        border: `1px solid ${stage.border}`,
        background: stage.bg,
      }}
      onDragOver={e => { e.preventDefault(); onDragOver(stage.id); }}
      onDrop={e => { e.preventDefault(); onDrop(stage.id); }}>

      {/* Column header */}
      <div className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ background: stage.bg, borderBottom: `1px solid ${stage.border}` }}>
        <span className="text-base">{stage.emoji}</span>
        <h3 className="text-sm font-bold flex-1" style={{ color: stage.color }}>{stage.label}</h3>
        <div className="flex items-center gap-1.5">
          {hotCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
              🔥 {hotCount}
            </span>
          )}
          <span className="text-[11px] font-bold h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: stage.color, color: 'white' }}>
            {totalValue}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 200, maxHeight: 'calc(100dvh - 260px)' }}>
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stage={stage}
            stages={STAGES}
            onMove={onMove}
            onDragStart={onDragStart}/>
        ))}
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-2xl mb-2" style={{ opacity: 0.4 }}>{stage.emoji}</p>
            <p className="text-[11px] font-medium" style={{ color: stage.color, opacity: 0.6 }}>No leads yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [dragId, setDragId]     = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [wonCount, setWonCount] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const data = await api('/leads?limit=200');
      setLeads(data.rows || []);
      setWonCount((data.rows || []).filter(l => l.status === 'won').length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function moveLeadTo(leadId, newStatus) {
    setSaving(true);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (newStatus === 'won') setWonCount(c => c + 1);
    try {
      await api(`/leads/${leadId}`, { method: 'PUT', body: { status: newStatus } });
    } catch {
      await load();
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(targetStageId) {
    if (dragId && dragId !== targetStageId) {
      const lead = leads.find(l => l.id === dragId);
      if (lead && stageOf(lead) !== targetStageId) {
        moveLeadTo(dragId, targetStageId);
      }
    }
    setDragId(null);
    setDragOver(null);
  }

  const byStage = {};
  STAGE_IDS.forEach(id => { byStage[id] = []; });
  leads.forEach(lead => {
    const s = stageOf(lead);
    byStage[s].push(lead);
  });
  STAGE_IDS.forEach(id => {
    byStage[id].sort((a, b) => (b.score || 0) - (a.score || 0));
  });

  const totalLeads = leads.length;
  const wonPct = totalLeads ? Math.round((byStage.won?.length / totalLeads) * 100) : 0;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 140px)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-1" style={{ color: 'var(--brand)' }}>CRM</p>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#F0FDF4' }}>
              <Trophy size={18} color="#16A34A"/>
            </div>
            Pipeline Board
          </h1>
          <p className="text-sm mt-0.5 ml-11" style={{ color: 'var(--text-2)' }}>
            Drag cards to move leads · arrows to advance stage
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Win rate badge */}
          {totalLeads > 0 && (
            <div className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}>
              🏆 {wonPct}% win rate · {byStage.won?.length} won
            </div>
          )}
          <button onClick={load} disabled={loading}
            className="btn-secondary text-sm"
            style={{ minHeight: 40 }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <Link to="/leads" className="btn-primary text-sm" style={{ minHeight: 40 }}>
            <Plus size={14}/> Add lead
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && totalLeads > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-5">
          {STAGES.map(stage => {
            const count = byStage[stage.id]?.length || 0;
            const pct   = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <div key={stage.id} className="rounded-xl p-3 text-center"
                style={{ background: stage.bg, border: `1px solid ${stage.border}` }}>
                <p className="text-lg font-black" style={{ color: stage.color }}>{count}</p>
                <p className="text-[10px] font-semibold" style={{ color: stage.color, opacity: 0.75 }}>{stage.label}</p>
                <div className="mt-1.5 h-1 rounded-full" style={{ background: stage.border }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: stage.color }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm text-red-700"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {saving && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold animate-fade-in"
          style={{ background: 'var(--brand)', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,.3)' }}>
          Saving…
        </div>
      )}

      {/* Kanban columns */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div key={s.id} className="shrink-0 rounded-2xl skeleton" style={{ width: 280, height: 400 }}/>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6" style={{ alignItems: 'flex-start' }}>
          {STAGES.map(stage => (
            <Column
              key={stage.id}
              stage={stage}
              leads={byStage[stage.id] || []}
              onMove={moveLeadTo}
              onDrop={handleDrop}
              onDragStart={id => setDragId(id)}
              onDragOver={id => setDragOver(id)}/>
          ))}
        </div>
      )}

      {!loading && totalLeads === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Your pipeline is empty</h3>
          <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--text-2)' }}>
            Add leads manually, use the Discover tool, or ask the AI to find leads for you.
          </p>
          <div className="flex gap-3">
            <Link to="/ai" className="btn-primary text-sm">Ask AI to find leads</Link>
            <Link to="/scraper" className="btn-secondary text-sm">Discover</Link>
          </div>
        </div>
      )}
    </div>
  );
}
