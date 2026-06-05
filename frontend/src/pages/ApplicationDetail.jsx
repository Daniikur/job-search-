import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Sparkles, ExternalLink, Calendar, MapPin, DollarSign, MessageSquarePlus } from "lucide-react";

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected"];

export default function ApplicationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [app, setApp] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [adding, setAdding] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const load = () => api.get(`/applications/${id}`).then((r) => setApp(r.data)).catch(() => nav("/app/applications"));

  useEffect(() => {
    load();
  }, [id, load]);

  const changeStatus = async (status) => {
    await api.patch(`/applications/${id}/status`, { status });
    toast.success(`Status → ${status}`);
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAdding(true);
    try {
      await api.post(`/applications/${id}/notes`, { text: noteText, type: noteType });
      setNoteText("");
      toast.success("Note added");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed");
    } finally {
      setAdding(false);
    }
  };

  const deleteNote = async (nid) => {
    await api.delete(`/applications/${id}/notes/${nid}`);
    load();
  };

  const summarize = async () => {
    setSummarizing(true);
    try {
      const { data } = await api.post(`/applications/${id}/summarize`);
      toast.success("AI summary ready");
      setApp({ ...app, summary: data.summary });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed");
    } finally {
      setSummarizing(false);
    }
  };

  const removeApp = async () => {
    if (!window.confirm("Delete this application?")) return;
    await api.delete(`/applications/${id}`);
    nav("/app/applications");
  };

  if (!app) return <div className="p-12 text-white/40 text-xs">Loading…</div>;

  return (
    <div className="p-6 md:p-12 max-w-5xl">
      <Link to="/app/applications" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white mb-8" data-testid="back-to-applications">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="flex items-start justify-between gap-6 mb-10 fade-up">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ {app.source || "Direct"}</div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase mt-2" data-testid="app-detail-company">{app.company}</h1>
          <div className="font-display text-2xl font-medium text-white/70 mt-1" data-testid="app-detail-role">{app.role}</div>
          <div className="flex flex-wrap gap-4 mt-5 text-xs text-white/50">
            {app.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.location}</span>}
            {app.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{app.salary}</span>}
            {app.applied_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{app.applied_date}</span>}
            {app.job_url && (
              <a href={app.job_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#FF3823] hover:underline" data-testid="job-url-link">
                <ExternalLink className="w-3 h-3" /> Job link
              </a>
            )}
          </div>
        </div>
        <button onClick={removeApp} data-testid="delete-app-detail"
          className="text-white/30 hover:text-[#FF3823] p-2">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Status pipeline */}
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">§ Status</div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => changeStatus(s)} data-testid={`set-status-${s}`}
              className={`px-4 py-2 text-[11px] uppercase tracking-widest border transition-all ${
                app.status === s
                  ? "bg-[#FF3823] border-[#FF3823] text-white"
                  : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* JD + AI summary */}
      {app.job_description && (
        <div className="glass p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">§ Job description</div>
            <button onClick={summarize} disabled={summarizing} data-testid="ai-summarize-detail"
              className="text-[10px] uppercase tracking-widest text-[#FF3823] hover:text-white flex items-center gap-1.5 disabled:opacity-50">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} /> {summarizing ? "Thinking…" : "AI summarize"}
            </button>
          </div>
          {app.summary && (
            <div className="mb-5 p-4 border border-[#FF3823]/30 bg-[#FF3823]/5 whitespace-pre-wrap text-sm" data-testid="ai-summary-section">
              <div className="text-[10px] uppercase tracking-widest text-[#FF3823] mb-2">AI Summary</div>
              {app.summary}
            </div>
          )}
          <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{app.job_description}</p>
        </div>
      )}

      {/* Notes timeline */}
      <div className="glass p-6">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">§ Notes</div>
        <h3 className="font-display text-2xl font-black uppercase mb-6">Interview log</h3>

        <form onSubmit={addNote} className="mb-8" data-testid="add-note-form">
          <div className="flex flex-col md:flex-row gap-2">
            <select value={noteType} onChange={(e) => setNoteType(e.target.value)} data-testid="note-type-select"
              className="bg-[#0a0a0a] border border-white/10 px-3 py-2 text-sm uppercase tracking-widest">
              <option value="note">Note</option>
              <option value="interview">Interview</option>
              <option value="followup">Follow-up</option>
            </select>
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="What happened?" data-testid="note-text-input"
              className="flex-1 bg-transparent border border-white/10 focus:border-white/30 outline-none px-3 py-2 text-sm" />
            <button type="submit" disabled={adding} data-testid="add-note-button"
              className="bg-[#FF3823] hover:bg-[#FF3823]/85 px-5 py-2 text-sm uppercase tracking-wide font-medium disabled:opacity-50 flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4" /> Log
            </button>
          </div>
        </form>

        {app.notes && app.notes.length > 0 ? (
          <div className="space-y-4">
            {app.notes.slice().reverse().map((n) => (
              <div key={n.id} className="border-l-2 border-[#FF3823]/40 pl-4 py-1" data-testid={`note-${n.id}`}>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/40 mb-1">
                  <span className="text-[#FF3823]">{n.type}</span>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <button onClick={() => deleteNote(n.id)} className="ml-auto text-white/30 hover:text-[#FF3823]" data-testid={`delete-note-${n.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{n.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/40">No notes yet — log your first interview impression above.</div>
        )}
      </div>
    </div>
  );
}
