import main
import database as db
from models import (
    LoginRequest, SOSTrackRequest, SOSRequest, SOSStatusUpdate,
    DisasterRiskRequest, FloodRiskInput, ResourceCreate
)
from fastapi import HTTPException

def run_tests():
    print("=" * 70)
    print("SURAKSHA CITIZEN (LOGIN-FREE) & RESCUE AUTH VERIFICATION TEST SUITE")
    print("=" * 70)

    # ---------------------------------------------------------
    # 1. PUBLIC CITIZEN: INSTANT SOS SUBMISSION (NO LOGIN)
    # ---------------------------------------------------------
    citizen_sos = SOSRequest(
        name="Sunita Patil",
        phone="+91-98441-23456",
        emergency_type="flood",
        num_people=5,
        description="Flash flood near Belagavi stream, family stuck on roof. Need urgent evacuation boat.",
        latitude=15.8497,
        longitude=74.4977,
        location_name="Stream Road, Belagavi",
        injury_severity="moderate",
        immediate_danger=True,
        medical_emergency=False
    )
    res = main.create_sos(citizen_sos)
    assert res["success"] is True
    ticket_id = res["data"]["id"]
    phone = citizen_sos.phone
    print(f"✓ 1. Public SOS Submission Successful (Zero Login Required):")
    print(f"     Ticket ID: {ticket_id}")
    print(f"     Citizen Name: {res['data']['name']}")
    print(f"     AI Urgency Triage: {res['data']['priority'].upper()} (Score: {res['data']['priority_score']})")

    # ---------------------------------------------------------
    # 2. PUBLIC CITIZEN: TRACK OWN TICKET (TICKET ID + PHONE)
    # ---------------------------------------------------------
    track_req = SOSTrackRequest(ticket_id=ticket_id, phone=phone)
    tracked_res = main.track_sos(track_req)
    assert tracked_res["success"] is True
    assert tracked_res["data"]["id"] == ticket_id
    assert tracked_res["data"]["name"] == "Sunita Patil"
    print(f"✓ 2. Citizen Ticket Tracking Successful:")
    print(f"     Status: {tracked_res['data']['status'].upper()}")
    print(f"     Priority: {tracked_res['data']['priority'].upper()}")
    print(f"     Only citizen's own single record returned: {tracked_res['data']['description']}")

    # ---------------------------------------------------------
    # 3. PRIVACY ENFORCEMENT: WRONG PHONE CANNOT VIEW RECORD
    # ---------------------------------------------------------
    try:
        main.track_sos(SOSTrackRequest(ticket_id=ticket_id, phone="9999999999"))
        assert False, "Should have thrown 404 for wrong phone number!"
    except HTTPException as e:
        assert e.status_code == 404
        print("✓ 3. Privacy Enforced: Wrong phone number cannot access victim's SOS record (404 Not Found)")

    # ---------------------------------------------------------
    # 4. SECURITY CHECK: UNAUTHENTICATED CANNOT ACCESS RESCUE APIS
    # ---------------------------------------------------------
    try:
        main.get_all_sos(user=main.get_current_rescue_user(None))
        assert False, "Unauthenticated access to master SOS records should be blocked!"
    except HTTPException as e:
        assert e.status_code == 401
        print("✓ 4. Security Check Passed: GET /api/sos rejected for unauthenticated citizen (401 Unauthorized)")

    try:
        main.create_resource(ResourceCreate(type="ambulances", name="Test", quantity=1, available=1, location="Test"), user=main.get_current_rescue_user(None))
        assert False, "Unauthenticated access to resources should be blocked!"
    except HTTPException as e:
        assert e.status_code == 401
        print("✓ 5. Security Check Passed: POST /api/resources rejected for unauthenticated citizen (401)")

    # ---------------------------------------------------------
    # 5. RESCUE PERSONNEL LOGIN
    # ---------------------------------------------------------
    login_req = LoginRequest(username="rescue", password="rescue112")
    login_res = main.login(login_req)
    assert login_res["success"] is True
    token = login_res["data"]["token"]
    user_info = login_res["data"]["user"]
    bearer_header = f"Bearer {token}"
    print(f"✓ 6. Rescue Personnel Login Successful:")
    print(f"     Officer: {user_info['name']} (Badge: {user_info['badge']}, Role: {user_info['role']})")
    print(f"     Token issued: {token[:12]}...")

    # ---------------------------------------------------------
    # 6. RESCUE PERSONNEL ACCESSES MASTER SOS LIST & DISPATCHES
    # ---------------------------------------------------------
    auth_user = main.get_current_rescue_user(bearer_header)
    master_sos = main.get_all_sos(user=auth_user)
    assert master_sos["success"] is True
    print(f"✓ 7. Rescue Officer retrieved master operations SOS list: {len(master_sos['data'])} records")

    # Fetch available rescue teams
    teams = main.get_teams(user=auth_user)["data"]
    assigned_team = teams[0]

    # Rescue updates status to 'assigned' and assigns Team Alpha
    update_res = main.update_sos(
        ticket_id,
        SOSStatusUpdate(status="assigned", assigned_team_id=assigned_team["id"], notes="Team Alpha deployed with inflatable motorboat."),
        user=auth_user
    )
    assert update_res["success"] is True
    assert update_res["data"]["status"] == "assigned"
    print(f"✓ 8. Rescue Officer assigned team {assigned_team['name']} to ticket {ticket_id}")

    # ---------------------------------------------------------
    # 7. CITIZEN RE-CHECKS TRACKING: SEES LIVE ASSIGNED TEAM & UPDATE
    # ---------------------------------------------------------
    retrack_res = main.track_sos(track_req)
    assert retrack_res["data"]["status"] == "assigned"
    assert retrack_res["data"]["assigned_team"]["name"] == assigned_team["name"]
    print(f"✓ 9. Citizen tracks ticket again and sees synchronized live update:")
    print(f"     Updated Status: {retrack_res['data']['status'].upper()}")
    print(f"     Assigned Unit: {retrack_res['data']['assigned_team']['name']} (Contact: {retrack_res['data']['assigned_team']['contact']})")

    # ---------------------------------------------------------
    # 8. PRIVACY ON MAP: PUBLIC MAP VS RESCUE MAP
    # ---------------------------------------------------------
    public_map = main.map_points(user=None)["data"]
    rescue_map = main.map_points(user=auth_user)["data"]
    
    public_victim_point = next((p for p in public_map if p.get("id") == ticket_id), None)
    rescue_victim_point = next((p for p in rescue_map if p.get("id") == ticket_id), None)

    assert public_victim_point is not None
    assert "Sunita Patil" not in public_victim_point["name"], "Public map leaked victim's real name!"
    assert rescue_victim_point["contact"] == phone, "Rescue map should show victim contact phone!"
    print(f"✓ 10. Privacy on Live Map verified:")
    print(f"      Public Citizen View: '{public_victim_point['name']}' (Victim name hidden)")
    print(f"      Rescue Officer View: '{rescue_victim_point['name']}' (Contact: {rescue_victim_point['contact']})")

    print("=" * 70)
    print("ALL 10 CITIZEN LOGIN-FREE & RESCUE AUTH WORKFLOWS VERIFIED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
