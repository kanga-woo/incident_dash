// Minimal API client. Adjust REACT_APP_API_BASE to point to your FastAPI backend.
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = opts.headers || {};
  // mock auth header - replace with real token retrieval
  headers["Authorization"] = `Bearer ${localStorage.getItem("fake_token") || "devtoken"}`;
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function fetchIncidents() {
  return request("/incidents");
}

export async function fetchIncident(id) {
  return request(`/incidents/${id}`);
}

export async function postAnnotation(incidentId, body) {
  return request(`/incidents/${incidentId}/annotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}