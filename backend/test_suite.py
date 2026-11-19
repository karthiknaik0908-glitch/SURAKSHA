import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=" * 60)
    print("SURAKSHA BACKEND HTTP TEST SUITE (via requests)")
    print("=" * 60)

    # 1. Health
    res = requests.get(f"{BASE_URL}/api/health", timeout=5)
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ GET /api/health passed:", res.json()["data"]["status"])

    # 2. Flood Risk (public)
    flood_req = {
        "disaster_type": "flood",
        "flood_data": {
            "rainfall_mm": 180,
            "water_level_m": 9.2,
            "previous_flooding": True,
            "soil_saturation": 90
        }
    }
    res = requests.post(f"{BASE_URL}/api/disaster-risk", json=flood_req, timeout=5)
    assert res.status_code == 200, f"Flood risk failed: {res.text}"
    risk_data = res.json()["data"]
    print(f"✓ POST /api/disaster-risk (Flood) passed: Level={risk_data['risk_level']} (Score={risk_data['score']})")
    assert risk_data["risk_level"] == "critical", "Expected critical flood risk"

    # 3. Landslide Risk (public)
    landslide_req = {
        "disaster_type": "landslide",
        "landslide_data": {
            "rainfall_intensity": 55,
            "soil_moisture": 95,
            "slope_angle": 50,
            "historical_landslides": True,
            "vegetation_cover": "sparse"
        }
    }
    res = requests.post(f"{BASE_URL}/api/disaster-risk", json=landslide_req, timeout=5)
    assert res.status_code == 200, f"Landslide risk failed: {res.text}"
    ls_data = res.json()["data"]
    print(f"✓ POST /api/disaster-risk (Landslide) passed: Level={ls_data['risk_level']} (Score={ls_data['score']})")
    assert ls_data["risk_level"] == "critical", "Expected critical landslide risk"

    # 4. SOS Creation (public - no login required)
    sos_payload = {
        "name": "Karthik Gowda",
        "phone": "+91-9880011223",
        "emergency_type": "flood",
        "num_people": 12,
        "description": "Rising river water has entered first floor, family trapped on roof with children. Immediate boat rescue needed.",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "location_name": "Srirangapatna River Bank",
        "injury_severity": "severe",
        "immediate_danger": True,
        "medical_emergency": True
    }
    res = requests.post(f"{BASE_URL}/api/sos", json=sos_payload, timeout=5)
    assert res.status_code == 201, f"SOS creation failed: {res.text}"
    sos_data = res.json()["data"]
    sos_id = sos_data["id"]
    print(f"✓ POST /api/sos passed: ID={sos_id}, Priority={sos_data['priority']} (Score={sos_data['priority_score']})")
    assert sos_data["priority"] == "critical", "Expected critical priority"

    # 5. SOS Ticket Tracking (public - only with correct ticket + phone)
    track_payload = {"ticket_id": sos_id, "phone": "+91-9880011223"}
    res = requests.post(f"{BASE_URL}/api/sos/track", json=track_payload, timeout=5)
    assert res.status_code == 200, f"SOS tracking failed: {res.text}"
    tracked = res.json()["data"]
    assert tracked["id"] == sos_id, "Tracked ticket ID mismatch"
    print(f"✓ POST /api/sos/track passed: Status={tracked['status']}, Name={tracked['name']}")

    # 5b. Privacy enforcement: wrong phone should return 404
    res = requests.post(f"{BASE_URL}/api/sos/track", json={"ticket_id": sos_id, "phone": "9999999999"}, timeout=5)
    assert res.status_code == 404, f"Privacy enforcement failed: expected 404 got {res.status_code}"
    print("✓ POST /api/sos/track (wrong phone) passed: 404 as expected (privacy enforced)")

    # 6. Verify unauthenticated access to protected SOS list is blocked
    res = requests.get(f"{BASE_URL}/api/sos", timeout=5)
    assert res.status_code == 401, f"Should have rejected unauthenticated access: got {res.status_code}"
    print("✓ GET /api/sos (no auth) passed: 401 Unauthorized (security enforced)")

    # 7. Rescue Personnel Login
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rescue", "password": "rescue112"}, timeout=5)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["data"]["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ POST /api/auth/login passed: Token={token[:12]}...")

    # 8. SOS Status Update (protected)
    res = requests.patch(f"{BASE_URL}/api/sos/{sos_id}", json={"status": "in_progress", "notes": "Dispatched SDRF Boat Alpha"}, headers=auth_headers, timeout=5)
    assert res.status_code == 200, f"SOS update failed: {res.text}"
    print("✓ PATCH /api/sos/{id} passed: Status=", res.json()["data"]["status"])

    # 9. Disaster Alerts public read
    res = requests.get(f"{BASE_URL}/api/alerts", timeout=5)
    assert res.status_code == 200
    print(f"✓ GET /api/alerts passed: {len(res.json()['data'])} alerts active")

    # Broadcast alert (protected)
    alert_payload = {
        "disaster_type": "cyclone",
        "location": "Coastal Karwar & Udupi",
        "severity": "critical",
        "description": "Squall winds reaching 90km/h expected with rough seas.",
        "source": "official_alert",
        "safety_actions": ["Fishermen advised not to venture into sea", "Secure roof sheets and loose objects"],
        "latitude": 14.8135,
        "longitude": 74.1298
    }
    res = requests.post(f"{BASE_URL}/api/alerts", json=alert_payload, headers=auth_headers, timeout=5)
    assert res.status_code == 201, f"Alert creation failed: {res.text}"
    print("✓ POST /api/alerts passed: Alert registered")

    # 10. Rescue Teams (protected)
    res = requests.get(f"{BASE_URL}/api/rescue-teams", headers=auth_headers, timeout=5)
    assert res.status_code == 200
    team_list = res.json()["data"]
    assert len(team_list) >= 3
    print(f"✓ GET /api/rescue-teams passed: {len(team_list)} teams available")

    # 11. Resources CRUD (protected)
    res = requests.get(f"{BASE_URL}/api/resources", headers=auth_headers, timeout=5)
    assert res.status_code == 200
    resources = res.json()["data"]
    print(f"✓ GET /api/resources passed: {len(resources)} items")

    new_res = {
        "type": "ambulances",
        "name": "ICU Trauma Ambulance Unit 9",
        "quantity": 5,
        "available": 5,
        "location": "Bengaluru Emergency Depot",
        "unit": "vehicles"
    }
    res = requests.post(f"{BASE_URL}/api/resources", json=new_res, headers=auth_headers, timeout=5)
    assert res.status_code == 201, f"Resource creation failed: {res.text}"
    created_res_id = res.json()["data"]["id"]
    print("✓ POST /api/resources passed: Created ID", created_res_id)

    res = requests.patch(f"{BASE_URL}/api/resources/{created_res_id}", json={"available": 3}, headers=auth_headers, timeout=5)
    assert res.status_code == 200
    assert res.json()["data"]["available"] == 3
    print("✓ PATCH /api/resources passed: Updated availability to 3")

    res = requests.delete(f"{BASE_URL}/api/resources/{created_res_id}", headers=auth_headers, timeout=5)
    assert res.status_code == 200
    print("✓ DELETE /api/resources passed: Item deleted")

    # 12. Dashboard Stats (public)
    res = requests.get(f"{BASE_URL}/api/dashboard/stats", timeout=5)
    assert res.status_code == 200
    stats = res.json()["data"]
    print("✓ GET /api/dashboard/stats passed:", stats)

    # 13. Map Points (public)
    res = requests.get(f"{BASE_URL}/api/map-points", timeout=5)
    assert res.status_code == 200
    points = res.json()["data"]
    print(f"✓ GET /api/map-points passed: {len(points)} geospatial markers returned")

    # 14. Logout
    res = requests.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers, timeout=5)
    assert res.status_code == 200
    print("✓ POST /api/auth/logout passed: Session revoked")

    # 15. After logout, previous token should be invalid
    res = requests.get(f"{BASE_URL}/api/sos", headers=auth_headers, timeout=5)
    assert res.status_code == 401, f"Token should be invalid after logout: got {res.status_code}"
    print("✓ Token invalidated after logout: 401 (session management working)")

    print("=" * 60)
    print("ALL 15 CRITICAL BACKEND HTTP TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
