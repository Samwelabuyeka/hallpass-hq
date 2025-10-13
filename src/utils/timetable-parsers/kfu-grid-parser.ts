import { ParserConfig, TimetableEntry, ParsedData } from './parser-types';
import { cleanString, normalizeDayName } from './utils';

/**
 * KFU Grid Format Parser
 * Handles timetables with:
 * - Time slots in first column (e.g., "07:00 - 10:00")
 * - Days as column headers (MONDAY, TUESDAY, etc.)
 * - Multiple entries per cell separated by newlines
 * - Format: UNIT CODE - GROUP/ROOM / LECTURER
 */
export const kfuGridParser: ParserConfig = {
  name: 'KFU Grid Format',
  description: 'Grid layout with time slots in rows and days in columns. Multiple classes per cell.',
  
  detect: (data: any[][]): boolean => {
    // Check for day names in the first few rows
    const dayPattern = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)/i;
    for (let i = 0; i < Math.min(3, data.length); i++) {
      for (const cell of data[i]) {
        if (cell && dayPattern.test(String(cell))) {
          return true;
        }
      }
    }
    return false;
  },

  parse: (data: any[][], semester: number, year: number, universityId: string): ParsedData => {
    const entries: TimetableEntry[] = [];
    const units = new Map<string, { code: string; name: string; department?: string }>();

    // Find day columns
    const dayColumns: { [key: string]: number } = {};
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    
    for (let i = 0; i < Math.min(3, data.length); i++) {
      for (let col = 0; col < data[i].length; col++) {
        const cell = data[i][col];
        if (cell) {
          const cellValue = String(cell).toUpperCase();
          for (const day of days) {
            if (cellValue.includes(day)) {
              dayColumns[day] = col;
            }
          }
        }
      }
    }

    // Parse time slots and entries (skip header rows)
    for (let row = 3; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData || rowData.length === 0) continue;

      // Get time slot from first column
      const timeCell = rowData[0];
      if (!timeCell) continue;
      
      const timeStr = String(timeCell).trim();
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (!timeMatch) continue;

      const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:00`;
      const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}:00`;

      // Process each day column
      for (const [day, col] of Object.entries(dayColumns)) {
        const cellContent = rowData[col];
        if (!cellContent) continue;

        const lines = String(cellContent).split('\n').filter(line => line.trim());

        for (const line of lines) {
          const parsed = parseKFUEntry(line, day, startTime, endTime, semester, year, universityId);
          if (parsed) {
            entries.push(parsed);
            
            // Store unit info
            if (!units.has(parsed.unit_code)) {
              units.set(parsed.unit_code, {
                code: parsed.unit_code,
                name: parsed.unit_name,
                department: extractDepartment(parsed.unit_code)
              });
            }
          }
        }
      }
    }

    return { entries, units };
  }
};

function parseKFUEntry(
  line: string,
  day: string,
  startTime: string,
  endTime: string,
  semester: number,
  year: number,
  universityId: string
): TimetableEntry | null {
  // Format: UNIT CODE - GROUP/ROOM / LECTURER
  // Example: "BCB 102 - 24G3 / BUSULA" or "BCS 113 - 24S2 / OCHOLI"
  
  const parts = line.split('/');
  const lecturer = parts.length > 1 ? cleanString(parts[parts.length - 1]) : null;
  
  const mainPart = parts[0].trim();
  const dashSplit = mainPart.split('-');
  
  if (dashSplit.length < 2) return null;
  
  const unitCode = cleanString(dashSplit[0]);
  const venueGroup = cleanString(dashSplit[1]);
  
  if (!unitCode) return null;

  // Extract venue from group/venue string (e.g., "24G3", "LT2", "ICT1")
  const venue = venueGroup || null;

  return {
    university_id: universityId,
    unit_code: unitCode,
    unit_name: unitCode, // Will be enriched later
    day: normalizeDayName(day),
    time_start: startTime,
    time_end: endTime,
    venue,
    lecturer,
    semester,
    year,
    type: 'lecture'
  };
}

function extractDepartment(unitCode: string): string {
  const prefix = unitCode.match(/^([A-Z]{2,4})/)?.[1];
  
  const deptMap: { [key: string]: string } = {
    'BCB': 'Biochemistry',
    'BCS': 'Computer Science',
    'BIT': 'Information Technology',
    'BCF': 'Clinical Medicine',
    'BCA': 'Clinical Medicine',
    'AGR': 'Agriculture',
    'AEC': 'Economics',
    'AAH': 'Animal Health',
    'BOV': 'Veterinary Medicine',
    'CIT': 'Information Technology',
    'ECO': 'Economics',
    'EDF': 'Education',
    'ECD': 'Education',
    'EFL': 'English',
    'ENG': 'English',
    'EPM': 'Education',
    'ESM': 'Science',
    'GEO': 'Geography',
    'HCM': 'Health Management',
    'HPE': 'Physical Education',
    'HIS': 'History',
    'HSC': 'Health Sciences',
    'KIS': 'Kiswahili',
    'LIT': 'Literature',
    'MAT': 'Mathematics',
    'NCN': 'Nursing',
    'NUR': 'Nursing',
    'PSY': 'Psychology',
    'REL': 'Religion',
    'SBT': 'Business',
    'SCH': 'Chemistry',
    'SCR': 'Christian Religious Education',
    'SMB': 'Business',
    'SPH': 'Physics',
    'SSW': 'Social Work',
    'STA': 'Statistics',
    'SZL': 'Zoology',
    'DPI': 'Development Studies'
  };

  return prefix ? (deptMap[prefix] || 'General') : 'General';
}
