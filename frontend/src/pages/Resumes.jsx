import React, { useEffect, useRef, useState } from "react";
import api, { formatApiErrorDetail, API } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Star, Download } from "lucide-react";

export default function Resumes() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => api.get("/resumes").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/resumes", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Resume uploaded");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const setDefault = async (id) => {
    await api.post(`/resumes/${id}/default`);
    toast.success("Default updated");
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    await api.delete(`/resumes/${id}`);
    load();
  };

  const download = async (id, filename) => {
    try {
      const res = await api.get(`/resumes/${id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 fade-up">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ Library</div>
          <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2">Resumes</h1>
        </div>
        <label className="inline-flex items-center gap-2 bg-[#FF3823] hover:bg-[#FF3823]/85 px-5 py-3 text-sm uppercase tracking-wide font-medium cursor-pointer self-start" data-testid="resume-upload-label">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload resume"}
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={onPick} className="hidden" data-testid="resume-file-input" />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-white/60 mb-2">No resumes yet.</div>
          <div className="text-xs text-white/40">PDF, DOCX, or TXT up to 10MB.</div>
        </div>
      ) : (
        <div className="border border-white/10">
          {items.map((r) => (
            <div key={r.id} data-testid={`resume-row-${r.id}`}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {r.filename}
                    {r.is_default && <span className="text-[9px] uppercase tracking-widest bg-[#FF3823] px-1.5 py-0.5">Default</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {(r.size / 1024).toFixed(1)} KB · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {!r.is_default && (
                  <button onClick={() => setDefault(r.id)} data-testid={`set-default-${r.id}`}
                    className="text-white/40 hover:text-white flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" strokeWidth={1.5} /> Set default
                  </button>
                )}
                <button onClick={() => download(r.id, r.filename)} data-testid={`download-${r.id}`}
                  className="text-white/40 hover:text-white flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> Download
                </button>
                <button onClick={() => remove(r.id)} data-testid={`delete-resume-${r.id}`} className="text-white/30 hover:text-[#FF3823]">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
