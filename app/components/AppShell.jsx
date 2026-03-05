"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

const PUBLIC_PATHS = ["/login", "/register"];

function AppContent({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  // Show loading only for protected pages while checking auth
  if (loading && !isPublicPage) {
    return (
      <div className="app-layout">
        <div className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div className="loading-message">Loading...</div>
        </div>
      </div>
    );
  }

  // Public pages (login/register) — no sidebar/header
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Protected pages — full layout with sidebar/header
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
