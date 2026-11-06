#!/usr/bin/env python3
"""
seed_data.py
Generates sample farmer leaf scan disease cases with:
- Clear rising clusters (e.g., Mandya, Mysuru, Kolar, Haveri)
- About 10 isolated cases across Karnataka that stay hidden from the hotspot map

All data is labeled as "Sample data for demo".
"""

import json
import os
import time
from datetime import datetime, timezone

# Reference time: 2026-11-05
BASE_TIMESTAMP_MS = int(time.time() * 1000)
DAY_MS = 24 * 60 * 60 * 1000

def create_case(case_id, lat, lng, disease, crop, days_ago, village, severity="medium"):
    ts = BASE_TIMESTAMP_MS - int(days_ago * DAY_MS)
    dt_str = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    return {
        "id": case_id,
        "lat": round(lat, 5),
        "lng": round(lng, 5),
        "disease": disease,
        "crop": crop,
        "timestamp": ts,
        "date": dt_str,
        "days_ago": round(days_ago, 1),
        "village": village,
        "severity": severity,
        "is_sample_data": True
    }

def generate_dataset():
    cases = []

    # =========================================================================
    # CLUSTER 1: Mandya / Maddur - Tomato Late Blight (RISING CLUSTER)
    # 11 cases within ~8 km: 8 this week (days 1-6) vs 3 last week (days 9-13)
    # Meets: >= 5 cases in last 7 days AND this week > last week
    # =========================================================================
    mandya_center = (12.5218, 76.8951)
    mandya_offsets = [
        # This week cases (8 cases)
        (0.012, 0.015, 1.2, "Maddur Rural", "high"),
        (-0.018, 0.022, 1.8, "Maddur North", "high"),
        (0.025, -0.010, 2.5, "Mandya East", "high"),
        (-0.010, -0.025, 3.1, "Pandavapura Cross", "high"),
        (0.030, 0.018, 3.8, "Besagarahalli", "medium"),
        (-0.022, 0.035, 4.5, "Koppa Farm", "high"),
        (0.015, -0.030, 5.2, "Mandya South", "medium"),
        (-0.035, -0.015, 6.0, "Srirangapatna Border", "high"),
        # Last week cases (3 cases)
        (0.005, 0.010, 9.5, "Maddur Central", "medium"),
        (-0.015, 0.018, 11.0, "Maddur Station", "low"),
        (0.020, -0.005, 13.2, "Mandya Outskirts", "medium"),
    ]
    for idx, (dlat, dlng, days, vil, sev) in enumerate(mandya_offsets, start=1):
        cases.append(create_case(
            f"case-mandya-{idx:02d}",
            mandya_center[0] + dlat,
            mandya_center[1] + dlng,
            "tomato_late_blight",
            "tomato",
            days,
            vil,
            sev
        ))

    # =========================================================================
    # CLUSTER 2: Mysuru / Nanjangud - Rice Blast (RISING CLUSTER)
    # 9 cases within ~7 km: 7 this week (days 1-6) vs 2 last week (days 10-12)
    # Meets: >= 5 cases in last 7 days AND this week > last week
    # =========================================================================
    mysuru_center = (12.2128, 76.9042)
    mysuru_offsets = [
        # This week (7 cases)
        (0.015, 0.012, 1.5, "Nanjangud Farm Belt", "high"),
        (-0.020, 0.018, 2.2, "T Narasipura Basin", "high"),
        (0.022, -0.015, 2.9, "Varuna Canal Plain", "high"),
        (-0.012, -0.022, 3.6, "Nanjangud South", "medium"),
        (0.028, 0.010, 4.4, "Bannur Agro Yard", "high"),
        (-0.018, 0.030, 5.1, "Hadinaru Lake Belt", "high"),
        (0.010, -0.032, 6.2, "Kapila River Basin", "medium"),
        # Last week (2 cases)
        (0.008, 0.005, 10.4, "T Narasipura Town", "medium"),
        (-0.012, 0.012, 12.1, "Nanjangud West", "low"),
    ]
    for idx, (dlat, dlng, days, vil, sev) in enumerate(mysuru_offsets, start=1):
        cases.append(create_case(
            f"case-mysuru-{idx:02d}",
            mysuru_center[0] + dlat,
            mysuru_center[1] + dlng,
            "rice_blast",
            "rice",
            days,
            vil,
            sev
        ))

    # =========================================================================
    # CLUSTER 3: Kolar / Srinivaspur - Tomato Early Blight (RISING CLUSTER)
    # 8 cases within ~6 km: 6 this week (days 1-6) vs 2 last week (days 9-11)
    # Meets: >= 5 cases in last 7 days AND this week > last week
    # =========================================================================
    kolar_center = (13.1633, 78.2139)
    kolar_offsets = [
        # This week (6 cases)
        (0.018, 0.014, 1.4, "Srinivaspur Mango Tomato", "high"),
        (-0.015, 0.020, 2.3, "Srinivaspur North", "high"),
        (0.022, -0.012, 3.0, "Mulbagal Road", "medium"),
        (-0.010, -0.025, 4.1, "Kolar Gold Belt", "high"),
        (0.025, 0.016, 5.2, "Bangarapet Cross", "high"),
        (-0.020, 0.028, 6.1, "Gownipalli Horti", "medium"),
        # Last week (2 cases)
        (0.006, 0.008, 9.2, "Srinivaspur Yard", "medium"),
        (-0.010, 0.015, 11.5, "Mulbagal Gate", "low"),
    ]
    for idx, (dlat, dlng, days, vil, sev) in enumerate(kolar_offsets, start=1):
        cases.append(create_case(
            f"case-kolar-{idx:02d}",
            kolar_center[0] + dlat,
            kolar_center[1] + dlng,
            "tomato_early_blight",
            "tomato",
            days,
            vil,
            sev
        ))

    # =========================================================================
    # CLUSTER 4: Haveri / Ranebennur - Maize Fall Armyworm (RISING CLUSTER)
    # 7 cases within ~7 km: 5 this week (days 2-6) vs 2 last week (days 9-13)
    # Meets: >= 5 cases in last 7 days AND this week > last week
    # =========================================================================
    haveri_center = (14.6231, 75.6219)
    haveri_offsets = [
        # This week (5 cases)
        (0.014, 0.012, 2.1, "Ranebennur Seed Hub", "high"),
        (-0.018, 0.022, 3.2, "Byadgi Road Plains", "high"),
        (0.024, -0.015, 4.0, "Chalageri Farm", "high"),
        (-0.012, -0.028, 5.3, "Medleri Valley", "medium"),
        (0.026, 0.018, 6.2, "Haveri South", "high"),
        # Last week (2 cases)
        (0.005, 0.010, 9.8, "Ranebennur APMC", "medium"),
        (-0.015, 0.015, 13.0, "Byadgi Outskirts", "low"),
    ]
    for idx, (dlat, dlng, days, vil, sev) in enumerate(haveri_offsets, start=1):
        cases.append(create_case(
            f"case-haveri-{idx:02d}",
            haveri_center[0] + dlat,
            haveri_center[1] + dlng,
            "maize_fall_armyworm",
            "maize",
            days,
            vil,
            sev
        ))

    # =========================================================================
    # ISOLATED CASES (~10 cases, each in a distant district with NO nearby cases)
    # These MUST stay hidden because they have < 3 cases total and < 5 cases in 7 days
    # =========================================================================
    isolated_locations = [
        # 1. Shivamogga - Potato Early Blight (1 single case)
        ("case-iso-01", 13.8411, 75.7028, "potato_early_blight", "potato", 3.2, "Bhadravathi Rural"),
        # 2. Tumakuru - Tomato Late Blight (1 single case)
        ("case-iso-02", 13.3379, 77.1012, "tomato_late_blight", "tomato", 4.5, "Tumakuru Agro"),
        # 3. Hassan - Rice Blast (1 single case)
        ("case-iso-03", 13.0072, 76.1030, "rice_blast", "rice", 2.8, "Hassan Farm Belt"),
        # 4. Belagavi - Maize Fall Armyworm (1 single case)
        ("case-iso-04", 15.8497, 74.4977, "maize_fall_armyworm", "maize", 5.0, "Belagavi North"),
        # 5. Bagalkot - Chilli Leaf Curl (1 single case)
        ("case-iso-05", 16.1875, 75.6989, "chilli_leaf_curl", "chilli", 1.8, "Bagalkot Valley"),
        # 6. Raichur - Rice Brown Spot (1 single case)
        ("case-iso-06", 16.2120, 77.3439, "rice_brown_spot", "rice", 6.2, "Raichur Canal"),
        # 7. Chikkaballapur - Tomato Early Blight (1 single case)
        ("case-iso-07", 13.4325, 77.7275, "tomato_early_blight", "tomato", 3.5, "Chikkaballapur Plains"),
        # 8. Udupi - Rice Blast (1 single case)
        ("case-iso-08", 13.3409, 74.7421, "rice_blast", "rice", 8.2, "Udupi Coastal Paddy"),
        # 9. Chitradurga - Maize Common Rust (1 single case)
        ("case-iso-09", 14.2251, 76.3980, "maize_common_rust", "maize", 4.0, "Chitradurga Dryland"),
        # 10. Ballari - Chilli Anthracnose (1 single case)
        ("case-iso-10", 15.1394, 76.9214, "chilli_anthracnose", "chilli", 2.2, "Ballari Agro Park"),
    ]
    for cid, lat, lng, dis, crp, days, vil in isolated_locations:
        cases.append(create_case(cid, lat, lng, dis, crp, days, vil, severity="low"))

    output_data = {
        "disclaimer": "Sample data for demo",
        "last_updated": "2026-11-05",
        "description": "Seeded farmer leaf scan disease cases with active rising clusters and isolated single cases for testing hotspot detection algorithms.",
        "note": "Satellite image is the background map only. Outbreak locations come from farmer leaf scans.",
        "total_cases": len(cases),
        "cluster_cases_count": len(cases) - len(isolated_locations),
        "isolated_cases_count": len(isolated_locations),
        "cases": cases
    }

    out_path = os.path.join(os.path.dirname(__file__), "src", "data", "cases.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(cases)} cases:")
    print(f"  - Cluster cases: {len(cases) - len(isolated_locations)}")
    print(f"  - Isolated cases (hidden): {len(isolated_locations)}")
    print(f"Saved to: {out_path}")

if __name__ == "__main__":
    generate_dataset()
