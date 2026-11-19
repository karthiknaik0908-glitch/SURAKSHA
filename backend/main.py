from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import Optional
import database as db
from models import (
    LoginRequest,
    SOSTrackRequest,
    DisasterRiskRequest,
    AlertCreate,
    SOSRequest,
    SOSStatusUpdate,
    RescueTeamCreate,
    RescueTeamUpdate,
    ResourceCreate,
    ResourceUpdate,
)
from risk_engine import assess_flood_risk, assess_landslide_risk
from classifier import classify_emergency

app = FastAPI(
    title="SURAKSHA API",
    version="1.0.0",
    description="SURAKSHA - Multi-Disaster Prediction, Citizen SOS & Protected Rescue Coordination Network"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ok(data=None, msg=""):
    return {"success": True, "data": data, "message": msg}

def err(msg, code=400):
    raise HTTPException(status_code=code, detail={"success": False, "data": None, "message": msg})

# ---- SECURITY DEPENDENCY FOR PROTECTED RESCUE OPERATIONS ----
def get_current_rescue_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "data": None,
                "message": "Authorization denied. Rescue personnel credentials required to access this portal."
            }
        )
    token = authorization.replace("Bearer ", "").strip()
    session = db.verify_auth_token(token)
    if not session:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "data": None,
                "message": "Session expired or invalid token. Please log in with your rescue operator account."
            }
        )
    return session

# Optional auth checker for map points (allows public view or privileged rescue view)
def get_optional_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return db.verify_auth_token(token)

# ==============================================================================
# 1. PUBLIC CITIZEN ENDPOINTS (NO REGISTRATION OR LOGIN REQUIRED)
# ==============================================================================

