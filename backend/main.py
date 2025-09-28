from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from .database import Base, engine, get_db
from .models import Incident, Annotation
from .ws_manager import manager
import uuid
import os
import openai

#Initialize the database
Base.metadata.create_all(bind=engine)
app = FastAPI(title="API-Assisted DevOps Incident API")
openai.api_key = os.getenv("OPENAI_API_KEY")

#SCHEMA
class IncidentCreate(BaseModel):
    title: str
    source: str
    severity: Optional[str] = None
    raw_event: dict

class AnnotationCreate(BaseModel):
    body: str
    metadata: Optional[dict] = None

#OAuth mock
def get_current_user():
    # Mock user
    return {"user_id": str(uuid.uuid4()), "role": "oncall"}

#Routes
@app.post("/api/ingest")
async def ingest_incident(incident: IncidentCreate, 
                          background_tasks: BackgroundTasks,
                          db: Session = Depends(get_db),
                          user=Depends(get_current_user)
                          ):
    db_incident = Incident(
        title=incident.title,
        source=incident.source,
        severity=incident.severity or "unknown",
        raw_event=incident.raw_event,
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    #trigger async LLM enrichment
    background_tasks.add_task(run_llm_triage, db_incident.id, incident.raw_event, db_incident.title)
    await manager.broadcast({"event": "incident.new", "incidnet_id": str(db_incident.id)})
    return db_incident

@app.get("api/incidnets")
def list_incidents(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Incident).all()

@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Incident).filter(Incident.id == incident_id).first()

@app.post("/api/incidents/{incident_id}/annotations")
async def add_annotation(incident_id: str,
                         annotation: AnnotationCreate,
                         db: Session = Depends(get_db),
                         user=Depends(get_current_user)):
    db_annotation = Annotation(
        incident_id=incident_id,
        user_id=user["user_id"],
        body=annotation.body,
        metadata=annotation.metadata,
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)

    await manager.broadcast({"event": "annotation.new", "incident_id": incident_id})
    return db_annotation

#WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)   

#Background LLM triage function
def run_llm_triage(incident_id: uuid.UUID, raw_event: dict, title: str):
    "Backgroound task to call LLM and update incident"
    from sqlalchemy.orm import Session
    from .database import SessionLocal
    db: Session = SessionLocal()

    prompt = f"""Classify and suggest remediation for the following incident:
Title: {title}
Event: {raw_event}"""
    
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a DevOps incident triage assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300,
        )
        content = resp["choices"][0]["message"]["content"]
    except Exception as e:
        content = f"LLM error: {str(e)}"
    
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident:
        incident.llm_summary = {"triage": content}
        db.commit()
       
    #broadcast update
    import asyncio
    asyncio.run(manager.broadcast({"event": "incident.updated", "incident_id": str(incident_id)}))
    db.close()