"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { API_ENDPOINTS } from "../config/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters & Sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");

  // Debounce search
  const searchTimeout = useRef(null);
  const [searchInput, setSearchInput] = useState("");

  const getStatusFromScore = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort: sortBy,
        order: order,
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetchWithAuth(`${API_ENDPOINTS.REPORTS}?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const responseData = await response.json();

      const analysesData =
        responseData.data && Array.isArray(responseData.data)
          ? responseData.data
          : Array.isArray(responseData)
            ? responseData
            : [];

      const formattedReports = analysesData.map((item) => ({
        id: item.id,
        title: item.content
          ? item.content.substring(0, 60) +
            (item.content.length > 60 ? "..." : "")
          : "Untitled",
        score: item.score || 0,
        status: getStatusFromScore(item.score || 0),
        created_at: item.created_at || null,
      }));

      setReports(formattedReports);

      // Set pagination from meta
      if (responseData.meta) {
        setTotalPages(Math.ceil(responseData.meta.total / responseData.meta.per_page));
        setTotal(responseData.meta.total);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, sortBy, order]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setOrder("desc");
    }
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    setDeleting(id);
    try {
      const response = await fetchWithAuth(`${API_ENDPOINTS.REPORTS}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      // Refresh the list
      fetchReports();
    } catch (err) {
      alert(err.message || "Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return " \u2195";
    return order === "desc" ? " \u2193" : " \u2191";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Excellent": return "status-excellent";
      case "Good": return "status-good";
      case "Needs Work": return "status-needs-work";
      case "Poor": return "status-poor";
      default: return "";
    }
  };

  return (
    <div className="reports-page-content">
      <h2 className="reports-page-title">All Reports</h2>

      {/* Filters Bar */}
      <div className="reports-filters">
        <input
          type="text"
          className="reports-search-input"
          placeholder="Search reports..."
          value={searchInput}
          onChange={handleSearchChange}
        />

        <select
          className="reports-filter-select"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">All Status</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="needs_work">Needs Work</option>
          <option value="poor">Poor</option>
        </select>
      </div>

      {/* Total count */}
      {!loading && !error && (
        <p className="reports-total-count">
          Showing {reports.length} of {total} reports
        </p>
      )}

      {loading && <div className="loading-message">Loading reports...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && reports.length === 0 && (
        <div className="reports-container">
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>
            No reports found
          </p>
        </div>
      )}

      {/* Reports Table */}
      {!loading && !error && reports.length > 0 && (
        <div className="reports-container" style={{ marginTop: 0 }}>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Title</th>
                <th
                  className="reports-sortable-th"
                  onClick={() => handleSort("score")}
                >
                  Score{getSortIcon("score")}
                </th>
                <th>Status</th>
                <th
                  className="reports-sortable-th"
                  onClick={() => handleSort("created_at")}
                >
                  Date{getSortIcon("created_at")}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <span className="reports-score-badge">{item.score}%</span>
                  </td>
                  <td>
                    <span className={`reports-status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="reports-date-cell">{formatDate(item.created_at)}</td>
                  <td>
                    <button
                      className="reports-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards (hidden on desktop via CSS) */}
      {!loading && !error && reports.length > 0 && (
        <div className="reports-mobile-cards">
          {reports.map((item) => (
            <div key={item.id} className="report-card">
              <div className="report-card-header">
                <strong className="report-card-title">{item.title}</strong>
                <span className={`reports-status-badge ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <div className="report-card-details">
                <span className="reports-score-badge">{item.score}%</span>
                <span className="report-card-date">{formatDate(item.created_at)}</span>
              </div>
              <button
                className="reports-delete-btn"
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                style={{ marginTop: "8px", width: "100%" }}
              >
                {deleting === item.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="reports-pagination">
          <button
            className="reports-pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <div className="reports-pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
              })
              .reduce((acc, p, idx, arr) => {
                // Add ellipsis between non-consecutive pages
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="reports-pagination-dots">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`reports-pagination-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            className="reports-pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Reports;
