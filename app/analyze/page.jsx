"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_ENDPOINTS } from "../config/api";
import { fetchWithAuth } from "../lib/fetchWithAuth";

function Analyze() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const textareaRef = useRef(null);
  const pollingRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setContent("");
    setResult(null);
    setError(null);
    setToast(null);
    setPolling(false);
    if (pollingRef.current) clearTimeout(pollingRef.current);

    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pollForResult = (analysisId) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      attempts++;

      try {
        const res = await fetchWithAuth(API_ENDPOINTS.ANALYSIS_STATUS(analysisId));

        if (!res.ok) throw new Error("Status check failed");

        const data = await res.json();
        const status = data.data || data;

        if (
          status.status === "completed" ||
          (status.feedback && status.feedback !== "Processing...")
        ) {
          pollingRef.current = null;
          setPolling(false);

          setResult({
            score: status.score || 0,
            feedback: status.feedback || "No feedback available",
            suggestions: status.suggestions || [],
            corrections: status.corrections || [],
            originalContent: status.content || content,
          });
          setShowCorrected(false);

          setToast({
            type: "success",
            message: `Analysis complete! Score: ${status.score || 0}%`,
          });
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      if (attempts >= maxAttempts) {
        pollingRef.current = null;
        setPolling(false);
        setError("Analysis is taking too long. Please try again.");
        return;
      }

      // Retry with 10s delay if not yet complete
      pollingRef.current = setTimeout(checkStatus, 10000);
    };

    // First check after 10s to give backend time to process
    pollingRef.current = setTimeout(checkStatus, 10000);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError("Please enter some content to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setToast(null);
    setPolling(false);
    if (pollingRef.current) clearTimeout(pollingRef.current);

    try {
      const response = await fetchWithAuth(API_ENDPOINTS.ANALYZE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const responseData = await response.json();
      const analysisResult = responseData.data || responseData;

      if (!analysisResult || !analysisResult.id) {
        throw new Error("Invalid response format from server");
      }

      // Check if result is already complete (synchronous response)
      if (
        analysisResult.feedback &&
        analysisResult.feedback !== "Processing..."
      ) {
        setResult({
          score: analysisResult.score || 0,
          feedback: analysisResult.feedback || "No feedback available",
          suggestions: analysisResult.suggestions || [],
          corrections: analysisResult.corrections || [],
          originalContent: analysisResult.content || content,
        });
        setShowCorrected(false);

        setToast({
          type: "success",
          message: `Analysis complete! Score: ${analysisResult.score || 0}%`,
        });
      } else {
        // Show processing state and start polling
        setResult({
          score: null,
          feedback: null,
          suggestions: [],
        });
        pollForResult(analysisResult.id);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedContent = () => {
    if (!result || !result.originalContent) return null;
    const corrections = result.corrections || [];
    const text = result.originalContent;

    if (showCorrected) {
      let correctedText = text;
      corrections.forEach((c) => {
        correctedText = correctedText.replace(c.original, c.corrected);
      });
      return <span>{correctedText}</span>;
    }

    if (corrections.length === 0) {
      return <span>{text}</span>;
    }

    // Build parts: find each correction in the text and split around them
    const parts = [];
    let remaining = text;
    // Sort corrections by their position in the text (earliest first)
    const sorted = [...corrections]
      .map((c) => ({ ...c, index: remaining.indexOf(c.original) }))
      .filter((c) => c.index !== -1)
      .sort((a, b) => a.index - b.index);

    // Re-calculate indices from original text sequentially
    let offset = 0;
    sorted.forEach((correction) => {
      const idx = text.indexOf(correction.original, offset);
      if (idx === -1) return;

      // Text before this correction
      if (idx > offset) {
        parts.push({ type: "text", value: text.slice(offset, idx) });
      }

      // The highlighted correction
      parts.push({
        type: "correction",
        original: correction.original,
        corrected: correction.corrected,
        issue: correction.issue,
      });

      offset = idx + correction.original.length;
    });

    // Remaining text after last correction
    if (offset < text.length) {
      parts.push({ type: "text", value: text.slice(offset) });
    }

    return parts.map((part, i) =>
      part.type === "text" ? (
        <span key={i}>{part.value}</span>
      ) : (
        <span
          key={i}
          className="error-highlight"
          data-tooltip={`${part.issue} → ${part.corrected}`}
        >
          {part.original}
        </span>
      )
    );
  };

  const isProcessing = loading || polling;

  return (
    <div className="analyze-content">
      <h2 className="analyze-title">Content Analysis</h2>

      <textarea
        ref={textareaRef}
        className="analyze-textarea"
        rows="6"
        placeholder="Enter your content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isProcessing}
      />

      <button
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={isProcessing}
      >
        {loading ? "Analyzing..." : polling ? "Processing..." : "Analyze"}
      </button>

      {error && <div className="analyze-error">{error}</div>}

      {polling && (
        <div className="analyze-processing">
          <div className="processing-spinner" />
          <p>AI is analyzing your content, please wait...</p>
        </div>
      )}

      {result && !polling && (
        <div className="analyze-result">
          <h3 className="analyze-result-title">Analysis Result</h3>
          <div className="analyze-result-content">
            <p>
              <strong>Score:</strong>{" "}
              {result.score !== undefined && result.score !== null
                ? `${result.score}%`
                : "N/A"}
            </p>
            <p>
              <strong>Feedback:</strong>{" "}
              {result.feedback || "No feedback available"}
            </p>
          </div>
          {result.corrections?.length > 0 && (
            <div className="analyze-corrections">
              <div className="corrections-header">
                <h4>Content Review</h4>
                <button
                  className="corrected-toggle-btn"
                  onClick={() => setShowCorrected(!showCorrected)}
                >
                  {showCorrected ? "Show Original" : "Show Corrected"}
                </button>
              </div>
              <div className="corrections-content">
                {renderHighlightedContent()}
              </div>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div className="analyze-suggestions">
              <h4>Suggestions</h4>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Analyze;
