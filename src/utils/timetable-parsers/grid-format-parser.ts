import { ParserConfig, ParsedData, TimetableEntry } from './parser-types';
import { parseTimeSlot, cleanString, extractUnitCode, determineClassType, normalizeDayName } from './utils';

/**
 * Universal Grid Format Parser
 * Handles various grid-based timetables with days as columns:
 * - Single entry per cell (simple format)
 * - Multiple entries per cell separated by newlines (KFU-style and others)
 * - Various entry formats: "CODE - VENUE / LECTURER" or "CODE VENUE LECTURER" etc.
 */

export const gridFormatParser: ParserConfig = {
  name: 'Grid Format (Days as Columns)',
  description: 'Universal grid layout parser: time slots in rows, days in columns. Handles single or multiple classes per cell.',
  
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
    console.log(`Starting to parse timetable. Total rows: ${data.length}, Header at row: ${headerRowIndex}`);
    console.log('Day columns found:', dayColumns);
    
    for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      if (!row || row.length === 0) continue;
      
      const timeSlotCell = cleanString(row[0]);
      const times = parseTimeSlot(timeSlotCell);
      
      if (!times) {
        console.log(`Row ${rowIndex}: Skipping - not a valid time slot (${timeSlotCell})`);
        continue; // Not a time slot row
      }
      
      console.log(`Row ${rowIndex}: Processing time slot ${times.start} - ${times.end}`);
      
      // Parse each day's entries
      Object.entries(dayColumns).forEach(([day, colIndex]) => {
        const cellValue = row[colIndex] ? String(row[colIndex]).trim() : '';
        if (!cellValue || cellValue.length < 3) return;
        
        // Split by newline in case multiple classes are in one cell
        // Also handle various line break formats
        const classes = cellValue
          .split(/[\n\r]+/)
          .map(c => c.trim())
          .filter(c => c.length > 3);
        
        console.log(`  ${day} (col ${colIndex}): Found ${classes.length} classes in cell`);
        
        classes.forEach((classEntry, idx) => {
          const parsed = parseCellEntry(classEntry);
          console.log(`    Class ${idx + 1}: "${classEntry}" -> Code: ${parsed.code}, Venue: ${parsed.venue}, Lecturer: ${parsed.lecturer}`);
          
          if (parsed.code) {
            const unitCode = parsed.code;
            const unitName = parsed.name || unitCode;
            
            if (!units.has(unitCode)) {
              units.set(unitCode, { 
                code: unitCode, 
                name: unitName,
                department: parsed.department 
              });
              console.log(`      ✓ New unit added: ${unitCode}`);
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
          } else {
            console.log(`      ✗ Failed to extract unit code from: "${classEntry}"`);
          }
        });
      });
    }
    
    console.log(`Parsing complete. Extracted ${units.size} unique units and ${entries.length} timetable entries`);
    
    return { entries, units };
  }
};

/**
 * Universal cell entry parser - handles multiple formats:
 * - "BCB 105 - 24F8 / DR ATIENO" (with venue and lecturer)
 * - "BIT 314- 24F1/ OSCAR" (compact format)
 * - "BCS 113 LT6 LILIAN" (space-separated)
 * - "AAH 201 - LT2 / DR MWANGI" (simple format)
 */
function parseCellEntry(entry: string): { 
  code: string | null; 
  name: string | null;
  venue: string | null; 
  lecturer: string | null;
  department: string | null;
} {
  let code: string | null = null;
  let venue: string | null = null;
  let lecturer: string | null = null;
  
  // Try slash-separated format first (most common)
  if (entry.includes('/')) {
    const parts = entry.split('/').map(p => p.trim());
    lecturer = parts.length > 1 ? cleanString(parts[parts.length - 1]) : null;
    
    // Handle the code/venue part
    const mainPart = parts[0];
    if (mainPart.includes('-')) {
      const dashParts = mainPart.split('-').map(p => p.trim());
      code = extractUnitCode(dashParts[0]);
      venue = dashParts.length > 1 ? cleanString(dashParts[1]) : null;
    } else {
      // No dash, try to extract code from beginning
      code = extractUnitCode(mainPart);
      const remaining = mainPart.replace(code || '', '').trim();
      venue = remaining || null;
    }
  } else if (entry.includes('-')) {
    // Dash format without slash
    const dashParts = entry.split('-').map(p => p.trim());
    code = extractUnitCode(dashParts[0]);
    venue = dashParts.length > 1 ? cleanString(dashParts[1]) : null;
  } else {
    // Space-separated format
    const words = entry.trim().split(/\s+/);
    code = extractUnitCode(words.slice(0, 2).join(' ')); // Try first 1-2 words as code
    
    if (words.length > 2) {
      // Remaining words could be venue and/or lecturer
      venue = words.slice(2, 4).join(' '); // Middle words as venue
      if (words.length > 4) {
        lecturer = words.slice(4).join(' '); // Last words as lecturer
      }
    }
  }
  
  const department = code ? code.match(/^[A-Z]{2,4}/)?.[0] || null : null;
  
  // Generate a descriptive name from code if no specific name found
  // Format: "DEPARTMENT ### - Unit Name" (e.g., "BCB 105 - Biochemistry")
  let name = code;
  if (code && department) {
    // Keep the code as the name for now since the timetable doesn't have full names
    name = code;
  }
  
  return { 
    code, 
    name: name,
    venue, 
    lecturer,
    department
  };
}
