import json
import os
import re
import uuid
import secrets
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

def _file(name: str) -> Path:
    return DATA_DIR / f"{name}.json"

def _load(name: str):
    f = _file(name)
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

def _save(name: str, data):
    _file(name).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

# ---- PHONE NORMALIZATION FOR ACCURATE LOOKUPS ----
def normalize_phone(phone_str: str) -> str:
    if not phone_str:
        return ""
    # Extract only digits
    digits = re.sub(r"\D", "", phone_str)
    # If starts with 91 and has 12 digits, extract last 10
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    # If has leading 0 and 11 digits, extract last 10
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits

# ---- SEED DEMO DATA ----
def _seed():
    if not _file("seeded").exists():
        # Pre-seeded Rescue Personnel Accounts
        users = [
            {
                "id": new_id(),
                "username": "rescue",
                "password": "rescue112",  # Demo credentials
                "name": "Commander Ramesh Nayak",
                "role": "rescue_officer",
                "badge": "SDRF-KA-112",
                "station": "Central Disaster Response Station, Bengaluru",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "username": "admin",
                "password": "admin112",
                "name": "Director Ananya Sharma",
                "role": "admin",
                "badge": "NDRF-HQ-001",
                "station": "State Emergency Operations Center",
                "created_at": now_iso()
            }
        ]
        _save("rescue_users", users)

        # Rescue teams
        teams = [
            {
                "id": new_id(),
                "name": "Team Alpha - Flood Response",
                "type": "flood_rescue",
                "contact": "+91-9876543210",
                "capacity": 10,
                "location": "Central Station, Bengaluru",
                "status": "available",
                "assigned_sos_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "name": "Team Beta - Medical Unit",
                "type": "medical",
                "contact": "+91-9876543211",
                "capacity": 6,
                "location": "City Hospital, Mysuru",
                "status": "deployed",
                "assigned_sos_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "name": "Team Gamma - Search & Rescue",
                "type": "search_rescue",
                "contact": "+91-9876543212",
                "capacity": 8,
                "location": "District HQ, Mangaluru",
                "status": "available",
                "assigned_sos_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
        ]
        _save("rescue_teams", teams)

        # Resources
        resources = [
            {
                "id": new_id(),
                "type": "ambulances",
                "name": "Ambulance Fleet",
                "quantity": 12,
                "available": 4,
                "location": "Central Medical HQ, Bengaluru",
                "unit": "vehicles",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "type": "food_supplies",
                "name": "Emergency Food Packs",
                "quantity": 500,
                "available": 200,
                "location": "State Relief Warehouse, Bengaluru",
                "unit": "packets",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "type": "drinking_water",
                "name": "Drinking Water (20L Cans)",
                "quantity": 1000,
                "available": 500,
                "location": "District Supply Center, Mysuru",
                "unit": "cans",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "type": "emergency_shelters",
                "name": "Emergency Shelter Tents",
                "quantity": 50,
                "available": 8,
                "location": "SDRF Base Camp, Bengaluru",
                "unit": "tents",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "type": "medical_supplies",
                "name": "Trauma First Aid Kits",
                "quantity": 300,
                "available": 150,
                "location": "PHC Medical Stores, Coorg",
                "unit": "kits",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "type": "rescue_personnel",
                "name": "SDRF Personnel Force",
                "quantity": 50,
                "available": 25,
                "location": "State Disaster Response HQ",
                "unit": "personnel",
                "status": "active",
                "assigned_to": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
        ]
        _save("resources", resources)

        # SOS requests
        sos_list = [
            {
                "id": new_id(),
                "name": "Rajan Kumar",
                "phone": "+91-9845012345",
                "emergency_type": "flood",
                "num_people": 8,
                "description": "Family stranded on rooftop due to flood water rising rapidly over 2 meters. Immediate rescue boat needed.",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "location_name": "Koramangala 6th Block, Bengaluru",
                "status": "in_progress",
                "priority": "critical",
                "priority_score": 85,
                "priority_reasons": [
                    "DEMO DATA - Severe flooding danger",
                    "Multiple people trapped (8 people)",
                    "Immediate danger to life reported"
                ],
                "assigned_team_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "name": "Meena Devi",
                "phone": "+91-9740123456",
                "emergency_type": "landslide",
                "num_people": 3,
                "description": "Road blocked by debris after heavy downpour, elderly parent injured with suspected fracture.",
                "latitude": 12.4244,
                "longitude": 75.7382,
                "location_name": "Madikeri Hill Road, Coorg",
                "status": "assigned",
                "priority": "high",
                "priority_score": 60,
                "priority_reasons": [
                    "DEMO DATA - Moderate/severe injury",
                    "Medical emergency confirmed",
                    "Landslide hazard zone"
                ],
                "assigned_team_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "name": "Suresh Rao",
                "phone": "+91-9900123456",
                "emergency_type": "earthquake",
                "num_people": 2,
                "description": "Minor tremors caused wall cracks, need inspection and first-aid supplies.",
                "latitude": 12.8456,
                "longitude": 77.6600,
                "location_name": "Electronic City Phase 1, Bengaluru",
                "status": "pending",
                "priority": "medium",
                "priority_score": 35,
                "priority_reasons": [
                    "DEMO DATA - Minor injuries",
                    "No immediate structural collapse danger"
                ],
                "assigned_team_id": None,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
        ]
        _save("sos_requests", sos_list)

        # Alerts
        alerts = [
            {
                "id": new_id(),
                "disaster_type": "flood",
                "location": "Cauvery River Basin, Mandya & Mysuru",
                "severity": "high",
                "description": "Water discharge from KRS Dam increased to 80,000 cusecs. Flood warning issued for downstream riverbank villages.",
                "source": "official_alert",
                "safety_actions": [
                    "Move livestock and valuables to high ground immediately",
                    "Do not venture near Cauvery riverbanks or bridges",
                    "Keep emergency survival kit, dry food and torches ready"
                ],
                "latitude": 12.3400,
                "longitude": 76.6400,
                "is_active": True,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
            {
                "id": new_id(),
                "disaster_type": "landslide",
                "location": "Western Ghats, Coorg & Sakleshpur",
                "severity": "medium",
                "description": "Continuous precipitation over 120mm in 24 hours. Soil saturation exceeding 85% on steep road cuttings.",
                "source": "risk_assessment",
                "safety_actions": [
                    "Avoid night driving on ghat roads",
                    "Stay alert to mud streams, falling rocks, or sudden tree tilting",
                    "Contact taluk disaster control room at 1077 in emergency"
                ],
                "latitude": 12.4200,
                "longitude": 75.7400,
                "is_active": True,
                "notes": "DEMO DATA",
                "created_at": now_iso()
            },
        ]
        _save("disaster_alerts", alerts)

        # Risk assessments & Auth tokens
        _save("risk_assessments", [])
        _save("auth_tokens", [])

        # Mark seeded
        _file("seeded").write_text("true", encoding="utf-8")

# Initialize seed
_seed()

# Ensure users exist even if seeded before
if not _file("rescue_users").exists():
    users = [
        {
            "id": new_id(),
            "username": "rescue",
            "password": "rescue112",
            "name": "Commander Ramesh Nayak",
            "role": "rescue_officer",
            "badge": "SDRF-KA-112",
            "station": "Central Disaster Response Station, Bengaluru",
            "created_at": now_iso()
        },
        {
            "id": new_id(),
            "username": "admin",
            "password": "admin112",
            "name": "Director Ananya Sharma",
            "role": "admin",
            "badge": "NDRF-HQ-001",
            "station": "State Emergency Operations Center",
            "created_at": now_iso()
        }
    ]
    _save("rescue_users", users)

# ---- AUTHENTICATION HELPERS ----
def authenticate_user(username: str, password: str):
    users = _load("rescue_users")
    user = next((u for u in users if u.get("username") == username and u.get("password") == password), None)
    if not user:
        return None
    # Generate token
    token = f"srk_{secrets.token_hex(24)}"
    token_data = {
        "token": token,
        "user_id": user["id"],
        "username": user["username"],
        "name": user["name"],
        "role": user["role"],
        "badge": user.get("badge", ""),
        "created_at": now_iso()
    }
    tokens = _load("auth_tokens")
    tokens.append(token_data)
    _save("auth_tokens", tokens)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "badge": user.get("badge", ""),
            "station": user.get("station", "")
        }
    }

def verify_auth_token(token: str):
    if not token:
        return None
    token = token.replace("Bearer ", "").strip()
    tokens = _load("auth_tokens")
    token_entry = next((t for t in tokens if t.get("token") == token), None)
    return token_entry

def revoke_auth_token(token: str):
    if not token:
        return False
    token = token.replace("Bearer ", "").strip()
    tokens = _load("auth_tokens")
    new_tokens = [t for t in tokens if t.get("token") != token]
    _save("auth_tokens", new_tokens)
    return True

# ---- CITIZEN PRIVATE TICKET LOOKUP ----
def find_sos_by_ticket_and_phone(ticket_id: str, phone: str):
    if not ticket_id or not phone:
        return None
    target_tid = ticket_id.strip()
    target_norm_phone = normalize_phone(phone)

    sos_list = _load("sos_requests")
    for s in sos_list:
        # Match ID
        if s.get("id") == target_tid:
            # Check phone match
            record_norm_phone = normalize_phone(s.get("phone", ""))
            if (
                target_norm_phone == record_norm_phone or
                (len(target_norm_phone) >= 10 and target_norm_phone[-10:] == record_norm_phone[-10:])
            ):
                # Retrieve assigned team details if assigned
                team_info = None
                if s.get("assigned_team_id"):
                    team = get_by_id("rescue_teams", s["assigned_team_id"])
                    if team:
                        team_info = {
                            "name": team.get("name"),
                            "type": team.get("type"),
                            "contact": team.get("contact"),
                            "status": team.get("status")
                        }
                return {
                    "id": s["id"],
                    "name": s["name"],
                    "phone": s["phone"],
                    "emergency_type": s["emergency_type"],
                    "num_people": s["num_people"],
                    "description": s["description"],
                    "location_name": s.get("location_name"),
                    "latitude": s.get("latitude"),
                    "longitude": s.get("longitude"),
                    "location_status": s.get("location_status"),
                    "location_accuracy": s.get("location_accuracy"),
                    "location_captured_at": s.get("location_captured_at"),
                    "status": s["status"],
                    "priority": s["priority"],
                    "priority_score": s.get("priority_score"),
                    "created_at": s["created_at"],
                    "updated_at": s.get("updated_at"),
                    "assigned_team": team_info,
                    "notes": s.get("notes")
                }
    return None

# ---- CRUD helpers ----
def get_all(collection: str):
    return _load(collection)

def get_by_id(collection: str, item_id: str):
    return next((x for x in _load(collection) if x.get("id") == item_id), None)

def insert(collection: str, item: dict):
    data = _load(collection)
    data.append(item)
    _save(collection, data)
    return item

def update_item(collection: str, item_id: str, updates: dict):
    data = _load(collection)
    for i, item in enumerate(data):
        if item.get("id") == item_id:
            data[i] = {**item, **updates, "updated_at": now_iso()}
            _save(collection, data)
            return data[i]
    return None

def delete_item(collection: str, item_id: str):
    data = _load(collection)
    new_data = [x for x in data if x.get("id") != item_id]
    if len(new_data) < len(data):
        _save(collection, new_data)
        return True
    return False

def get_stats():
    sos = _load("sos_requests")
    alerts = _load("disaster_alerts")
    teams = _load("rescue_teams")
    resources = _load("resources")
    return {
        "total_sos": len(sos),
        "critical_emergencies": sum(1 for s in sos if s.get("priority") == "critical" and s.get("status") != "rescued"),
        "active_alerts": sum(1 for a in alerts if a.get("is_active", True)),
        "rescued_people": sum(s.get("num_people", 0) for s in sos if s.get("status") == "rescued"),
        "available_teams": sum(1 for t in teams if t.get("status") == "available"),
        "total_teams": len(teams),
        "available_resources": sum(r.get("available", 0) for r in resources),
        "pending_sos": sum(1 for s in sos if s.get("status") == "pending"),
        "in_progress_sos": sum(1 for s in sos if s.get("status") == "in_progress"),
    }

# Map points (demo verified facilities)
MAP_POINTS = [
    {
        "id": "h1",
        "type": "hospital",
        "name": "Victoria Hospital & Trauma Centre",
        "lat": 12.9629,
        "lng": 77.5739,
        "details": "Major Emergency Trauma Care - DEMO DATA",
        "contact": "+91-80-26701150"
    },
    {
        "id": "h2",
        "type": "hospital",
        "name": "Bowring & Lady Curzon Hospital",
        "lat": 12.9830,
        "lng": 77.6050,
        "details": "Emergency 24x7 Casualty - DEMO DATA",
        "contact": "+91-80-25591325"
    },
    {
        "id": "h3",
        "type": "hospital",
        "name": "K.R. Hospital Mysuru",
        "lat": 12.3168,
        "lng": 76.6496,
        "details": "Regional Government Trauma Ward - DEMO DATA",
        "contact": "+91-821-2423100"
    },
    {
        "id": "s1",
        "type": "shelter",
        "name": "Kanteerava Indoor Stadium Relief Camp",
        "lat": 12.9698,
        "lng": 77.5926,
        "details": "Designated Relief Center (Cap: 800) - DEMO DATA",
        "contact": "1077 (District Disaster Line)"
    },
    {
        "id": "s2",
        "type": "shelter",
        "name": "Town Hall Emergency Shelter",
        "lat": 12.9634,
        "lng": 77.5843,
        "details": "Relief & Distribution Point (Cap: 450) - DEMO DATA",
        "contact": "112 (Emergency Response)"
    },
    {
        "id": "s3",
        "type": "shelter",
        "name": "SDRF Regional Operations Base",
        "lat": 13.0033,
        "lng": 77.5645,
        "details": "State Disaster Response Staging Camp - DEMO DATA",
        "contact": "+91-80-22253333"
    },
]
