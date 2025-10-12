import { ParserConfig, ParsedData, TimetableEntry } from './parser-types';
import { parseDate, cleanString, extractUnitCode } from './utils';

/**
 * Exam Format Parser - for exam timetables with dates
 */

export const examFormatParser: ParserConfig = {
  name: 'Exam Format',
  description: 'Parses exam timetables with dates, times, and venues',
  
  detect: (data: any[][]): boolean => {
    // Look for "exam" keyword and date patterns
    const firstRows = data.slice(0, 10).map(row => 
      row.map(cell => cleanString(cell).toLowerCase())
    );
    
    let hasExamKeyword = false;
    let hasDateColumn = false;
    
    for (const row of firstRows) {
      if (row.some(cell => cell.includes('exam'))) {
        hasExamKeyword = true;
      }
      if (row.some(cell => cell.includes('date') || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cell))) {
        hasDateColumn = true;
      }
    }
    
    return hasExamKeyword && hasDateColumn;
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
      
      const possibleMap: { [key: string]: number } = {};
      
      cleanRow.forEach((cell, index) => {
        if (cell.includes('unit') || cell.includes('code') || cell.includes('course')) {
          possibleMap['unit_code'] = index;
        }
        if (cell.includes('name') || cell.includes('title')) {
          possibleMap['unit_name'] = index;
        }
        if (cell.includes('date')) {
          possibleMap['date'] = index;
        }
        if (cell.includes('time') || cell.includes('start')) {
          possibleMap['time'] = index;
        }
        if (cell.includes('venue') || cell.includes('room') || cell.includes('hall')) {
          possibleMap['venue'] = index;
        }
        if (cell.includes('invigilator') || cell.includes('supervisor')) {
          possibleMap['lecturer'] = index;
        }
      });
      
      if (possibleMap['unit_code'] !== undefined && possibleMap['date'] !== undefined) {
        headerRowIndex = i;
        columnMap = possibleMap;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not identify exam timetable structure');
    }
    
    // Parse exam entries
    for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      if (!row || row.length === 0) continue;
      
      const unitCodeCell = cleanString(row[columnMap['unit_code']]);
      const unitCode = extractUnitCode(unitCodeCell) || unitCodeCell;
      
      if (!unitCode || unitCode.length < 2) continue;
      
      const unitName = columnMap['unit_name'] !== undefined 
        ? cleanString(row[columnMap['unit_name']]) 
        : unitCode;
      
      const examDate = columnMap['date'] !== undefined 
        ? parseDate(cleanString(row[columnMap['date']])) 
        : null;
      
      const venue = columnMap['venue'] !== undefined 
        ? cleanString(row[columnMap['venue']]) 
        : null;
      
      const lecturer = columnMap['lecturer'] !== undefined 
        ? cleanString(row[columnMap['lecturer']]) 
        : null;
      
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
        type: 'Exam',
        day: null,
        time_start: null,
        time_end: null,
        venue,
        lecturer,
        semester,
        year,
        university_id: universityId,
        exam_date: examDate
      });
    }
    
    return { entries, units };
  }
};
