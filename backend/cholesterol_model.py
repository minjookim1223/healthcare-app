"""
[1] National Cholesterol Education Program, "ATP III Guidelines At-A-Glance:
Quick Desk Reference," National Heart, Lung, and Blood Institute, National
Institutes of Health, NIH Publication No. 01-3305, May 2001.

[2] S. M. Grundy et al., "2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/
ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol," Circulation,
vol. 139, no. 25, pp. e1082-e1143, Jun. 2019, doi: 10.1161/CIR.0000000000000625.
"""

from cholesterol_schema import CholesterolInput

# The category and risk come from the actual sources provided above
def analyze_cholesterol(data: CholesterolInput):
    # LDL
    if data.ldl >= 190:
        ldl_category, ldl_risk = "Very High", "Dangerous"
    elif data.ldl >= 160:
        ldl_category, ldl_risk = "High", "High Risk"
    elif data.ldl >= 130:
        ldl_category, ldl_risk = "Borderline High", "Moderate Risk"
    elif data.ldl >= 100:
        ldl_category, ldl_risk = "Near Optimal", "Low Risk"
    else:
        ldl_category, ldl_risk = "Optimal", "Low Risk"

    # HDL
    if data.hdl < 40:
        hdl_category, hdl_risk = "Low", "Dangerous"
    elif data.hdl < 60:
        hdl_category, hdl_risk = "Normal", "Acceptable"
    else:
        hdl_category, hdl_risk = "High", "Protective"

    # Combined chol
    if data.total >= 240:
        total_category = "High"
    elif data.total >= 200:
        total_category = "Borderline High"
    else:
        total_category = "Desirable"

    # LDL/HDL
    ldl_hdl_ratio = round(data.ldl / data.hdl, 2)
    if ldl_hdl_ratio > 3.5:
        ratio_risk = "High Risk"
    elif ldl_hdl_ratio > 2.5:
        ratio_risk = "Moderate Risk"
    else:
        ratio_risk = "Low Risk"

    # Total HDL ratio
    total_hdl_ratio = round(data.total / data.hdl, 2)
    if total_hdl_ratio > 5:
        total_ratio_risk = "High Risk"
    elif total_hdl_ratio > 3.5:
        total_ratio_risk = "Moderate Risk"
    else:
        total_ratio_risk = "Low Risk"

    return {
        "ldl": {"value": data.ldl, "category": ldl_category, "risk": ldl_risk},
        "hdl": {"value": data.hdl, "category": hdl_category, "risk": hdl_risk},
        "total_cholesterol": {"value": data.total, "category": total_category},
        "ldl_hdl_ratio": {"value": ldl_hdl_ratio, "risk": ratio_risk},
        "total_hdl_ratio": {"value": total_hdl_ratio, "risk": total_ratio_risk},
    }