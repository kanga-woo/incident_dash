import React from "react";

export default function IncidentList({ incidents, selected, onSelect }) {
  return (
    <div className="incident-list">
      <h3>Incidents</h3>
      {incidents.length === 0 && <p style={{ color: "#9aa4b2" }}>No incidents yet</p>}
      {incidents.map((inc) => {
        const id = String(inc.id);
        const selectedClass = selected && String(selected.id) === id ? "selected" : "";
        return (
          <div
            key={id}
            className={`incident-card ${selectedClass}`}
            onClick={() => onSelect(inc)}
            role="button"
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600 }}>{inc.title || "Untitled"}</div>
              <div style={{ color: "#9aa4b2" }}>{inc.severity || "unknown"}</div>
            </div>
            <div style={{ marginTop: 6, color: "#9aa4b2", fontSize: 13 }}>
              {inc.source || "source unknown"} • {new Date(inc.created_at).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}