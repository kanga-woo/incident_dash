import React from "react";

/**
 * Expects incident.llm_summary to be a JSON object or string.
 */
export default function TriagePanel({ incident }) {
  const summary = incident?.llm_summary;
  let parsed = null;

  if (!summary) {
    return <div className="section">No LLM triage yet. Wait a moment or trigger a refresh.</div>;
  }

  // summary may be stored as {"triage": "text"} or JSON
  try {
    if (typeof summary === "string") parsed = { text: summary };
    else if (summary.triage) parsed = { text: summary.triage };
    else parsed = summary;
  } catch (e) {
    parsed = { text: String(summary) };
  }

  return (
    <div className="section">
      <h4>LLM Triage</h4>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{parsed?.text ?? ""}</pre>
    </div>
  );
}