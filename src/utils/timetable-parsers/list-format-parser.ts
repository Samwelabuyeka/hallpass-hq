import { ParserConfig, ParsedData, TimetableEntry } from './parser-types';
import { parseTimeSlot, cleanString, extractUnitCode, determineClassType, normalizeDayName } from './utils';

/**
 * List Format Parser - for timetables organized as a list with each row being one class
 * Common columns: Unit Code, Unit Name, Day, Time, Venue, Lecturer, etc.
 */

export const listFormatParser: ParserConfig = {
  name: 'List Format (Row per Class)',
  description: 'Parses timetables where each row represents one class with columns for different attributes',
  
  detect: (data: any[][]): boolean => {
    // Look for column headers in first few rows
    const firstRows = data.slice(0, 5);
    
    const columnKeywords = [
      ['unit', 'code', 'course'],
      ['day', 'week'],
      ['time', 'start', 'end'],
      ['venue', 'room', 'location'],
      ['lecturer', 'instructor', 'teacher']
    ];
    
    for (const row of firstRows) {
      const cleanRow = row.map(cell => cleanString(cell).toLowerCase());
      let matchedCategories = 0;
      
      columnKeywords.forEach(keywords => {
        if (cleanRow.some(cell => keywords.some(keyword => cell.includes(keyword)))) {
          matchedCategories++;
        }
      });
      
      if (matchedCategories >= 3) {
        return true;
      }
    }
    
    return false;
  },
  
  parse: (data: any[][], semester: number, year: number, universityId: string): ParsedData => {
    const entries: TimetableEntry[] = [];
    const units = new Map<string, { code: string; name: string; department?: string }>();
    
    // Find header row
    let headerRowIndex = -1;
    let columnMap: { [key: string]: number } = {};
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const cleanRow = row.map(cell => cleanString(cell).toLowerCase());
      
      // Try to identify columns
      const possibleMap: { [key: string]: number } = {};
      
      cleanRow.forEach((cell, index) => {
        if (cell.includes('unit') || cell.includes('code') || cell.includes('course')) {
          possibleMap['unit_code'] = index;
        }
        if (cell.includes('name') || cell.includes('title')) {
          possibleMap['unit_name'] = index;
        }
        if (cell.includes('day') || cell.includes('week')) {
          possibleMap['day'] = index;
        }
        if (cell.includes('start') || (cell.includes('time') && !cell.includes('end'))) {
          possibleMap['time_start'] = index;
        }
        if (cell.includes('end')) {
          possibleMap['time_end'] = index;
        }
        if (cell.includes('time') && !possibleMap['time_start']) {
          possibleMap['time'] = index;
        }
        if (cell.includes('venue') || cell.includes('room') || cell.includes('location')) {
          possibleMap['venue'] = index;
        }
        if (cell.includes('lecturer') || cell.includes('instructor') || cell.includes('teacher')) {
          possibleMap['lecturer'] = index;
        }
        if (cell.includes('type') || cell.includes('class')) {
          possibleMap['type'] = index;
        }
      });
      
      if (Object.keys(possibleMap).length >= 3) {
        headerRowIndex = i;
        columnMap = possibleMap;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not identify column structure in the timetable');
    }
    
    // Parse data rows
    for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      if (!row || row.length === 0) continue;
      
      const unitCodeCell = columnMap['unit_code'] !== undefined ? cleanString(row[columnMap['unit_code']]) : '';
      const unitCode = extractUnitCode(unitCodeCell) || unitCodeCell;
      
      if (!unitCode || unitCode.length < 2) continue;
      
      const unitName = columnMap['unit_name'] !== undefined 
        ? cleanString(row[columnMap['unit_name']]) 
        : unitCode;
      
      const day = columnMap['day'] !== undefined 
        ? normalizeDayName(cleanString(row[columnMap['day']])) 
        : null;
      
      let timeStart: string | null = null;
      let timeEnd: string | null = null;
      
      if (columnMap['time'] !== undefined) {
        const times = parseTimeSlot(cleanString(row[columnMap['time']]));
        if (times) {
          timeStart = times.start;
          timeEnd = times.end;
        }
      } else {
        timeStart = columnMap['time_start'] !== undefined 
          ? cleanString(row[columnMap['time_start']]) 
          : null;
        timeEnd = columnMap['time_end'] !== undefined 
          ? cleanString(row[columnMap['time_end']]) 
          : null;
        
        // Normalize time format
        if (timeStart && !timeStart.includes(':')) {
          const parsed = parseTimeSlot(`${timeStart}-${timeEnd}`);
          if (parsed) {
            timeStart = parsed.start;
            timeEnd = parsed.end;
          }
        }
      }
      
      const venue = columnMap['venue'] !== undefined 
        ? cleanString(row[columnMap['venue']]) 
        : null;
      
      const lecturer = columnMap['lecturer'] !== undefined 
        ? cleanString(row[columnMap['lecturer']]) 
        : null;
      
      const typeCell = columnMap['type'] !== undefined 
        ? cleanString(row[columnMap['type']]) 
        : '';
      const type = typeCell || determineClassType(unitCode + ' ' + unitName);
      
      if (!units.has(unitCode)) {
        units.set(unitCode, { 
          code: unitCode, 
          name: unitName,
          department: unitCode.match(/^[A-Z]+/)?.[0]
        });
      }
      
      entries.push({
        unit_code: unitCode,
        unit_name: unitName,
        type,
        day,
        time_start: timeStart,
        time_end: timeEnd,
        venue,
        lecturer,
        semester,
        year,
        university_id: universityId
      });
    }
    
    return { entries, units };
  }
};
