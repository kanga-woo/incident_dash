import React, { useEffect, useState } from "react";
import IncidentList from "./components/IncidentList";
import IncidentDetail from "./components/IncidentDetail";
import { connectWS } from "./ws";
import { fetchIncidents } from "./api";

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // load initial incidents
    (async () => {
      const list = await fetchIncidents();
      setIncidents(list || []);
    })();

    const ws = connectWS({
      onMessage: (msg) => {
        // server sends { event: "incident.new" | "incident.update" | "annotation.add", incident_id, payload? }
        if (msg?.event === "incident.new") {
          // fetch the new incident
          (async () => {
            const list = await fetchIncidents();
            setIncidents(list || []);
          })();
        } else if (msg?.event === "incident.update") {
          // refresh list and maybe selected incident
          (async () => {
            const list = await fetchIncidents();
            setIncidents(list || []);
            if (selected && String(selected.id) === msg.incident_id) {
              // select updated incident
              const updated = list.find((i) => String(i.id) === msg.incident_id);
              setSelected(updated || null);
            }
          })();
        } else if (msg?.event === "annotation.add") {
          // quick refresh of selected incident and list
          (async () => {
            const list = await fetchIncidents();
            setIncidents(list || []);
            if (selected && String(selected.id) === msg.incident_id) {
              const updated = list.find((i) => String(i.id) === msg.incident_id);
              setSelected(updated || null);
            }
          })();
        }
      },
    });

    return () => ws.close();
  }, [selected]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>AI-Assisted Incident Dashboard (MVP)</h1>
      </header>

      <div className="layout">
        <IncidentList
          incidents={incidents}
          selected={selected}
          onSelect={(i) => setSelected(i)}
        />

        <div className="content">
          {selected ? (
            <IncidentDetail incident={selected} />
          ) : (
            <div className="empty">
              <p>Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}