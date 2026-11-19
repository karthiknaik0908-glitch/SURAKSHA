from pydantic import BaseModel, Field
from typing import Optional, List, Any
import uuid

def gen_id():
    return str(uuid.uuid4())

class LoginRequest(BaseModel):
    username: str
    password: str

class SOSTrackRequest(BaseModel):
    ticket_id: str
    phone: str

class FloodRiskInput(BaseModel):
    rainfall_mm: float = Field(ge=0, le=1000)
    water_level_m: float = Field(ge=0, le=50)
    previous_flooding: bool = False
    soil_saturation: float = Field(ge=0, le=100, default=50)

class LandslideRiskInput(BaseModel):
    rainfall_intensity: float = Field(ge=0, le=200)
    soil_moisture: float = Field(ge=0, le=100)
    slope_angle: float = Field(ge=0, le=90)
    historical_landslides: bool = False
    vegetation_cover: str = Field(default="moderate")  # dense/moderate/sparse

class DisasterRiskRequest(BaseModel):
    disaster_type: str  # flood / landslide
    flood_data: Optional[FloodRiskInput] = None
    landslide_data: Optional[LandslideRiskInput] = None

class SOSRequest(BaseModel):
    name: str
    phone: str
    emergency_type: str
    num_people: int = Field(ge=1)
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    injury_severity: str = "moderate"  # none/minor/moderate/severe/critical
    immediate_danger: bool = False
    medical_emergency: bool = False
    location_status: Optional[str] = None  # gps / manual / unknown
    location_accuracy: Optional[float] = None
    location_captured_at: Optional[str] = None

class SOSStatusUpdate(BaseModel):
    status: str  # pending/assigned/in_progress/rescued
    assigned_team_id: Optional[str] = None
    notes: Optional[str] = None

class AlertCreate(BaseModel):
    disaster_type: str
    location: str
    severity: str  # low/medium/high/critical
    description: str
    source: str = "user_reported"  # risk_assessment/user_reported/official_alert
    safety_actions: Optional[List[str]] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RescueTeamCreate(BaseModel):
    name: str
    type: str
    contact: str
    capacity: int
    location: Optional[str] = None
    status: str = "available"  # available/deployed/off_duty

class RescueTeamUpdate(BaseModel):
    status: Optional[str] = None
    location: Optional[str] = None
    assigned_sos_id: Optional[str] = None
    notes: Optional[str] = None

class ResourceCreate(BaseModel):
    type: str  # ambulances/food_supplies/drinking_water/emergency_shelters/medical_supplies/rescue_personnel
    name: str
    quantity: int = Field(ge=0)
    available: int = Field(ge=0)
    location: str
    unit: str = "units"

class ResourceUpdate(BaseModel):
    quantity: Optional[int] = None
    available: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None

class APIResponse(BaseModel):
    success: bool
    data: Any = None
    message: str = ""
