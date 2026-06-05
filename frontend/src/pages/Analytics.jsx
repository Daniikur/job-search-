import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected"];
const COLORS = ["rgba(255,255,255,0.6)", "#60A5FA", "#FCD34D", "#34D399", "#FF3823"];

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data));
  }, []);

  if (!stats) return <div className="p-12 text-white/40 text-xs">Loading…</div>;

  const pieData = STATUSES.map((s) => ({ name: s, value: stats.by_status[s] })).filter((d) => d.value > 0);
  const barData = stats.weekly;

  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <div className="mb-10 fade-up">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">§ Numbers</div>
        <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase mt-2">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 mb-10">
        <Stat label="Total" v={stats.total} />
        <Stat label="Response rate" v={`${stats.response_rate}%`} accent />
        <Stat label="Offers" v={stats.offer_count} color="text-green-300" />
        <Stat label="Rejected" v={stats.by_status.rejected} color="text-[#FF3823]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">§ Distribution</div>
          <h3 className="font-display text-2xl font-black uppercase mb-6">Status breakdown</h3>
          {pieData.length === 0 ? (
            <div className="text-xs text-white/40 py-12 text-center">No data yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={COLORS[STATUSES.indexOf(d.name)]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass p-8">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">§ Weekly volume</div>
          <h3 className="font-display text-2xl font-black uppercase mb-6">Application velocity</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="count" fill="#FF3823" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v, accent, color }) {
  return (
    <div className="bg-[#050505] p-6">
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{label}</div>
      <div className={`font-display text-5xl font-black tracking-tighter ${accent ? "text-[#FF3823]" : ""} ${color || ""}`}>{v}</div>
    </div>
  );
}
