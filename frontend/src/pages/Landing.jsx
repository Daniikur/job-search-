import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Sparkles, KanbanSquare, FileText, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const HERO_BG = "https://images.unsplash.com/photo-1717579502848-064e02acb167?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGNyeXN0YWwlMjBtaW5pbWFsJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4NTg4MTk1fDA&ixlib=rb-4.1.0&q=85";

const Stat = ({ k, label }) => (
  <div className="border-l border-white/10 pl-4">
    <div className="font-display text-3xl md:text-4xl font-black tracking-tighter">{k}</div>
    <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{label}</div>
  </div>
);

const Feature = ({ icon: Icon, title, desc, idx }) => (
  <div className={`glass glass-hover transition-all p-7 relative noise fade-up delay-${idx}`}>
    <Icon className="w-5 h-5 text-[#FF3823] mb-6" strokeWidth={1.5} />
    <div className="font-display text-2xl font-black tracking-tight mb-2 uppercase">{title}</div>
    <div className="text-sm text-white/60 leading-relaxed">{desc}</div>
  </div>
);

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? "/app/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <Briefcase className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
            <span className="font-display text-xl font-black tracking-tighter">HIRETRACK</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" data-testid="nav-login" className="text-white/60 hover:text-white px-4 py-2">Sign in</Link>
            <Link to={cta} data-testid="nav-cta" className="bg-[#FF3823] hover:bg-[#FF3823]/85 px-4 py-2 text-sm font-medium transition-colors">
              Start Tracking
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-28 px-6">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-[#050505]" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8 fade-up">
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/50 mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-[#FF3823]" /> A job hunt is not a hobby. Run it like ops.
            </div>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase">
              Track every <span className="text-[#FF3823]">offer</span><br />before it ghosts you.
            </h1>
            <p className="mt-8 text-base md:text-lg text-white/60 max-w-xl leading-relaxed">
              HireTrack is the brutalist command center for your job search.
              Pipeline, notes, resumes, AI summaries — one cold-hard interface.
            </p>
            <div className="mt-10 flex gap-3 items-center">
              <Link to={cta} data-testid="hero-cta" className="bg-[#FF3823] hover:bg-[#FF3823]/85 text-white px-6 py-3 font-medium text-sm uppercase tracking-wide inline-flex items-center gap-2 transition-all">
                Start free <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </Link>
              <Link to="/login" data-testid="hero-secondary" className="border border-white/20 hover:border-white/40 px-6 py-3 text-sm uppercase tracking-wide">
                Sign in
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-px bg-white/10 fade-up delay-2">
            <div className="bg-[#050505] p-6"><Stat k="100+" label="Apps tracked" /></div>
            <div className="bg-[#050505] p-6"><Stat k="5" label="Pipeline stages" /></div>
            <div className="bg-[#050505] p-6"><Stat k="AI" label="JD summaries" /></div>
            <div className="bg-[#050505] p-6"><Stat k="∞" label="Notes" /></div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">§ 02 — Toolkit</div>
              <h2 className="font-display text-4xl md:text-6xl font-black tracking-tighter mt-3 uppercase">
                Built for the hunt.
              </h2>
            </div>
            <div className="hidden md:block text-xs text-white/40 max-w-xs text-right">
              Five modules. Zero clutter. Every interaction is on the record.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            <Feature idx={1} icon={KanbanSquare} title="Pipeline" desc="Drag jobs through Saved → Applied → Interview → Offer. Or Rejected. Whatever." />
            <Feature idx={2} icon={Sparkles} title="AI Summary" desc="Paste a 4-page JD, get the 4 bullets that actually matter. Claude Sonnet 4.5." />
            <Feature idx={3} icon={FileText} title="Resumes" desc="Upload, version, pin a default. PDF or DOCX. We keep it where you parked it." />
            <Feature idx={4} icon={Briefcase} title="Application Log" desc="Companies, roles, sources, salaries. With filters that don't fight you." />
            <Feature idx={5} icon={BarChart3} title="Analytics" desc="Response rate, weekly velocity, status breakdown. Numbers don't lie." />
            <Feature idx={6} icon={Briefcase} title="Interview Notes" desc="Timestamped notes per application. Re-read before your next call." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto glass p-12 md:p-20 relative noise">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#FF3823] mb-4">§ Get going</div>
          <h3 className="font-display text-5xl md:text-7xl font-black tracking-tighter uppercase max-w-3xl">
            Stop losing track. Start landing.
          </h3>
          <Link to={cta} data-testid="cta-bottom" className="inline-flex mt-10 items-center gap-2 bg-[#FF3823] hover:bg-[#FF3823]/85 px-6 py-3 text-sm uppercase tracking-wide font-medium">
            Create your account <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-xs text-white/40 flex justify-between max-w-7xl mx-auto">
        <span>© {new Date().getFullYear()} HireTrack</span>
        <span className="uppercase tracking-widest">Frosted brutalism · v1.0</span>
      </footer>
    </div>
  );
}
