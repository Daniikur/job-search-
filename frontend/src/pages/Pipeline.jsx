import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

const COLUMNS = [
  { id: "saved", label: "Saved", color: "text-white/60" },
  { id: "applied", label: "Applied", color: "text-blue-300" },
  { id: "interviewing", label: "Interviewing", color: "text-yellow-300" },
  { id: "offer", label: "Offer", color: "text-green-300" },
  { id: "rejected", label: "Rejected", color: "text-[#FF3823]" },
];

export default function Pipeline() {
  const [apps, setApps] = useState([]);
  const [dragging, setDragging] = useState(null);

  const load = () => api.get("/applications").then((r) => setApps(r.data));
  useEffect(() => { load(); }, []);

  const onDrop = async (status) => {
    if (!dragging || dragging.status === status) { setDragging(null); return; }
    setApps((cur) => cur.map((a) => (a.id === dragging.id ? { ...a, status } : a)));
    try {
      await api.patch(`/applications/${dragging.id}/status`, { status });
      toast.success(`${dragging.company} → ${status}`);
    } catch {
      toast.error("Failed to move");
      load();
    }
    setDragging(null);
  };

  return (
    <div className="p-6 md:p-12">
      <div className="flex items-end justify-between mb-10 fade-up">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ Board</div>
          <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2">Pipeline</h1>
        </div>
        <div className="hidden md:block text-xs text-white/40 max-w-xs text-right">
          Drag a card across lanes to update status. Direct, fast, no menus.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-px bg-white/10">
        {COLUMNS.map((col) => {
          const items = apps.filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              data-testid={`column-${col.id}`}
              className="bg-[#050505] min-h-[60vh] p-4"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className={`text-[11px] uppercase tracking-widest font-medium ${col.color}`}>{col.label}</div>
                <span className="text-xs text-white/30">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <Link
                    to={`/app/applications/${a.id}`}
                    key={a.id}
                    draggable
                    onDragStart={() => setDragging(a)}
                    data-testid={`pipeline-card-${a.id}`}
                    className="block glass glass-hover p-3 cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="font-medium text-sm truncate">{a.company}</div>
                    <div className="text-xs text-white/50 truncate mt-0.5">{a.role}</div>
                    {a.location && <div className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">{a.location}</div>}
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-[10px] text-white/20 uppercase tracking-widest py-6 text-center border border-dashed border-white/5">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
