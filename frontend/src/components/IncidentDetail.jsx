import React, { useEffect, useState } from "react";
import TriagePanel from "./TriagePanel";
import AnnotationEditor from "./AnnotationEditor";
import { fetchIncident } from "../api";

export default function IncidentDetail({ incident }) {
  const [full, setFull] = useState(incident);

  useEffect(() => {
    // fetch up-to-date detail (including annotations) when selected
    (async () => {
      try {
        const data = await fetchIncident(incident.id);
        setFull(data || incident);
      } catch (err) {
        console.warn("Could not fetch incident detail", err);
        setFull(incident);
      }
    })();
  }, [incident]);

  return (
    <div>
      <div className="detail-header">
        <div>
          <h2>{full.title}</h2>
          <div style={{ color: "#9aa4b2" }}>{full.source} • {full.status} • {new Date(full.created_at).toLocaleString()}</div>
        </div>
        <div>
          <button className="btn" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>

      <div className="section">
        <h4>Raw Event</h4>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
          {JSON.stringify(full.raw_event, null, 2)}
        </pre>
      </div>

      <TriagePanel incident={full} />

      <AnnotationEditor incidentId={full.id} existingAnnotations={full.annotations || []} />
    </div>
  );
}