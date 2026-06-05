import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListChecks, KanbanSquare, FileText, BarChart3, LogOut, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/app/dashboard", label: "Overview", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/app/applications", label: "Applications", icon: ListChecks, testid: "nav-applications" },
  { to: "/app/pipeline", label: "Pipeline", icon: KanbanSquare, testid: "nav-pipeline" },
  { to: "/app/resumes", label: "Resumes", icon: FileText, testid: "nav-resumes" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, testid: "nav-analytics" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex bg-[#050505] text-white">
      <aside className="hidden md:flex flex-col w-60 border-r border-white/10 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-12">
          <Briefcase className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
          <span className="font-display text-xl font-black tracking-tighter">HIRETRACK</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm transition-all border-l-2 ${
                  isActive
                    ? "border-[#FF3823] bg-white/5 text-white"
                    : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
                }`
              }
            >
              <l.icon className="w-4 h-4" strokeWidth={1.5} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 mt-6">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Signed in</div>
          <div className="text-sm font-medium truncate" data-testid="sidebar-user-name">{user?.name}</div>
          <div className="text-xs text-white/40 truncate mb-3" data-testid="sidebar-user-email">{user?.email}</div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            data-testid="logout-button"
            className="flex items-center gap-2 text-xs text-white/50 hover:text-[#FF3823] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
            <span className="font-display text-lg font-black">HIRETRACK</span>
          </div>
          <button onClick={async () => { await logout(); nav("/login"); }} data-testid="logout-button-mobile">
            <LogOut className="w-4 h-4 text-white/60" strokeWidth={1.5} />
          </button>
        </div>
        <div className="md:hidden flex overflow-x-auto px-4 py-2 gap-1 border-b border-white/10 text-xs">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 ${isActive ? "bg-white/10 text-white" : "text-white/50"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
