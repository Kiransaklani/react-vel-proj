"use client";

import { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "../config/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";

function ApiUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchApiUsage();
  }, []);

  const fetchApiUsage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(API_ENDPOINTS.API_USAGE);

      if (!response.ok) {
        throw new Error("Failed to fetch API usage data");
      }

      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        setData(responseData.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const maxCount = data?.daily_usage
    ? Math.max(...data.daily_usage.map((d) => d.count), 1)
    : 1;

  const totalBreakdown = data?.score_breakdown
    ? (data.score_breakdown.excellent || 0) +
      (data.score_breakdown.good || 0) +
      (data.score_breakdown.poor || 0)
    : 0;

  const getBreakdownPercent = (count) => {
    if (totalBreakdown === 0) return 0;
    return Math.round((count / totalBreakdown) * 100);
  };

  return (
    <div className="api-usage-content">
      <h2 className="api-usage-title">API Usage Analytics</h2>

      {loading && <div className="loading-message">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && data && (
        <>
          {/* Stat Cards */}
          <div className="api-usage-stats">
            <div className="api-usage-stat-card">
              <h3 className="api-usage-stat-title">Total Analyses</h3>
              <p className="api-usage-stat-value">
                {(data.total_analyses || 0).toLocaleString()}
              </p>
            </div>

            <div className="api-usage-stat-card">
              <h3 className="api-usage-stat-title">Average Score</h3>
              <p className="api-usage-stat-value">
                {(data.avg_score || 0).toFixed(1)}%
              </p>
            </div>

            <div className="api-usage-stat-card">
              <h3 className="api-usage-stat-title">This Week</h3>
              <p className="api-usage-stat-value">
                {data.daily_usage
                  ? data.daily_usage.reduce((sum, d) => sum + d.count, 0)
                  : 0}
              </p>
            </div>
          </div>

          {/* Daily Usage Chart */}
          <div className="api-usage-chart-container">
            <h3 className="api-usage-chart-title">
              Daily Usage (Last 7 Days)
            </h3>
            <div className="api-usage-chart">
              {data.daily_usage && data.daily_usage.length > 0 ? (
                data.daily_usage.map((item, index) => (
                  <div key={index} className="api-usage-chart-bar-container">
                    <div
                      className="api-usage-chart-bar"
                      style={{
                        height: `${(item.count / maxCount) * 100}%`,
                      }}
                      title={`${formatDate(item.date)}: ${item.count} analyses`}
                    >
                      <span className="api-usage-chart-bar-value">
                        {item.count}
                      </span>
                    </div>
                    <span className="api-usage-chart-bar-label">
                      {item.day || formatDay(item.date)}
                    </span>
                    <span className="api-usage-chart-bar-date">
                      {formatDate(item.date)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)", textAlign: "center", width: "100%" }}>
                  No usage data for the last 7 days
                </p>
              )}
            </div>
          </div>

          {/* Status Breakdown */}
          {data.score_breakdown && (
            <div className="api-usage-chart-container" style={{ marginTop: "var(--spacing-lg)" }}>
              <h3 className="api-usage-chart-title">Score Breakdown</h3>
              <div className="status-breakdown">
                <div className="status-breakdown-item">
                  <div className="status-breakdown-header">
                    <span className="status-breakdown-label">Excellent (80+)</span>
                    <span className="status-breakdown-count">
                      {data.score_breakdown.excellent || 0} ({getBreakdownPercent(data.score_breakdown.excellent || 0)}%)
                    </span>
                  </div>
                  <div className="status-breakdown-bar-bg">
                    <div
                      className="status-breakdown-bar status-bar-excellent"
                      style={{ width: `${getBreakdownPercent(data.score_breakdown.excellent || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="status-breakdown-item">
                  <div className="status-breakdown-header">
                    <span className="status-breakdown-label">Good (60-79)</span>
                    <span className="status-breakdown-count">
                      {data.score_breakdown.good || 0} ({getBreakdownPercent(data.score_breakdown.good || 0)}%)
                    </span>
                  </div>
                  <div className="status-breakdown-bar-bg">
                    <div
                      className="status-breakdown-bar status-bar-good"
                      style={{ width: `${getBreakdownPercent(data.score_breakdown.good || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="status-breakdown-item">
                  <div className="status-breakdown-header">
                    <span className="status-breakdown-label">Poor (&lt;60)</span>
                    <span className="status-breakdown-count">
                      {data.score_breakdown.poor || 0} ({getBreakdownPercent(data.score_breakdown.poor || 0)}%)
                    </span>
                  </div>
                  <div className="status-breakdown-bar-bg">
                    <div
                      className="status-breakdown-bar status-bar-poor"
                      style={{ width: `${getBreakdownPercent(data.score_breakdown.poor || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ApiUsage;
