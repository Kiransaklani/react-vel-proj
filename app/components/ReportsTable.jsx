"use client";

import { useState, useEffect } from "react";

function ReportsTable({ reports = [] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!reports || reports.length === 0) {
    return (
      <div className="reports-container">
        <h3 className="reports-title">Recent Reports</h3>
        <p style={{ color: "var(--text-muted)" }}>No reports available</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="reports-container">
        <h3 className="reports-title">Recent Reports</h3>

        <div className="reports-cards">
          {reports.map((item) => (
            <div key={item.id} className="report-card">
              <div className="report-card-header">
                <strong className="report-card-title">{item.title}</strong>
                <span className="report-card-score">{item.score}</span>
              </div>
              <div className="report-card-status">Status: {item.status}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <h3 className="reports-title">Recent Reports</h3>

      <table className="reports-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.score}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportsTable;
