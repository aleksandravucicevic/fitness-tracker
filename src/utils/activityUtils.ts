import { TFunction } from "i18next";
import { ActivityType } from "../models/Activity";

// MET = Metabolic Equivalent of Task
const MET_VALUES: Record<ActivityType, number> = {
  WALKING: 3.5,
  RUNNING: 8.0,
  CYCLING: 6.0,
  OTHER: 5.0,
};

const STEP_LENGTH_M: Record<ActivityType, number | null> = {
  WALKING: 0.75,
  RUNNING: 1.0,
  CYCLING: null,
  OTHER: null,
};

const DEFAULT_WEIGHT_KG = 70;

export function estimateCalories(activityType: ActivityType, durationSec: number, weightKg: number = DEFAULT_WEIGHT_KG) : number {
  const met = MET_VALUES[activityType] ?? 5;
  const hours = durationSec / 3600;
  // FORMULA: kalorije = MET * weightKg * timeHours
  return Math.round(met * weightKg * hours);
}

export function estimateSteps(activityType: ActivityType, distanceMeters: number): number | null {
  const stepLenght = STEP_LENGTH_M[activityType];
  if(stepLenght == null)
    return null;
  return Math.round(distanceMeters / stepLenght);
}

export const getActivityTypeName = (type: string, t: TFunction): string => {
    switch (type) {
      case 'ALL':
        return t('activities.all');
      case 'RUNNING':
        return t('activities.running');
      case 'WALKING':
        return t('activities.walking');
      case 'CYCLING':
        return t('activities.cycling');
      default:
        return type;
    }
  };