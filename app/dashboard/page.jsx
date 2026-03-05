"use client";

import StatCards from "../components/StatCards";
import ReportsTable from "../components/ReportsTable";
import { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "../config/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";

function Dashboard() {
  const [stats, setStats] = useState({
    total_analyses: 0,
    avg_score: 0,
    this_week: 0,
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usageRes, analysesRes] = await Promise.all([
        fetchWithAuth(API_ENDPOINTS.API_USAGE),
        fetchWithAuth(API_ENDPOINTS.ANALYSES),
      ]);

      if (!usageRes.ok) throw new Error("Failed to fetch dashboard stats");
      if (!analysesRes.ok) throw new Error("Failed to fetch analyses");

      const usageData = await usageRes.json();
      const responseData = await analysesRes.json();

      // Set stats from /api-usage
      if (usageData.success && usageData.data) {
        const d = usageData.data;
        const weekCount = d.daily_usage
          ? d.daily_usage.reduce((sum, day) => sum + day.count, 0)
          : 0;

        setStats({
          total_analyses: d.total_analyses || 0,
          avg_score: d.avg_score || 0,
          this_week: weekCount,
        });
      }

      // Set recent reports
      const analysesData =
        responseData.data && Array.isArray(responseData.data)
          ? responseData.data
          : Array.isArray(responseData)
            ? responseData
            : [];

      const formattedReports = analysesData
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          title: item.content
            ? item.content.substring(0, 50) +
              (item.content.length > 50 ? "..." : "")
            : "Untitled",
          score: `${item.score || 0}%`,
          status: getStatusFromScore(item.score || 0),
        }))
        .reverse();

      setReports(formattedReports);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStats({ total_analyses: 0, avg_score: 0, this_week: 0 });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromScore = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  return (
    <>
      {loading && <div className="loading-message">Loading...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <StatCards stats={stats} />
          <ReportsTable reports={reports} />
        </>
      )}
    </>
  );
}

export default Dashboard;
