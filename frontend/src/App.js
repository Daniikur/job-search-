import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Applications from "@/pages/Applications";
import ApplicationDetail from "@/pages/ApplicationDetail";
import Pipeline from "@/pages/Pipeline";
import Resumes from "@/pages/Resumes";
import Analytics from "@/pages/Analytics";

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/app/applications" element={<Protected><Applications /></Protected>} />
          <Route path="/app/applications/:id" element={<Protected><ApplicationDetail /></Protected>} />
          <Route path="/app/pipeline" element={<Protected><Pipeline /></Protected>} />
          <Route path="/app/resumes" element={<Protected><Resumes /></Protected>} />
          <Route path="/app/analytics" element={<Protected><Analytics /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="dark" position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