@app.get("/api/health")
def health():
    return ok(
        {
            "status": "ok",
            "service": "SURAKSHA Multi-Disaster Response Engine",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "Service is healthy and ready"
    )

# --- RESCUE PERSONNEL AUTHENTICATION ---
@app.post("/api/auth/login")
def login(req: LoginRequest):
    auth_data = db.authenticate_user(req.username.strip(), req.password.strip())
    if not auth_data:
        err("Invalid username or password. Authorized rescue personnel only.", 401)
    return ok(auth_data, f"Welcome back, {auth_data['user']['name']} ({auth_data['user']['role'].upper()})")

@app.get("/api/auth/me")
def get_profile(user=Depends(get_current_rescue_user)):
    return ok(user, "Rescue personnel session verified")

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        db.revoke_auth_token(authorization)
    return ok(None, "Logged out successfully")

# --- CITIZEN PUBLIC SOS DISPATCH ---
@app.post("/api/sos", status_code=201)
def create_sos(sos: SOSRequest):
    """
    Public endpoint: Citizen can submit an emergency SOS immediately without any login.
    """
    # Run explainable AI emergency priority classification
    classification = classify_emergency(
        injury_severity=sos.injury_severity,
        num_people=sos.num_people,
        immediate_danger=sos.immediate_danger,
        medical_emergency=sos.medical_emergency,
        description=sos.description
    )
    record = {
        "id": db.new_id(),
        "name": sos.name.strip(),
        "phone": sos.phone.strip(),
        "emergency_type": sos.emergency_type.lower(),
        "num_people": sos.num_people,
        "description": sos.description.strip(),
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "location_name": sos.location_name.strip() if sos.location_name else None,
        "location_status": sos.location_status or ("gps" if sos.latitude is not None and sos.longitude is not None else "unknown"),
        "location_accuracy": sos.location_accuracy,
        "location_captured_at": sos.location_captured_at,
        "status": "pending",
        "priority": classification["priority"],
        "priority_score": classification["score"],
        "priority_reasons": classification["reasons"],
        "assigned_team_id": None,
        "created_at": db.now_iso(),
    }
    db.insert("sos_requests", record)
    return ok(
        record,
        f"SOS successfully registered! Ticket ID: {record['id']}. AI Triage: {classification['priority'].upper()}"
    )

# --- CITIZEN PRIVATE TICKET TRACKING ---
@app.post("/api/sos/track")
def track_sos(req: SOSTrackRequest):
    """
    Public citizen tracking endpoint:
    Validates ticket ID and registered phone number.
    Returns ONLY the matching citizen's private SOS record.
    Never exposes other citizens' private reports.
    """
    record = db.find_sos_by_ticket_and_phone(req.ticket_id, req.phone)
    if not record:
        err(
            "No matching emergency record found. Please verify the SOS Ticket ID and registered phone number.",
            404
        )
    return ok(record, "SOS status retrieved successfully")

# --- PUBLIC DISASTER RISK ASSESSMENT ---
@app.post("/api/disaster-risk")
def disaster_risk(req: DisasterRiskRequest):
    dtype = req.disaster_type.lower()
    if dtype == "flood":
        if not req.flood_data:
            err("flood_data is required for flood risk assessment", 422)
        fd = req.flood_data
        result = assess_flood_risk(
            rainfall_mm=fd.rainfall_mm,
            water_level_m=fd.water_level_m,
            previous_flooding=fd.previous_flooding,
            soil_saturation=fd.soil_saturation
        )
    elif dtype == "landslide":
        if not req.landslide_data:
            err("landslide_data is required for landslide risk assessment", 422)
        ld = req.landslide_data
        result = assess_landslide_risk(
            rainfall_intensity=ld.rainfall_intensity,
            soil_moisture=ld.soil_moisture,
            slope_angle=ld.slope_angle,
            historical_landslides=ld.historical_landslides,
            vegetation_cover=ld.vegetation_cover
        )
    else:
        err(f"AI Risk Assessment model not available for '{req.disaster_type}'. Supported: 'flood', 'landslide'. Incident reporting available for other types.", 400)
    
    record = {
        "id": db.new_id(),
        "disaster_type": dtype,
        "result": result,
        "created_at": db.now_iso()
    }
    db.insert("risk_assessments", record)
    return ok(result, f"AI {dtype.title()} Risk Assessment completed: {result['risk_level'].upper()}")

# --- PUBLIC ALERTS & EARLY WARNINGS ---
@app.get("/api/alerts")
def get_alerts():
    return ok(db.get_all("disaster_alerts"), "Alerts retrieved successfully")

# --- PUBLIC DASHBOARD STATS ---
@app.get("/api/dashboard/stats")
def dashboard_stats():
    return ok(db.get_stats(), "Dashboard statistics retrieved")

# --- PUBLIC GEOSPATIAL MAP POINTS ---
@app.get("/api/map-points")
def map_points(user=Depends(get_optional_user)):
    """
    Returns shelters and hospitals for all users.
    If authenticated as rescue personnel, returns full victim contact details.
    For public citizens, displays anonymous priority markers to preserve victim privacy.
    """
    points = list(db.MAP_POINTS)
    sos_list = db.get_all("sos_requests")
    is_authorized_rescue = user is not None

    for s in sos_list:
        if s.get("latitude") and s.get("longitude"):
            if is_authorized_rescue:
                # Full rescue view
                points.append({
                    "id": s["id"],
                    "type": "sos",
                    "name": f"SOS: {s['name']}",
                    "lat": s["latitude"],
                    "lng": s["longitude"],
                    "details": f"{s['description']} ({s.get('num_people', 1)} people)",
                    "priority": s.get("priority", "medium"),
                    "status": s.get("status", "pending"),
                    "contact": s.get("phone", ""),
                    "is_authorized_view": True
                })
            else:
                # Public citizen view: Anonymized to preserve victim safety & privacy
                points.append({
                    "id": s["id"],
                    "type": "sos",
                    "name": f"Emergency Incident ({s.get('emergency_type', 'disaster').title()})",
                    "lat": s["latitude"],
                    "lng": s["longitude"],
                    "details": f"Priority: {s.get('priority', 'medium').upper()} • Status: {s.get('status', 'pending').upper()}",
                    "priority": s.get("priority", "medium"),
                    "status": s.get("status", "pending"),
                    "contact": "Contact Local Police/SDRF via 112",
                    "is_authorized_view": False
                })
    return ok(points, "Map points retrieved")

# ==============================================================================
# 2. PROTECTED RESCUE PERSONNEL APIS (REQUIRES RESCUE AUTHORIZATION TOKEN)
# ==============================================================================

@app.get("/api/sos")
def get_all_sos(user=Depends(get_current_rescue_user)):
    """
    Protected: Only authorized rescue officers can view the master list of all incoming citizen SOS requests.
    """
    return ok(db.get_all("sos_requests"), "Master SOS incident records retrieved for rescue operations")

@app.patch("/api/sos/{sos_id}")
def update_sos(sos_id: str, update: SOSStatusUpdate, user=Depends(get_current_rescue_user)):
    """
    Protected: Only authorized rescue officers can assign teams and update status.
    """
    item = db.get_by_id("sos_requests", sos_id)
    if not item:
        err("SOS request not found", 404)
    updates = {"status": update.status.lower()}
    if update.assigned_team_id is not None:
        updates["assigned_team_id"] = update.assigned_team_id
        if update.assigned_team_id:
            db.update_item("rescue_teams", update.assigned_team_id, {"assigned_sos_id": sos_id, "status": "deployed"})
    if update.notes:
        updates["notes"] = update.notes
    result = db.update_item("sos_requests", sos_id, updates)
    return ok(result, f"SOS status updated to {update.status.upper()} by Officer {user.get('name')}")

@app.post("/api/alerts", status_code=201)
def create_alert(alert: AlertCreate, user=Depends(get_current_rescue_user)):
    """
    Protected: Official alert broadcasting is reserved for authenticated operators.
    """
    record = {
        "id": db.new_id(),
        "disaster_type": alert.disaster_type.lower(),
        "location": alert.location,
        "severity": alert.severity.lower(),
        "description": alert.description,
        "source": alert.source,
        "safety_actions": alert.safety_actions or [],
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "is_active": True,
        "broadcast_by": user.get("name"),
        "notes": f"Broadcasted via Rescue Console by {user.get('name')}",
        "created_at": db.now_iso(),
    }
    db.insert("disaster_alerts", record)
    return ok(record, "Disaster alert broadcasted successfully")

@app.get("/api/rescue-teams")
def get_teams(user=Depends(get_current_rescue_user)):
    return ok(db.get_all("rescue_teams"), "Rescue teams retrieved")

@app.post("/api/rescue-teams", status_code=201)
def create_team(team: RescueTeamCreate, user=Depends(get_current_rescue_user)):
    record = {
        "id": db.new_id(),
        "name": team.name,
        "type": team.type,
        "contact": team.contact,
        "capacity": team.capacity,
        "location": team.location,
        "status": team.status,
        "assigned_sos_id": None,
        "notes": f"Created by {user.get('name')}",
        "created_at": db.now_iso(),
    }
    db.insert("rescue_teams", record)
    return ok(record, "Rescue team created successfully")

@app.patch("/api/rescue-teams/{team_id}")
def update_team(team_id: str, update: RescueTeamUpdate, user=Depends(get_current_rescue_user)):
    item = db.get_by_id("rescue_teams", team_id)
    if not item:
        err("Rescue team not found", 404)
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    result = db.update_item("rescue_teams", team_id, updates)
    return ok(result, "Rescue team updated successfully")

@app.get("/api/resources")
def get_resources(user=Depends(get_current_rescue_user)):
    return ok(db.get_all("resources"), "Resources retrieved")

@app.post("/api/resources", status_code=201)
def create_resource(res: ResourceCreate, user=Depends(get_current_rescue_user)):
    record = {
        "id": db.new_id(),
        "type": res.type.lower(),
        "name": res.name,
        "quantity": res.quantity,
        "available": res.available,
        "location": res.location,
        "unit": res.unit,
        "status": "active",
        "assigned_to": None,
        "logged_by": user.get("name"),
        "created_at": db.now_iso(),
    }
    db.insert("resources", record)
    return ok(record, "Resource registered successfully")

@app.patch("/api/resources/{resource_id}")
def update_resource(resource_id: str, update: ResourceUpdate, user=Depends(get_current_rescue_user)):
    item = db.get_by_id("resources", resource_id)
    if not item:
        err("Resource not found", 404)
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    result = db.update_item("resources", resource_id, updates)
    return ok(result, "Resource updated successfully")

@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: str, user=Depends(get_current_rescue_user)):
    deleted = db.delete_item("resources", resource_id)
    if not deleted:
        err("Resource not found", 404)
    return ok(None, "Resource deleted successfully")
