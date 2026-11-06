import math
from typing import Tuple, List
from app.core.models import (
    VendorCriticality,
    DataClassification,
    AccessLevel,
    ControlEffectiveness,
    RiskBand,
)

METHODOLOGY_VERSION = "v1.0-standard"


def determine_risk_band(score: int) -> RiskBand:
    """
    Standard TPRM 5x5 Matrix Risk Bands:
    1 - 4: Low
    5 - 9: Medium
    10 - 15: High
    16 - 25: Critical
    """
    if score >= 16:
        return RiskBand.CRITICAL
    elif score >= 10:
        return RiskBand.HIGH
    elif score >= 5:
        return RiskBand.MEDIUM
    return RiskBand.LOW


def calculate_inherent_dimensions(
    criticality: VendorCriticality,
    data_classification: DataClassification,
    access_level: AccessLevel,
) -> Tuple[int, int, int, RiskBand]:
    """
    Deterministic Inherent Risk calculation:
    Likelihood (1-5): Driven by vendor criticality tier & operational exposure.
    Impact (1-5): Driven by data classification & connectivity access level.
    Inherent Score = Likelihood x Impact (1 to 25).
    """
    # Likelihood mapping:
    # Tier 1 (Strategic critical dependencies) = 5
    # Tier 2 (Operational dependencies) = 3
    # Tier 3 (Incidental / commodity) = 1
    crit_weight = {
        VendorCriticality.TIER_1: 5,
        VendorCriticality.TIER_2: 3,
        VendorCriticality.TIER_3: 1,
    }.get(criticality, 3)

    # Impact mapping: Data classification (1-5) & Access Level (1-5)
    data_weight = {
        DataClassification.RESTRICTED: 5,
        DataClassification.CONFIDENTIAL: 4,
        DataClassification.INTERNAL: 2,
        DataClassification.PUBLIC: 1,
    }.get(data_classification, 3)

    access_weight = {
        AccessLevel.ADMINISTRATIVE: 5,
        AccessLevel.DATABASE: 4,
        AccessLevel.NETWORK: 3,
        AccessLevel.APPLICATION: 2,
        AccessLevel.NONE: 1,
    }.get(access_level, 2)

    # Normalized Likelihood & Impact in [1..5]
    likelihood = min(5, max(1, crit_weight))
    raw_impact = (data_weight * 0.6) + (access_weight * 0.4)
    impact = min(5, max(1, round(raw_impact)))

    inherent_score = likelihood * impact
    inherent_band = determine_risk_band(inherent_score)

    return likelihood, impact, inherent_score, inherent_band


def calculate_control_effectiveness(evaluations: List[ControlEffectiveness]) -> float:
    """
    Aggregates validated control effectiveness score between 0.0 and 1.0:
    - Effective = 1.0
    - Partially Effective = 0.5
    - Ineffective / Unassessed = 0.0
    - Not Applicable = excluded from denominator
    """
    applicable = [e for e in evaluations if e != ControlEffectiveness.NOT_APPLICABLE]
    if not applicable:
        return 0.0

    total_points = 0.0
    for eff in applicable:
        if eff == ControlEffectiveness.EFFECTIVE:
            total_points += 1.0
        elif eff == ControlEffectiveness.PARTIALLY_EFFECTIVE:
            total_points += 0.5

    return round(total_points / len(applicable), 3)


def calculate_residual_risk(inherent_score: int, control_effectiveness: float) -> Tuple[int, RiskBand]:
    """
    Deterministic Residual Risk:
    Residual Risk = Inherent Risk x (1 - (Control Effectiveness x 0.75))
    (Even with 100% controls effective, a minimum baseline inherent exposure remains).
    """
    # Max discount is 75% for full control effectiveness
    discount_factor = control_effectiveness * 0.75
    residual_float = inherent_score * (1.0 - discount_factor)
    residual_score = max(1, min(25, round(residual_float)))
    residual_band = determine_risk_band(residual_score)
    return residual_score, residual_band

