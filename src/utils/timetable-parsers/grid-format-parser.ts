import { ParserConfig, ParsedData, TimetableEntry } from './parser-types';
import { parseTimeSlot, cleanString, extractUnitCode, determineClassType, normalizeDayName } from './utils';

/**
 * Grid Format Parser - for timetables organized in a grid with days as columns
 * Example: KFU format with time slots as rows and days (Mon-Fri) as columns
 */

export const gridFormatParser: ParserConfig = {
  name: 'Grid Format (Days as Columns)',
  description: 'Parses timetables with time slots in rows and days (Mon-Fri) in columns',
  
  detect: (data: any[][]): boolean => {
    // Look for day names in the header row(s)
    const firstRows = data.slice(0, 5).map(row => 
      row.map(cell => cleanString(cell).toUpperCase())
    );
    
    const dayKeywords = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    
    for (const row of firstRows) {
      const matchedDays = row.filter(cell => 
        dayKeywords.some(day => cell.includes(day))
      );
      
      if (matchedDays.length >= 3) {
        return true;
      }
    }
    
    return false;
  },
  
  parse: (data: any[][], semester: number, year: number, universityId: string): ParsedData => {
    const entries: TimetableEntry[] = [];
    const units = new Map<string, { code: string; name: string; department?: string }>();
    
    // Find header row with days
    let headerRowIndex = -1;
    let dayColumns: { [key: string]: number } = {};
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const cleanRow = row.map(cell => cleanString(cell).toUpperCase());
      
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      let foundDays = 0;
      
      cleanRow.forEach((cell, colIndex) => {
        days.forEach(day => {
          if (cell.includes(day)) {
            dayColumns[day] = colIndex;
            foundDays++;
          }
        });
      });
      
      if (foundDays >= 3) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not find day columns in the timetable');
    }
    
    // Parse entries
    for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      if (!row || row.length === 0) continue;
      
      const timeSlotCell = cleanString(row[0]);
      const times = parseTimeSlot(timeSlotCell);
      
      if (!times) continue; // Not a time slot row
      
      // Parse each day's entries
      Object.entries(dayColumns).forEach(([day, colIndex]) => {
        const cellValue = cleanString(row[colIndex]);
        if (!cellValue || cellValue.length < 3) return;
        
        // Split by newline in case multiple classes are in one cell
        const classes = cellValue.split(/[\n\r]+/).filter(c => c.trim().length > 3);
        
        classes.forEach(classEntry => {
          const parsed = parseCellEntry(classEntry);
          if (parsed.code) {
            const unitCode = parsed.code;
            const unitName = parsed.name || unitCode;
            
            if (!units.has(unitCode)) {
              units.set(unitCode, { 
                code: unitCode, 
                name: unitName,
                department: parsed.department 
              });
            }
            
            entries.push({
              unit_code: unitCode,
              unit_name: unitName,
              type: determineClassType(classEntry),
              day: day,
              time_start: times.start,
              time_end: times.end,
              venue: parsed.venue,
              lecturer: parsed.lecturer,
              semester,
              year,
              university_id: universityId
            });
          }
        });
      });
    }
    
    return { entries, units };
  }
};

function parseCellEntry(entry: string): { 
  code: string | null; 
  name: string | null;
  venue: string | null; 
  lecturer: string | null;
  department: string | null;
} {
  // Formats:
  // "BCB 105 - 24F8/"
  // "BIT 314- 24F1/ OSCAR KUNOTHO"
  // "BCB 408 - 24F6 / OBED"
  // "BCS 113- 24S2 /OCHOLI"
  
  const parts = entry.split('/');
  const lecturer = parts.length > 1 ? cleanString(parts[1]) : null;
  
  const codeParts = parts[0].split('-');
  const code = extractUnitCode(codeParts[0]);
  const venue = codeParts.length > 1 ? cleanString(codeParts[1]) : null;
  
  return { 
    code, 
    name: code,
    venue, 
    lecturer,
    department: code ? code.match(/^[A-Z]+/)?.[0] : null
  };
}
