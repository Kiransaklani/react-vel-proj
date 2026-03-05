"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

function Header() {
  const router = useRouter();
  const { user } = useAuth();

  const handleNewAnalysis = () => {
    router.push("/analyze");
  };

  const displayName = user?.name || "User";

  return (
    <div className="header">
      <div className="header-content">
        <h2 className="header-title">Welcome, {displayName} 👋</h2>
        <p className="header-subtitle">
          Get insights on your AI-generated content
        </p>
      </div>

      <button className="header-button" onClick={handleNewAnalysis}>
        + New Analysis
      </button>
    </div>
  );
}

export default Header;
