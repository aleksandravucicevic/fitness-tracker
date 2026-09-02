import { TFunction } from "i18next";

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