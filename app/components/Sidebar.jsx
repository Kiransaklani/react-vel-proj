"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1024);

    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isActive = (path) => {
    return pathname === path;
  };

  const handleLogout = () => {
    if (isMobile) setIsOpen(false);
    logout();
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-menu-button"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      )}

      <div className={`sidebar ${isMobile && isOpen ? "open" : ""}`}>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="sidebar-close-button"
            aria-label="Close menu"
          >
            ×
          </button>
        )}

        <h2 className="sidebar-logo">AI Content</h2>

        <Link
          href="/dashboard"
          className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
          onClick={handleLinkClick}
        >
          Dashboard
        </Link>
        <Link
          href="/analyze"
          className={`sidebar-link ${isActive("/analyze") ? "active" : ""}`}
          onClick={handleLinkClick}
        >
          Analyze
        </Link>
        <Link
          href="/reports"
          className={`sidebar-link ${isActive("/reports") ? "active" : ""}`}
          onClick={handleLinkClick}
        >
          Reports
        </Link>
        <Link
          href="/api-usage"
          className={`sidebar-link ${isActive("/api-usage") ? "active" : ""}`}
          onClick={handleLinkClick}
        >
          API Usage
        </Link>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {isMobile && (
        <div
          className={`sidebar-overlay ${isOpen ? "show" : ""}`}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;
