import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Briefcase, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await register(name, email, pw);
      toast.success("Account created");
      nav("/app/dashboard");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-12 order-2 lg:order-1">
        <form onSubmit={submit} className="w-full max-w-sm fade-up" data-testid="register-form">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#FF3823] mb-2">§ Get started</div>
          <h1 className="font-display text-4xl font-black tracking-tighter uppercase mb-10">Create account</h1>

          {err && (
            <div className="mb-6 p-3 bg-[#FF3823]/10 border border-[#FF3823]/40 text-xs text-[#FF3823]" data-testid="register-error">
              {err}
            </div>
          )}

          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Name</label>
          <input data-testid="register-name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2 mb-6" />

          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Email</label>
          <input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2 mb-6" />

          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Password (min 6)</label>
          <input data-testid="register-password-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6}
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none py-2 mb-10" />

          <button data-testid="register-submit-button" type="submit" disabled={loading}
            className="w-full bg-[#FF3823] hover:bg-[#FF3823]/85 disabled:opacity-50 px-6 py-3 font-medium text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all">
            {loading ? "Creating…" : <>Create account <ArrowUpRight className="w-4 h-4" /></>}
          </button>

          <p className="text-xs text-white/40 mt-6">
            Already have one? <Link to="/login" className="text-white hover:text-[#FF3823]" data-testid="login-link">Sign in →</Link>
          </p>
        </form>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 border-l border-white/10 relative noise order-1 lg:order-2">
        <Link to="/" className="flex items-center gap-2 self-end">
          <Briefcase className="w-5 h-5 text-[#FF3823]" strokeWidth={1.5} />
          <span className="font-display text-xl font-black tracking-tighter">HIRETRACK</span>
        </Link>
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-4">§ Join the hunt</div>
          <h2 className="font-display text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            Six clicks.<br />Full control.
          </h2>
          <p className="text-white/50 mt-6 max-w-sm text-sm">
            One account. Every application, note, and resume in one cold-hard place.
          </p>
        </div>
        <div className="text-xs text-white/30 uppercase tracking-widest">v1.0 · zero-bs onboarding</div>
      </div>
    </div>
  );
}
