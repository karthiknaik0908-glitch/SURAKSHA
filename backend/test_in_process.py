import sys
import json
from models import (
    DisasterRiskRequest, FloodRiskInput, LandslideRiskInput,
    SOSRequest, SOSStatusUpdate, AlertCreate, RescueTeamCreate,
    RescueTeamUpdate, ResourceCreate, ResourceUpdate
)
import main
import database as db

# Mock authenticated rescue user for in-process protected API tests
MOCK_USER = {
    "token": "test_mock_token",
    "user_id": "test-user-id",
    "username": "admin",
    "name": "Test Admin",
    "role": "admin",
    "badge": "TEST-001",
}

def run_tests():
    print("=" * 60)
    print("SURAKSHA DIRECT IN-PROCESS API & ENGINE TEST SUITE")
    print("=" * 60)

    # 1. Health
    h = main.health()
    assert h["success"] is True
    print("✓ Health Check:", h["data"]["status"], h["data"]["version"])

    # 2. Flood Risk Assessment
    flood_req = DisasterRiskRequest(
        disaster_type="flood",
        flood_data=FloodRiskInput(
            rainfall_mm=190,
            water_level_m=9.5,
            previous_flooding=True,
            soil_saturation=88
        )
    )
    res_flood = main.disaster_risk(flood_req)
    assert res_flood["success"] is True
    flood_eval = res_flood["data"]
    print(f"✓ AI Flood Assessment: Level={flood_eval['risk_level'].upper()}, Score={flood_eval['score']}/{flood_eval['max_score']}")
    assert flood_eval["risk_level"] == "critical"
    assert len(flood_eval["factors"]) >= 4
    assert len(flood_eval["precautions"]) >= 3

    # 3. Landslide Risk Assessment
    ls_req = DisasterRiskRequest(
        disaster_type="landslide",
        landslide_data=LandslideRiskInput(
            rainfall_intensity=55,
            soil_moisture=92,
            slope_angle=45,
            historical_landslides=True,
            vegetation_cover="sparse"
        )
    )
    res_ls = main.disaster_risk(ls_req)
    assert res_ls["success"] is True
    ls_eval = res_ls["data"]
    print(f"✓ AI Landslide Assessment: Level={ls_eval['risk_level'].upper()}, Score={ls_eval['score']}/{ls_eval['max_score']}")
    assert ls_eval["risk_level"] == "critical"

    # 4. SOS Emergency Creation with AI Priority Classification
    sos_in = SOSRequest(
        name="Ramesh Gowda",
        phone="+91-9876500001",
        emergency_type="flood",
        num_people=9,
        description="Water rapidly rising over roof level, 3 children trapped with no food, elderly grandmother unwell.",
        latitude=12.2958,
        longitude=76.6394,
        location_name="Cauvery River Embankment, Srirangapatna",
        injury_severity="severe",
        immediate_danger=True,
        medical_emergency=True
    )
    res_sos = main.create_sos(sos_in)
    assert res_sos["success"] is True
    sos_record = res_sos["data"]
    print(f"✓ AI Emergency SOS Triage: Priority={sos_record['priority'].upper()} (Score: {sos_record['priority_score']}), ID={sos_record['id']}")
    assert sos_record["priority"] == "critical"
    assert sos_record["status"] == "pending"

    # 5. Rescue Status Update & Team Assignment (pass mock user to bypass Depends)
    teams = main.get_teams(user=MOCK_USER)["data"]
    assigned_team = teams[0]["id"]
    update_res = main.update_sos(sos_record["id"], SOSStatusUpdate(status="in_progress", assigned_team_id=assigned_team, notes="Boat unit dispatched"), user=MOCK_USER)
    assert update_res["success"] is True
    assert update_res["data"]["status"] == "in_progress"
    assert update_res["data"]["assigned_team_id"] == assigned_team
    print("✓ SOS Status & Team Assignment:", update_res["data"]["status"], "assigned to team", assigned_team)

    # 6. Disaster Alerts Generation
    alert_in = AlertCreate(
        disaster_type="cyclone",
        location="Coastal Mangaluru & Udupi",
        severity="critical",
        description="Severe cyclonic storm nearing coastline. Gusts reaching 95 km/h with heavy storm surge.",
        source="official_alert",
        safety_actions=["Evacuate low-lying fishing settlements", "Stay indoors away from windows", "Keep battery lamps ready"],
        latitude=12.9141,
        longitude=74.8560
    )
    alert_res = main.create_alert(alert_in, user=MOCK_USER)
    assert alert_res["success"] is True
    assert alert_res["data"]["severity"] == "critical"
    print("✓ Disaster Alert Broadcasted:", alert_res["data"]["location"], alert_res["data"]["severity"])

    # 7. Rescue Teams Management
    team_in = RescueTeamCreate(
        name="Team Delta - High Altitude Air Rescue",
        type="aerial_rescue",
        contact="+91-9845099887",
        capacity=6,
        location="HAL Airport Base, Bengaluru",
        status="available"
    )
    new_team_res = main.create_team(team_in, user=MOCK_USER)
    assert new_team_res["success"] is True
    new_team_id = new_team_res["data"]["id"]
    print("✓ Rescue Team Created:", new_team_res["data"]["name"], "ID:", new_team_id)

    # Update team
    team_up = main.update_team(new_team_id, RescueTeamUpdate(status="deployed", notes="On standby"), user=MOCK_USER)
    assert team_up["data"]["status"] == "deployed"
    print("✓ Rescue Team Updated:", team_up["data"]["status"])

    # 8. Resource Management Logistics
    res_in = ResourceCreate(
        type="drinking_water",
        name="Drinking Water 20L Emergency Cans",
        quantity=500,
        available=80,  # Below 25% shortage threshold
        location="Relief Warehouse B, Mysuru",
        unit="cans"
    )
    res_created = main.create_resource(res_in, user=MOCK_USER)
    assert res_created["success"] is True
    res_id = res_created["data"]["id"]
    print("✓ Resource Registered:", res_created["data"]["name"], f"({res_created['data']['available']}/{res_created['data']['quantity']} {res_created['data']['unit']})")

    # Update resource
    res_mod = main.update_resource(res_id, ResourceUpdate(available=150), user=MOCK_USER)
    assert res_mod["data"]["available"] == 150
    print("✓ Resource Availability Updated to:", res_mod["data"]["available"])

    # Delete resource
    del_res = main.delete_resource(res_id, user=MOCK_USER)
    assert del_res["success"] is True
    print("✓ Resource Deleted Successfully")

    # 9. Dashboard Statistics
    stats = main.dashboard_stats()["data"]
    print("✓ Dashboard Statistics Aggregated:", stats)
    assert stats["total_sos"] >= 4
    assert stats["critical_emergencies"] >= 1
    assert stats["active_alerts"] >= 2
    assert stats["available_teams"] >= 1

    # 10. Map Points
    map_pts = main.map_points()["data"]
    print(f"✓ Live Map Points: {len(map_pts)} points aggregated (Hospitals, Shelters, SOS locations)")
    types_found = {p["type"] for p in map_pts}
    assert "hospital" in types_found
    assert "shelter" in types_found
    assert "sos" in types_found

    print("=" * 60)
    print("ALL IN-PROCESS LOGIC, MODELS, ENGINES, AND DATABASE CHECKS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
