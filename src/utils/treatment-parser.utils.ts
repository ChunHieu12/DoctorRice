/**
 * Treatment Parser Utilities
 * Parse chatbot AI response to extract structured treatment data
 */

export interface ParsedTreatmentData {
  disease: {
    name: string;
    nameEn: string;
    confidence: number;
    severity: string;
  };
  currentConditions: {
    temp: number;
    humidity: number;
    ph: number;
    soil: number;
    riskLevel: string;
  };
  pesticides: Array<{
    name: string;
    activeIngredient: string;
    dosage: string;
    mixing: string;
    timing: string;
    frequency: string;
    notes: string;
  }>;
  fertilizers: Array<{
    name: string;
    type: string;
    dosage: string;
    mixing: string;
    timing: string;
    reason: string;
  }>;
  wateringSchedule: Array<{
    date: string;
    time: string;
    action: string;
    targetLevel: string;
    duration: string;
    reason: string;
  }>;
  schedule: Array<{
    date: string;
    time: string;
    task: string;
    details: string;
  }>;
}

/**
 * Parse chatbot AI monitoring plan response to extract treatment data
 */
export function parseMonitoringPlanResponse(
  aiResponse: string,
  diseaseName: string,
  diseaseNameEn: string,
  confidence: number,
  sensors?: {
    temperature?: number;
    humidity?: number;
    ph?: number;
    soilMoisture?: number;
    lux?: number;
    windSpeed?: number;
  }
): ParsedTreatmentData {
  console.log('🔍 Parsing monitoring plan response...', {
    responseLength: aiResponse.length,
    diseaseName,
    diseaseNameEn,
    confidence,
  });

  // Extract pesticide information
  const pesticideSection = extractSection(aiResponse, '📋 THUỐC TRỊ BỆNH', '🌾');
  const pesticide = parsePesticide(pesticideSection);

  // Extract fertilizer information
  const fertilizerSection = extractSection(aiResponse, '🌾 PHÂN BÓN', '📅');
  const fertilizer = parseFertilizer(fertilizerSection);

  // Extract schedule information
  const scheduleSection = extractSection(aiResponse, '📅 KẾ HOẠCH', '⚠️');
  const schedule = parseSchedule(scheduleSection);

  // Extract conclusion/notes
  const conclusionSection = extractSection(aiResponse, '⚠️ KẾT LUẬN', null);
  const notes = conclusionSection.trim();

  // Determine severity based on confidence
  const severity = confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low';

  // Determine risk level from sensors
  const riskLevel = determineRiskLevel(sensors);

  // Build treatment data structure
  const treatmentData: ParsedTreatmentData = {
    disease: {
      name: diseaseName,
      nameEn: diseaseNameEn,
      confidence,
      severity,
    },
    currentConditions: {
      temp: sensors?.temperature || 0,
      humidity: sensors?.humidity || 0,
      ph: sensors?.ph || 0,
      soil: sensors?.soilMoisture || 0,
      riskLevel,
    },
    pesticides: pesticide ? [pesticide] : [],
    fertilizers: fertilizer ? [fertilizer] : [],
    wateringSchedule: [],
    schedule: schedule,
  };

  // Add notes to pesticide if available
  if (notes && treatmentData.pesticides.length > 0) {
    treatmentData.pesticides[0].notes = notes;
  }

  console.log('✅ Parsed treatment data:', {
    hasPesticide: treatmentData.pesticides.length > 0,
    hasFertilizer: treatmentData.fertilizers.length > 0,
    scheduleCount: treatmentData.schedule.length,
  });

  return treatmentData;
}

/**
 * Extract a section from text between two markers
 */
function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';

  const endIndex = endMarker ? text.indexOf(endMarker, startIndex) : text.length;
  if (endIndex === -1) return text.substring(startIndex);

  return text.substring(startIndex, endIndex);
}

/**
 * Parse pesticide information from text
 */
function parsePesticide(text: string): ParsedTreatmentData['pesticides'][0] | null {
  if (!text) return null;

  // Extract name (may include active ingredient)
  const nameMatch = text.match(/Tên:\s*(.+?)(?:\n|$)/i) || text.match(/Tên:\s*(.+?)(?:\s*-|$)/i);
  const name = nameMatch ? nameMatch[1].trim() : '';

  // Extract active ingredient (if in parentheses or after dash)
  const activeIngredientMatch = text.match(/\(([^)]+)\)|-\s*([^-]+)/);
  const activeIngredient = activeIngredientMatch
    ? (activeIngredientMatch[1] || activeIngredientMatch[2] || '').trim()
    : '';

  // Extract dosage
  const dosageMatch = text.match(/Liều lượng:\s*(.+?)(?:\n|$)/i) || text.match(/(\d+[-\s]*\d*\s*[gml]+\/[0-9L]+)/i);
  const dosage = dosageMatch ? dosageMatch[1].trim() : '';

  // Extract mixing/usage instructions
  const mixingMatch = text.match(/Cách dùng:\s*(.+?)(?:\n|$)/i) || text.match(/Cách dùng:\s*(.+?)(?:\n|📅)/i);
  const mixing = mixingMatch ? mixingMatch[1].trim() : '';

  // Extract timing (default: morning/afternoon)
  const timingMatch = text.match(/Sáng|Chiều|sáng|chiều/i);
  const timing = timingMatch ? (timingMatch[0].includes('Sáng') || timingMatch[0].includes('sáng') ? 'Sáng sớm (6-8h)' : 'Chiều mát (16-18h)') : 'Sáng sớm (6-8h) hoặc chiều mát (16-18h)';

  // Extract frequency
  const frequencyMatch = text.match(/(\d+[-\s]*\d*)\s*lần/i) || text.match(/Phun\s*(\d+[-\s]*\d*)\s*lần/i);
  const frequency = frequencyMatch ? `Phun ${frequencyMatch[1]} lần, cách nhau 7-10 ngày` : 'Phun 2-3 lần, cách nhau 7-10 ngày';

  if (!name) {
    console.warn('⚠️ Could not parse pesticide name from:', text.substring(0, 100));
    return null;
  }

  // Clean active ingredient: remove "ví dụ:" prefix if present
  let cleanedActiveIngredient = activeIngredient || name.split('(')[1]?.replace(')', '').trim() || '';
  cleanedActiveIngredient = cleanedActiveIngredient.replace(/^ví dụ:\s*/i, '').trim();

  return {
    name: name.split('(')[0].trim(), // Remove active ingredient from name if included
    activeIngredient: cleanedActiveIngredient,
    dosage: dosage || '20-30g/20L',
    mixing: mixing || 'Hòa tan thuốc trong nước sạch, khuấy đều 2-3 phút',
    timing,
    frequency,
    notes: 'Tránh phun khi trời mưa hoặc nắng gắt. Đeo bảo hộ khi phun.',
  };
}

