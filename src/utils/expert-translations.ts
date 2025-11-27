/**
 * Expert Field Translation Mapping
 * Maps Vietnamese expert fields to English translations
 */

import { useTranslation } from 'react-i18next';

// Common expertise translations
const EXPERTISE_MAP: Record<string, { vi: string; en: string }> = {
  'Bệnh lúa': { vi: 'Bệnh lúa', en: 'Rice Diseases' },
  'Sâu bệnh': { vi: 'Sâu bệnh', en: 'Pests and Diseases' },
  'Phân bón': { vi: 'Phân bón', en: 'Fertilizers' },
  'Thủy lợi': { vi: 'Thủy lợi', en: 'Irrigation' },
  'Giống lúa': { vi: 'Giống lúa', en: 'Rice Varieties' },
  'Kỹ thuật canh tác': { vi: 'Kỹ thuật canh tác', en: 'Cultivation Techniques' },
  'Quản lý dịch hại': { vi: 'Quản lý dịch hại', en: 'Pest Management' },
  'Nông nghiệp bền vững': { vi: 'Nông nghiệp bền vững', en: 'Sustainable Agriculture' },
};

// Common education translations
const EDUCATION_MAP: Record<string, { vi: string; en: string }> = {
  'Tiến sĩ Nông nghiệp': { vi: 'Tiến sĩ Nông nghiệp', en: 'Ph.D. in Agriculture' },
  'Thạc sĩ Nông nghiệp': { vi: 'Thạc sĩ Nông nghiệp', en: 'Master of Agriculture' },
  'Cử nhân Nông nghiệp': { vi: 'Cử nhân Nông nghiệp', en: 'Bachelor of Agriculture' },
  'Kỹ sư Nông nghiệp': { vi: 'Kỹ sư Nông nghiệp', en: 'Agricultural Engineer' },
  'Chuyên gia Nông nghiệp': { vi: 'Chuyên gia Nông nghiệp', en: 'Agricultural Specialist' },
};

// Common position translations
const POSITION_MAP: Record<string, { vi: string; en: string }> = {
  'Giám đốc': { vi: 'Giám đốc', en: 'Director' },
  'Phó Giám đốc': { vi: 'Phó Giám đốc', en: 'Deputy Director' },
  'Trưởng phòng': { vi: 'Trưởng phòng', en: 'Department Head' },
  'Chuyên viên': { vi: 'Chuyên viên', en: 'Specialist' },
  'Nghiên cứu viên': { vi: 'Nghiên cứu viên', en: 'Researcher' },
  'Giảng viên': { vi: 'Giảng viên', en: 'Lecturer' },
  'Kỹ sư': { vi: 'Kỹ sư', en: 'Engineer' },
  'Cán bộ': { vi: 'Cán bộ', en: 'Officer' },
};

/**
 * Translate expert field based on current language
 */
export const translateExpertField = (
  field: string | undefined,
  type: 'expertise' | 'education' | 'position' | 'default' = 'default',
  currentLang: 'vi' | 'en' = 'vi'
): string => {
  if (!field) return '';

  // If already in target language or no mapping needed, return as is
  if (currentLang === 'vi') {
    return field;
  }

  // Try to find translation
  let map: Record<string, { vi: string; en: string }> | null = null;

  switch (type) {
    case 'expertise':
      map = EXPERTISE_MAP;
      break;
    case 'education':
      map = EDUCATION_MAP;
      break;
    case 'position':
      map = POSITION_MAP;
      break;
    default:
      // Try all maps
      const allMaps = [EXPERTISE_MAP, EDUCATION_MAP, POSITION_MAP];
      for (const m of allMaps) {
        if (m[field]) {
          return m[field].en;
        }
      }
      return field; // Return original if no translation found
  }

  if (map && map[field]) {
    return map[field].en;
  }

  // If no exact match, try partial matching for common patterns
  const lowerField = field.toLowerCase();
  
  // Common patterns
  if (lowerField.includes('bệnh lúa') || lowerField.includes('rice disease')) {
    return 'Rice Diseases';
  }
  if (lowerField.includes('sâu bệnh') || lowerField.includes('pest')) {
    return 'Pests and Diseases';
  }
  if (lowerField.includes('phân bón') || lowerField.includes('fertilizer')) {
    return 'Fertilizers';
  }
  if (lowerField.includes('thủy lợi') || lowerField.includes('irrigation')) {
    return 'Irrigation';
  }
  if (lowerField.includes('giống lúa') || lowerField.includes('rice variety')) {
    return 'Rice Varieties';
  }
  if (lowerField.includes('tiến sĩ') || lowerField.includes('ph.d')) {
    return 'Ph.D. in Agriculture';
  }
  if (lowerField.includes('thạc sĩ') || lowerField.includes('master')) {
    return 'Master of Agriculture';
  }
  if (lowerField.includes('cử nhân') || lowerField.includes('bachelor')) {
    return 'Bachelor of Agriculture';
  }

  // Return original if no translation found
  return field;
};

/**
 * Hook to translate expert fields
 */
export const useExpertTranslation = () => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi') as 'vi' | 'en';

  return {
    translateExpertise: (expertise?: string) =>
      translateExpertField(expertise, 'expertise', currentLang),
    translateEducation: (education?: string) =>
      translateExpertField(education, 'education', currentLang),
    translatePosition: (position?: string) =>
      translateExpertField(position, 'position', currentLang),
    translateField: (field?: string, type: 'expertise' | 'education' | 'position' | 'default' = 'default') =>
      translateExpertField(field, type, currentLang),
    currentLang,
  };
};

