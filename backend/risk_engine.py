def assess_flood_risk(rainfall_mm, water_level_m, previous_flooding, soil_saturation):
    score = 0
    factors = []

    # Rainfall
    if rainfall_mm > 150:
        pts = 40
    elif rainfall_mm > 100:
        pts = 25
    elif rainfall_mm > 50:
        pts = 15
    else:
        pts = 5
    score += pts
    factors.append({"name": "Rainfall Amount", "value": f"{rainfall_mm} mm", "impact": pts, "category": "high" if pts >= 25 else "medium" if pts >= 15 else "low"})

    # Water level
    if water_level_m > 8:
        pts = 35
    elif water_level_m > 5:
        pts = 20
    elif water_level_m > 2:
        pts = 10
    else:
        pts = 3
    score += pts
    factors.append({"name": "Water Level", "value": f"{water_level_m} m", "impact": pts, "category": "high" if pts >= 20 else "medium" if pts >= 10 else "low"})

    # Previous flooding
    if previous_flooding:
        score += 15
        factors.append({"name": "Previous Flooding History", "value": "Yes", "impact": 15, "category": "medium"})

    # Soil saturation
    if soil_saturation > 80:
        pts = 10
    elif soil_saturation > 60:
        pts = 5
    else:
        pts = 0
    if pts > 0:
        score += pts
        factors.append({"name": "Soil Saturation", "value": f"{soil_saturation}%", "impact": pts, "category": "medium"})

    if score >= 76:
        level = "critical"
    elif score >= 56:
        level = "high"
    elif score >= 31:
        level = "medium"
    else:
        level = "low"

    explanations = {
        "critical": "Extreme flood risk. Immediate evacuation recommended. All contributing factors indicate severe conditions.",
        "high": "High flood risk. Residents in low-lying areas should evacuate. Emergency services on standby.",
        "medium": "Moderate flood risk. Monitor water levels closely. Prepare emergency kit.",
        "low": "Low flood risk. Normal precautions apply. Stay informed about weather updates.",
    }
    precautions = {
        "critical": ["Evacuate immediately to higher ground", "Call emergency services: 112", "Do not attempt to drive through flooded roads", "Disconnect electrical appliances", "Take important documents"],
        "high": ["Prepare for possible evacuation", "Move valuables to upper floors", "Stock emergency supplies for 3 days", "Monitor local news and alerts"],
        "medium": ["Monitor river/water body levels", "Keep emergency kit ready", "Know your evacuation route", "Avoid low-lying areas"],
        "low": ["Stay informed via weather updates", "Normal precautions apply", "Check on elderly neighbours"],
    }

    return {
        "risk_level": level,
        "score": score,
        "max_score": 100,
        "factors": factors,
        "explanation": explanations[level],
        "precautions": precautions[level],
        "disclaimer": "AI-estimated risk based on input parameters only. Not a verified official meteorological forecast.",
        "model_type": "rule_based_v1",
    }

def assess_landslide_risk(rainfall_intensity, soil_moisture, slope_angle, historical_landslides, vegetation_cover):
    score = 0
    factors = []

    if rainfall_intensity > 50:
        pts = 40
    elif rainfall_intensity > 30:
        pts = 25
    elif rainfall_intensity > 15:
        pts = 15
    else:
        pts = 5
    score += pts
    factors.append({"name": "Rainfall Intensity", "value": f"{rainfall_intensity} mm/hr", "impact": pts, "category": "high" if pts >= 25 else "medium" if pts >= 15 else "low"})

    if soil_moisture > 90:
        pts = 30
    elif soil_moisture > 70:
        pts = 20
    elif soil_moisture > 50:
        pts = 10
    else:
        pts = 3
    score += pts
    factors.append({"name": "Soil Moisture", "value": f"{soil_moisture}%", "impact": pts, "category": "high" if pts >= 20 else "medium" if pts >= 10 else "low"})

    if slope_angle > 45:
        pts = 20
    elif slope_angle > 30:
        pts = 12
    elif slope_angle > 15:
        pts = 5
    else:
        pts = 2
    score += pts
    factors.append({"name": "Slope Angle", "value": f"{slope_angle}\u00b0", "impact": pts, "category": "high" if pts >= 12 else "medium" if pts >= 5 else "low"})

    if historical_landslides:
        score += 8
        factors.append({"name": "Historical Landslides", "value": "Yes", "impact": 8, "category": "medium"})

    veg_pts = {"sparse": 5, "moderate": 2, "dense": 0}.get(vegetation_cover, 2)
    if veg_pts > 0:
        score += veg_pts
        factors.append({"name": "Vegetation Cover", "value": vegetation_cover.capitalize(), "impact": veg_pts, "category": "low"})

    if score >= 76:
        level = "critical"
    elif score >= 56:
        level = "high"
    elif score >= 31:
        level = "medium"
    else:
        level = "low"

    explanations = {
        "critical": "Extreme landslide risk. Immediate evacuation of slope-adjacent areas required.",
        "high": "High landslide risk. Avoid steep slopes and unstable ground. Prepare for evacuation.",
        "medium": "Moderate landslide risk. Monitor soil conditions and avoid steep areas during heavy rainfall.",
        "low": "Low landslide risk. Normal precautions apply.",
    }
    precautions = {
        "critical": ["Evacuate immediately from slope-adjacent areas", "Do not attempt to cross landslide-prone roads", "Call emergency services: 112", "Watch for warning signs: ground cracks, unusual sounds"],
        "high": ["Avoid steep slopes and hillsides", "Prepare evacuation plan", "Watch for cracks in ground or walls", "Keep emergency supplies ready"],
        "medium": ["Monitor rainfall and soil conditions", "Identify safe evacuation routes", "Avoid steep areas during heavy rain"],
        "low": ["Normal precautions", "Be aware of local geology", "Stay informed about rainfall forecasts"],
    }

    return {
        "risk_level": level,
        "score": score,
        "max_score": 103,
        "factors": factors,
        "explanation": explanations[level],
        "precautions": precautions[level],
        "disclaimer": "AI-estimated risk based on input parameters only. Not a verified official geological survey.",
        "model_type": "rule_based_v1",
    }
