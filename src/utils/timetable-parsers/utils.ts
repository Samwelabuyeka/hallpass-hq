/**
 * Utility functions for timetable parsing
 */

export const parseTimeSlot = (timeSlot: string): { start: string; end: string } | null => {
  if (!timeSlot) return null;
  
  // Format: "07:00 - 10:00" or "7:00-10:00" or "07:00-10:00"
  const match = timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const startHour = match[1].padStart(2, '0');
    const startMin = match[2];
    const endHour = match[3].padStart(2, '0');
    const endMin = match[4];
    
    return {
      start: `${startHour}:${startMin}:00`,
      end: `${endHour}:${endMin}:00`
    };
  }
  
  return null;
};

export const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  try {
    // Try various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Convert to YYYY-MM-DD
        if (format === formats[1]) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // Assume DD/MM/YYYY for other formats
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing date:', e);
  }
  
  return null;
};

export const cleanString = (str: any): string => {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
};

export const extractUnitCode = (text: string): string | null => {
  if (!text) return null;
  
  // Common patterns for unit codes
  const patterns = [
    /([A-Z]{2,4}\s?\d{3}[A-Z]?)/i, // BCB 105, BIT 314, etc.
    /([A-Z]{2,4}-\d{3}[A-Z]?)/i, // BCB-105
    /([A-Z]{3,4}\d{3}[A-Z]?)/i, // BCB105
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/\s+/g, ' ').trim().toUpperCase();
    }
  }
  
  return null;
};

export const determineClassType = (text: string): string => {
  const lower = text.toLowerCase();
  
  if (lower.includes('lab') || lower.includes('practical') || lower.includes('prac')) {
    return 'Lab';
  }
  if (lower.includes('tutorial') || lower.includes('tut')) {
    return 'Tutorial';
  }
  if (lower.includes('exam')) {
    return 'Exam';
  }
  if (lower.includes('lecture') || lower.includes('lec')) {
    return 'Lecture';
  }
  
  return 'Lecture'; // Default
};

export const normalizeDayName = (day: string): string | null => {
  if (!day) return null;
  
  const dayMap: { [key: string]: string } = {
    'mon': 'MONDAY',
    'monday': 'MONDAY',
    'tue': 'TUESDAY',
    'tues': 'TUESDAY',
    'tuesday': 'TUESDAY',
    'wed': 'WEDNESDAY',
    'wednesday': 'WEDNESDAY',
    'thu': 'THURSDAY',
    'thur': 'THURSDAY',
    'thurs': 'THURSDAY',
    'thursday': 'THURSDAY',
    'fri': 'FRIDAY',
    'friday': 'FRIDAY',
    'sat': 'SATURDAY',
    'saturday': 'SATURDAY',
    'sun': 'SUNDAY',
    'sunday': 'SUNDAY',
  };
  
  const normalized = day.toLowerCase().trim();
  return dayMap[normalized] || day.toUpperCase();
};
