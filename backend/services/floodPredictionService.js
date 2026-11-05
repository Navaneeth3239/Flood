/**
 * Backend Deterministic IF-ELSE Hydrological Flood Prediction Engine
 * Computes calibrated multi-criteria flood risk levels from real-time telemetry:
 * - Water level relative to station hydrological thresholds
 * - Catchment rainfall rate (mm/h)
 * - Soil moisture saturation (%) and soil-specific runoff coefficients (e.g. Clay vs Sandy)
 * - Environmental factors (humidity, temperature)
 *
 * Risk Tiers:
 * - GREEN: Normal conditions (#10B981)
 * - YELLOW: Moderate flood risk (#EAB308)
 * - ORANGE: High flood risk (#F97316)
 * - RED: Critical flood risk (#EF4444)
 */

export const RISK_LEVELS = {
  GREEN: {
    level: 'GREEN',
    severity: 'normal',
    color: '#10B981',
    label: 'Normal Conditions',
    description: 'All hydrological indicators within standard baseline tolerances.',
  },
  YELLOW: {
    level: 'YELLOW',
    severity: 'moderate',
    color: '#EAB308',
    label: 'Moderate Flood Risk',
    description: 'Elevated water level or saturated soil with moderate precipitation; monitoring required.',
  },
  ORANGE: {
    level: 'ORANGE',
    severity: 'high',
    color: '#F97316',
    label: 'High Flood Risk',
    description: 'Water level near warning threshold with sustained heavy rainfall and high soil moisture.',
  },
  RED: {
    level: 'RED',
    severity: 'critical',
    color: '#EF4444',
    label: 'Critical Flood Risk',
    description: 'Water level exceeds danger capacity or flash inundation imminent. Immediate alert dispatched.',
  },
};

/**
 * Evaluates multi-parameter IF-ELSE hydrological rules.
 */
export function evaluateFloodRisk({
  waterLevel,
  rainfall,
  soilMoisture,
  soilType = 'Clay',
  soilInfiltrationRate = 1.5, // mm/h for Clay
  thresholds = { normalMax: 6.5, watchMax: 8.0, warningMax: 9.5, dangerMax: 11.0 },
}) {
  const wl = Number(waterLevel) || 0;
  const rf = Number(rainfall) || 0;
  const sm = Number(soilMoisture) || 0;

  // Clay soils saturate quickly and have very low infiltration (~1-5 mm/h),
  // causing high surface runoff when moisture > 70% and rainfall > 20 mm/h.
  const isClay = (soilType || '').toLowerCase() === 'clay';
  const soilRunoffMultiplier = isClay ? 1.25 : 1.0;

  // 1. Critical RED criteria (Immediate danger)
  if (
    wl >= thresholds.dangerMax ||
    (wl >= thresholds.warningMax && rf >= 50 && sm >= 80) ||
    (rf >= 90 && sm >= 85 * (1 / soilRunoffMultiplier))
  ) {
    return {
      ...RISK_LEVELS.RED,
      score: 95,
      factors: [
        { name: 'Water Stage', value: `${wl}m`, trigger: wl >= thresholds.dangerMax ? 'Exceeds Danger Threshold' : 'Critical' },
        { name: 'Rainfall Intensity', value: `${rf} mm/h`, trigger: rf >= 50 ? 'Severe Torrential Rainfall' : 'Elevated' },
        { name: 'Soil Saturation', value: `${sm}% (${soilType})`, trigger: sm >= 80 ? 'Near Complete Soil Saturation' : 'Elevated' },
      ],
    };
  }

  // 2. High ORANGE criteria
  if (
    wl >= thresholds.warningMax ||
    (wl >= thresholds.watchMax && rf >= 35 && sm >= 70) ||
    (rf >= 60 && sm >= 75) ||
    (isClay && sm >= 85 && rf >= 30)
  ) {
    return {
      ...RISK_LEVELS.ORANGE,
      score: 75,
      factors: [
        { name: 'Water Stage', value: `${wl}m`, trigger: wl >= thresholds.warningMax ? 'Exceeds Warning Threshold' : 'High' },
        { name: 'Rainfall Intensity', value: `${rf} mm/h`, trigger: rf >= 35 ? 'Heavy Rainfall' : 'Moderate' },
        { name: 'Soil Saturation', value: `${sm}% (${soilType})`, trigger: sm >= 70 ? 'High Runoff Susceptibility' : 'Moderate' },
      ],
    };
  }

  // 3. Moderate YELLOW criteria
  if (
    wl >= thresholds.watchMax ||
    (wl >= thresholds.normalMax && (rf >= 20 || sm >= 60)) ||
    rf >= 30 ||
    (isClay && sm >= 75)
  ) {
    return {
      ...RISK_LEVELS.YELLOW,
      score: 50,
      factors: [
        { name: 'Water Stage', value: `${wl}m`, trigger: wl >= thresholds.watchMax ? 'Watch Threshold Reached' : 'Elevated' },
        { name: 'Rainfall Intensity', value: `${rf} mm/h`, trigger: rf >= 20 ? 'Moderate Rain' : 'Normal' },
        { name: 'Soil Saturation', value: `${sm}% (${soilType})`, trigger: sm >= 60 ? 'Moisture Saturated' : 'Normal' },
      ],
    };
  }

  // 4. Baseline GREEN criteria
  return {
    ...RISK_LEVELS.GREEN,
    score: 15,
    factors: [
      { name: 'Water Stage', value: `${wl}m`, trigger: 'Safe Operating Baseline' },
      { name: 'Rainfall Intensity', value: `${rf} mm/h`, trigger: 'Low/Dry' },
      { name: 'Soil Saturation', value: `${sm}% (${soilType})`, trigger: 'Standard Infiltration Capacity' },
    ],
  };
}

