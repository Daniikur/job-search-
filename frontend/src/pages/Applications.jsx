import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Search, Trash2, Briefcase, X, Sparkles } from "lucide-react";

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected"];
const STATUS_COLORS = {
  saved: "text-white/60 border-white/20",
  applied: "text-blue-300 border-blue-300/30",
  interviewing: "text-yellow-300 border-yellow-300/30",
  offer: "text-green-300 border-green-300/30",
  rejected: "text-[#FF3823] border-[#FF3823]/40",
};

const blank = {
  company: "", role: "", location: "", salary: "", job_url: "",
  job_description: "", source: "", status: "saved", applied_date: "",
};

function AppForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ ...blank, ...initial });
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [err, setErr] = useState("");

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const summarize = async () => {
    if (!form.job_description || form.job_description.length < 30) {
      toast.error("Paste a longer job description first");
      return;
    }
    setSummarizing(true);
    try {
      const { data } = await api.post("/ai/summarize", { text: form.job_description, mode: "jd" });
      setAiSummary(data.summary);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "AI failed");
    } finally {
      setSummarizing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      if (initial?.id) {
        await api.put(`/applications/${initial.id}`, form);
        toast.success("Updated");
      } else {
        await api.post("/applications", form);
        toast.success("Application added");
      }
      onSaved();
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto" data-testid="app-form-modal">
      <form onSubmit={submit} className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 my-8">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">§ {initial?.id ? "Edit" : "New"}</div>
            <h2 className="font-display text-2xl font-black uppercase">{initial?.id ? "Edit application" : "Add application"}</h2>
          </div>
          <button type="button" onClick={onClose} data-testid="close-form" className="text-white/50 hover:text-white">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {err && <div className="p-3 bg-[#FF3823]/10 border border-[#FF3823]/40 text-xs text-[#FF3823]">{err}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Company *</label>
              <input required value={form.company} onChange={upd("company")} data-testid="form-company"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Role *</label>
              <input required value={form.role} onChange={upd("role")} data-testid="form-role"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Location</label>
              <input value={form.location} onChange={upd("location")} data-testid="form-location"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Salary</label>
              <input value={form.salary} onChange={upd("salary")} data-testid="form-salary"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Source</label>
              <input value={form.source} onChange={upd("source")} placeholder="LinkedIn, referral…" data-testid="form-source"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Status</label>
              <select value={form.status} onChange={upd("status")} data-testid="form-status"
                className="w-full bg-[#0a0a0a] border-b border-white/20 focus:border-white outline-none py-2">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Job URL</label>
              <input value={form.job_url} onChange={upd("job_url")} data-testid="form-job-url"
                className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Job description</label>
                <button type="button" onClick={summarize} disabled={summarizing} data-testid="ai-summarize-btn"
                  className="text-[10px] uppercase tracking-widest text-[#FF3823] hover:text-white flex items-center gap-1 disabled:opacity-50">
                  <Sparkles className="w-3 h-3" strokeWidth={1.5} /> {summarizing ? "Thinking…" : "AI summarize"}
                </button>
              </div>
              <textarea value={form.job_description} onChange={upd("job_description")} rows={6} data-testid="form-jd"
                className="w-full bg-transparent border border-white/10 focus:border-white/30 outline-none p-3 text-sm" />
              {aiSummary && (
                <div className="mt-3 p-4 border border-[#FF3823]/30 bg-[#FF3823]/5 text-sm whitespace-pre-wrap" data-testid="ai-summary-result">
                  <div className="text-[10px] uppercase tracking-widest text-[#FF3823] mb-2">AI Summary</div>
                  {aiSummary}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-white/20 text-sm uppercase tracking-wide">Cancel</button>
          <button type="submit" disabled={saving} data-testid="form-submit"
            className="px-6 py-2.5 bg-[#FF3823] hover:bg-[#FF3823]/85 disabled:opacity-50 text-sm uppercase tracking-wide font-medium">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
  
    const params = {};
  
    if (q) params.q = q;
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
  
    api.get("/applications", { params })
      .then((r) => setApps(r.data))
      .finally(() => setLoading(false));
  
  }, [q, statusFilter]);

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  const remove = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    await api.delete(`/applications/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 fade-up">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ Log</div>
          <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2">Applications</h1>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} data-testid="open-add-form"
          className="self-start md:self-auto inline-flex items-center gap-2 bg-[#FF3823] hover:bg-[#FF3823]/85 px-5 py-3 text-sm uppercase tracking-wide font-medium">
          <Plus className="w-4 h-4" strokeWidth={2} /> New application
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or role…" data-testid="search-input"
            className="w-full bg-transparent border-b border-white/10 focus:border-white outline-none py-2 pl-6 text-sm" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} data-testid={`filter-${s}`}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-all ${
                statusFilter === s ? "bg-white text-black border-white" : "border-white/10 text-white/50 hover:border-white/30"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-white/40 text-xs">Loading…</div>}

      {!loading && apps.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/10">
          <Briefcase className="w-10 h-10 text-white/20 mx-auto mb-4" strokeWidth={1.5} />
          <div className="text-white/60 mb-3">No applications match.</div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-[#FF3823] text-sm hover:underline">
            + Add the first one
          </button>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className="border border-white/10">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-widest text-white/40">
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {apps.map((a) => (
            <div key={a.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              data-testid={`app-row-${a.id}`}>
              <Link to={`/app/applications/${a.id}`} className="md:col-span-3 font-medium hover:text-[#FF3823]" data-testid={`app-company-${a.id}`}>{a.company}</Link>
              <Link to={`/app/applications/${a.id}`} className="md:col-span-3 text-sm text-white/80">{a.role}</Link>
              <div className="md:col-span-2 text-sm text-white/50">{a.location || "—"}</div>
              <div className="md:col-span-2 text-sm text-white/50">{a.source || "—"}</div>
              <div className="md:col-span-1">
                <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest border ${STATUS_COLORS[a.status]}`}>{a.status}</span>
              </div>
              <div className="md:col-span-1 flex md:justify-end gap-2">
                <button onClick={() => { setEditing(a); setShowForm(true); }} data-testid={`edit-app-${a.id}`}
                  className="text-xs text-white/40 hover:text-white">Edit</button>
                <button onClick={() => remove(a.id)} data-testid={`delete-app-${a.id}`} className="text-white/30 hover:text-[#FF3823]">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppForm initial={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}
