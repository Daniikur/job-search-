import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white/40 text-xs uppercase tracking-widest" data-testid="auth-loading">Loading</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