/**
 * Parse fertilizer information from text
 */
function parseFertilizer(text: string): ParsedTreatmentData['fertilizers'][0] | null {
  if (!text) return null;

  // Extract name
  const nameMatch = text.match(/Tên:\s*(.+?)(?:\n|$)/i) || text.match(/Tên:\s*(.+?)(?:\s*-|$)/i);
  const name = nameMatch ? nameMatch[1].trim() : '';

  // Extract type (NPK, Urea, etc.)
  const typeMatch = text.match(/(NPK|Urea|Kali|Phân chuồng|Phân hữu cơ)/i);
  const type = typeMatch ? typeMatch[1] : 'Phân bón phục hồi';

  // Extract dosage
  const dosageMatch = text.match(/Liều lượng:\s*(.+?)(?:\n|$)/i) || text.match(/(\d+[-\s]*\d*\s*[kg]+)/i);
  const dosage = dosageMatch ? dosageMatch[1].trim() : '';

  // Extract usage instructions
  const mixingMatch = text.match(/Cách dùng:\s*(.+?)(?:\n|$)/i);
  const mixing = mixingMatch ? mixingMatch[1].trim() : 'Rải đều trên ruộng';

  // Extract timing
  const timingMatch = text.match(/Ngày\s*(\d+)/i);
  const timing = timingMatch ? `Ngày ${timingMatch[1]}` : 'Sau khi phun thuốc 7-10 ngày';

  // Extract reason
  const reason = 'Phục hồi sức khỏe cây lúa sau khi điều trị bệnh';

  if (!name) {
    console.warn('⚠️ Could not parse fertilizer name from:', text.substring(0, 100));
    return null;
  }

  return {
    name,
    type,
    dosage: dosage || '10-15kg/sào',
    mixing,
    timing,
    reason,
  };
}

/**
 * Parse schedule information from text
 */
function parseSchedule(text: string): ParsedTreatmentData['schedule'] {
  if (!text) return [];

  const schedule: ParsedTreatmentData['schedule'] = [];
  const lines = text.split('\n').filter(line => line.trim());

  lines.forEach((line, index) => {
    // Match pattern: "• Ngày X: Task description"
    const dayMatch = line.match(/Ngày\s*(\d+)[:\-]?\s*(.+)/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      const task = dayMatch[2].trim();

      // Calculate date (today + day offset)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + day - 1);
      const dateStr = targetDate.toISOString().split('T')[0];

      schedule.push({
        date: dateStr,
        time: day === 1 ? 'Sáng sớm (6-8h)' : 'Sáng sớm (6-8h)',
        task: task.split(':')[0] || task,
        details: task,
      });
    } else if (line.includes('Ngày') || line.includes('Phun') || line.includes('Bón')) {
      // Fallback: extract any task-like line
      const taskMatch = line.match(/(.+?):\s*(.+)/) || [null, line, ''];
      if (taskMatch[1]) {
        schedule.push({
          date: new Date().toISOString().split('T')[0],
          time: 'Sáng sớm (6-8h)',
          task: taskMatch[1].trim(),
          details: taskMatch[2]?.trim() || taskMatch[1].trim(),
        });
      }
    }
  });

  return schedule;
}

/**
 * Determine risk level from sensor data
 */
function determineRiskLevel(sensors?: {
  temperature?: number;
  humidity?: number;
  ph?: number;
  soilMoisture?: number;
}): string {
  if (!sensors) return 'medium';

  const temp = sensors.temperature || 0;
  const humidity = sensors.humidity || 0;
  const ph = sensors.ph || 0;
  const soil = sensors.soilMoisture || 0;

  // High risk: extreme conditions
  if (temp > 35 || temp < 15 || humidity > 90 || humidity < 30 || ph < 5 || ph > 8) {
    return 'high';
  }

  // Low risk: optimal conditions
  if (temp >= 25 && temp <= 30 && humidity >= 60 && humidity <= 80 && ph >= 6 && ph <= 7) {
    return 'low';
  }

  return 'medium';
}

