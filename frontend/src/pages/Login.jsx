import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Briefcase, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, pw);
      toast.success("Welcome back");
      nav("/app/dashboard");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/10 relative noise">
        <Link to="/" className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
          <span className="font-display text-xl font-black tracking-tighter">HIRETRACK</span>
        </Link>
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-4">§ Welcome back</div>
          <h2 className="font-display text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            The hunt<br />continues.
          </h2>
          <p className="text-white/50 mt-6 max-w-sm text-sm">
            Pick up where you left off. Every application, note, and offer letter is still right where you parked it.
          </p>
        </div>
        <div className="text-xs text-white/30 uppercase tracking-widest">v1.0 · authenticated session</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full max-w-sm fade-up" data-testid="login-form">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#FF3823] mb-2">§ Sign in</div>
          <h1 className="font-display text-4xl font-black tracking-tighter uppercase mb-10">Access HireTrack</h1>

          {err && (
            <div className="mb-6 p-3 bg-[#FF3823]/10 border border-[#FF3823]/40 text-xs text-[#FF3823]" data-testid="login-error">
              {err}
            </div>
          )}

          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Email</label>
          <input
            data-testid="login-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2 mb-6 text-white placeholder:text-white/30"
            placeholder="you@hiretrack.app"
          />

          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Password</label>
          <input
            data-testid="login-password-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2 mb-10 text-white"
            placeholder="••••••••"
          />

          <button
            data-testid="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF3823] hover:bg-[#FF3823]/85 disabled:opacity-50 px-6 py-3 font-medium text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
          >
            {loading ? "Authenticating…" : <>Sign in <ArrowUpRight className="w-4 h-4" /></>}
          </button>

          <p className="text-xs text-white/40 mt-6">
            No account? <Link to="/register" className="text-white hover:text-[#FF3823]" data-testid="register-link">Create one →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
