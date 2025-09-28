import React, { useState } from "react";
import { postAnnotation } from "../api";

/**
 * Basic annotation editor. Submits to backend and relies on WS broadcast to sync to other clients.
 */
export default function AnnotationEditor({ incidentId, existingAnnotations = [] }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    // optimistic local update
    setLocalNotes((s) => [
      ...s,
      { id: `local-${Date.now()}`, body: text, created_at: new Date().toISOString(), user: "you" },
    ]);
    setText("");

    try {
      await postAnnotation(incidentId, { body: text });
      // backend will broadcast and refresh the incident list via WS in App
    } catch (err) {
      console.error("Failed to post annotation", err);
      alert("Failed to post annotation. See console.");
    } finally {
      setSubmitting(false);
    }
  }

  const combined = [...existingAnnotations, ...localNotes];

  return (
    <div className="section">
      <h4>Annotations</h4>
      <div style={{ marginBottom: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ width: "100%", borderRadius: 6, padding: 8 }}
          placeholder="Add a note (e.g., what you checked, commands run, etc.)"
        />
        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn" onClick={submit} disabled={submitting}>
            {submitting ? "Posting..." : "Post annotation"}
          </button>
        </div>
      </div>

      <div>
        {combined.length === 0 && <div style={{ color: "#9aa4b2" }}>No annotations yet</div>}
        {combined.map((a) => (
          <div className="annotation" key={a.id || a.created_at}>
            <div style={{ fontSize: 12, color: "#9aa4b2" }}>
              {a.user || "unknown"} • {new Date(a.created_at).toLocaleString()}
            </div>
            <div style={{ marginTop: 6 }}>{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
