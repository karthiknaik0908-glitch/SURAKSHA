def classify_emergency(injury_severity, num_people, immediate_danger, medical_emergency, description):
    score = 0
    reasons = []

    sev_map = {"critical": 50, "severe": 35, "moderate": 20, "minor": 10, "none": 0}
    sev_pts = sev_map.get(injury_severity, 20)
    score += sev_pts
    if sev_pts >= 35:
        reasons.append(f"Severe injury reported ({injury_severity})")
    elif sev_pts >= 20:
        reasons.append(f"Moderate injury reported")

    if num_people > 50:
        pts = 25; reasons.append(f"Large group affected ({num_people} people)")
    elif num_people > 20:
        pts = 15; reasons.append(f"Multiple people affected ({num_people})")
    elif num_people > 10:
        pts = 10; reasons.append(f"Several people affected ({num_people})")
    elif num_people > 5:
        pts = 5; reasons.append(f"Small group affected ({num_people})")
    else:
        pts = 2
    score += pts

    if immediate_danger:
        score += 20; reasons.append("Immediate danger to life")
    if medical_emergency:
        score += 15; reasons.append("Medical emergency reported")

    keywords = ["trapped", "unconscious", "bleeding", "fire", "flood", "collapse", "buried", "drowning", "critical"]
    desc_lower = description.lower()
    kw_found = [kw for kw in keywords if kw in desc_lower]
    score += min(len(kw_found) * 5, 20)
    if kw_found:
        reasons.append(f"Emergency keywords detected: {', '.join(kw_found)}")

    if score >= 70:
        priority = "critical"
    elif score >= 40:
        priority = "high"
    else:
        priority = "medium"

    return {
        "priority": priority,
        "score": score,
        "reasons": reasons if reasons else ["Standard emergency classification"],
        "override_allowed": True,
        "classification_method": "rule_based_v1",
    }
