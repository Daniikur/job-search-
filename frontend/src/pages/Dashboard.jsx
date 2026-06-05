import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, Briefcase, TrendingUp, Target, FileText } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const STATUS_COLORS = {
  saved: "text-white/60",
  applied: "text-blue-300",
  interviewing: "text-yellow-300",
  offer: "text-green-300",
  rejected: "text-[#FF3823]",
};

const StatBlock = ({ label, value, accent }) => (
  <div className="glass p-6 relative noise">
    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">{label}</div>
    <div className={`font-display text-5xl font-black tracking-tighter ${accent || ""}`}>{value}</div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/stats").then((r) => setStats(r.data)),
      api.get("/applications").then((r) => setRecent(r.data.slice(0, 5))),
    ]).catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <div className="flex items-end justify-between mb-10 fade-up">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ Overview</div>
          <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2" data-testid="dashboard-heading">
            Hello, {user?.name?.split(" ")[0] || "there"}.
          </h1>
        </div>
        <Link to="/app/applications" data-testid="add-app-cta"
          className="hidden md:inline-flex items-center gap-2 bg-[#FF3823] hover:bg-[#FF3823]/85 px-5 py-3 text-sm uppercase tracking-wide font-medium">
          Add application <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {!stats && <div className="text-white/40 text-xs">Loading…</div>}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 mb-10">
            <div className="bg-[#050505]"><StatBlock label="Total" value={stats.total} /></div>
            <div className="bg-[#050505]"><StatBlock label="Applied" value={stats.by_status.applied} /></div>
            <div className="bg-[#050505]"><StatBlock label="Interviewing" value={stats.by_status.interviewing} accent="text-yellow-300" /></div>
            <div className="bg-[#050505]"><StatBlock label="Offers" value={stats.by_status.offer} accent="text-green-300" /></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 glass p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">§ Velocity</div>
                  <div className="font-display text-2xl font-black uppercase mt-1">Last 8 weeks</div>
                </div>
                <TrendingUp className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
              </div>
              <div className="h-56" data-testid="weekly-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#FF3823" strokeWidth={2} dot={{ fill: "#FF3823", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass p-8 flex flex-col justify-between">
              <div>
                <Target className="w-5 h-5 text-[#FF3823] mb-4" strokeWidth={1.5} />
                <div className="text-[10px] uppercase tracking-widest text-white/40">§ Response rate</div>
                <div className="font-display text-6xl font-black tracking-tighter mt-2" data-testid="response-rate">
                  {stats.response_rate}<span className="text-2xl">%</span>
                </div>
                <div className="text-xs text-white/50 mt-3">of applications got a reply (interview / offer / rejection).</div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-6">
                Rejected: {stats.by_status.rejected} · Saved: {stats.by_status.saved}
              </div>
            </div>
          </div>

          <div className="glass p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">§ Recent</div>
                <div className="font-display text-2xl font-black uppercase mt-1">Latest applications</div>
              </div>
              <Link to="/app/applications" className="text-xs uppercase tracking-widest text-white/50 hover:text-white" data-testid="see-all-link">
                See all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10">
                <FileText className="w-8 h-8 text-white/20 mx-auto mb-3" strokeWidth={1.5} />
                <div className="text-sm text-white/50 mb-1">No applications yet</div>
                <Link to="/app/applications" data-testid="empty-add-cta" className="text-xs text-[#FF3823] hover:underline">+ Add your first one</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recent.map((a) => (
                  <Link key={a.id} to={`/app/applications/${a.id}`} data-testid={`recent-app-${a.id}`}
                    className="flex items-center gap-4 py-4 hover:bg-white/[0.02] px-2 -mx-2 transition-colors">
                    <Briefcase className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.role} · <span className="text-white/60">{a.company}</span></div>
                      <div className="text-xs text-white/40 mt-0.5">{a.location || "—"}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${STATUS_COLORS[a.status] || "text-white/50"}`}>
                      {a.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
