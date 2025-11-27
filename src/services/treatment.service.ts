/**
 * Treatment Service
 * Handles sending treatment recommendations to IoT devices
 */

import type { ApiResponse, SendTreatmentData, TreatmentData, TreatmentLog } from '@/types';
import { apiGet, apiPost } from './api';

/**
 * Send treatment information to IoT device via Firebase
 */
export const sendTreatmentToIoT = async (
  data: SendTreatmentData
): Promise<ApiResponse<TreatmentLog>> => {
  return apiPost<TreatmentLog>('/iot/treatment/send', data);
};

/**
 * Get treatment history for a field
 */
export const getTreatmentHistory = async (params: {
  fieldId?: string;
  photoId?: string;
  limit?: number;
  page?: number;
}): Promise<
  ApiResponse<{
    logs: TreatmentLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>
> => {
  const queryParams = new URLSearchParams({
    ...(params.fieldId && { fieldId: params.fieldId }),
    ...(params.photoId && { photoId: params.photoId }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.page && { page: params.page.toString() }),
  });

  return apiGet(`/iot/treatment/history?${queryParams.toString()}`);
};

/**
 * Parse AI response to extract treatment data
 * Assumes Gemini returns structured JSON in response
 */
export const parseAIResponseToTreatment = (aiResponse: string): TreatmentData | null => {
  try {
    // Try to find JSON block in response (between ```json and ```)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1];
      return JSON.parse(jsonStr) as TreatmentData;
    }

    // Try direct JSON parse
    return JSON.parse(aiResponse) as TreatmentData;
  } catch (error) {
    console.warn('Failed to parse AI response as treatment data:', error);
    return null;
  }
};

/**
 * Validate treatment data structure
 */
export const validateTreatmentData = (data: TreatmentData): boolean => {
  // At least one treatment method should be specified
  return !!(data.medication || data.fertilizer || data.schedule);
};

/**
 * Format treatment data for display
 */
export const formatTreatmentForDisplay = (data: TreatmentData): string => {
  const parts: string[] = [];

  if (data.medication) {
    parts.push(
      `**Thuốc trị bệnh:**\n- Tên: ${data.medication.name}\n- Liều lượng: ${data.medication.dosage}\n- Cách dùng: ${data.medication.usage}`
    );
  }

  if (data.fertilizer) {
    parts.push(
      `**Phân bón phục hồi:**\n- Tên: ${data.fertilizer.name}\n- Liều lượng: ${data.fertilizer.dosage}\n- Cách dùng: ${data.fertilizer.usage}`
    );
  }

  if (data.schedule) {
    let scheduleText = '**Kế hoạch chăm sóc:**\n';
    if (data.schedule.sprayDates?.length) {
      scheduleText += `- Phun thuốc: ${data.schedule.sprayDates.join(', ')}\n`;
    }
    if (data.schedule.fertilizeDates?.length) {
      scheduleText += `- Bón phân: ${data.schedule.fertilizeDates.join(', ')}\n`;
    }
    if (data.schedule.wateringSchedule) {
      scheduleText += `- Tưới nước: ${data.schedule.wateringSchedule}`;
    }
    parts.push(scheduleText);
  }

  if (data.notes) {
    parts.push(`**Ghi chú:** ${data.notes}`);
  }

  return parts.join('\n\n');
};

export default {
  sendTreatmentToIoT,
  getTreatmentHistory,
  parseAIResponseToTreatment,
  validateTreatmentData,
  formatTreatmentForDisplay,
};

