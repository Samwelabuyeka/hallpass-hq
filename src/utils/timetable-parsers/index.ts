import * as XLSX from 'xlsx';
import { ParserConfig, ParseResult } from './parser-types';
import { gridFormatParser } from './grid-format-parser';
import { listFormatParser } from './list-format-parser';
import { examFormatParser } from './exam-format-parser';

// Register all universal parsers
const PARSERS: ParserConfig[] = [
  gridFormatParser,   // Handles all grid formats (including KFU)
  listFormatParser,   // Handles row-per-class formats
  examFormatParser,   // Handles exam timetables
];

/**
 * Intelligent timetable parser that automatically detects and uses the appropriate format parser
 */
export class TimetableParser {
  /**
   * Parse a timetable file with automatic format detection
   */
  static async parseFile(
    file: File,
    semester: number,
    year: number,
    universityId: string
  ): Promise<ParseResult> {
    try {
      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        return {
          success: false,
          error: 'The file appears to be empty'
        };
      }

      // Try each parser until one succeeds
      for (const parser of PARSERS) {
        try {
          if (parser.detect(jsonData)) {
            console.log(`Detected format: ${parser.name}`);
            const parsedData = parser.parse(jsonData, semester, year, universityId);
            
            if (parsedData.entries.length === 0) {
              console.log(`Parser ${parser.name} detected but found no entries, trying next parser...`);
              continue;
            }
            
            return {
              success: true,
              data: parsedData,
              parserUsed: parser.name
            };
          }
        } catch (error) {
          console.error(`Parser ${parser.name} failed:`, error);
          // Continue to next parser
        }
      }

      return {
        success: false,
        error: 'Could not detect timetable format. Please ensure the file follows a supported format.'
      };

    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse file'
      };
    }
  }

  /**
   * Get list of available parsers with their descriptions
   */
  static getAvailableParsers(): Array<{ name: string; description: string }> {
    return PARSERS.map(p => ({
      name: p.name,
      description: p.description
    }));
  }

  /**
   * Download a template file for a specific format
   */
  static downloadTemplate(formatName: string) {
    const templateData: { [key: string]: any[][] } = {
      'Grid Format (Days as Columns)': [
        ['TIMETABLE - SEMESTER I (2025/2026)'],
        [],
        ['', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        ['07:00 - 10:00', 'BCB 105 - LR1 / Dr. Smith', 'BIT 314 - ICT1 / Prof. Jones', 'BCS 113 - LT2 / Mr. Brown', '', ''],
        ['10:00 - 13:00', '', 'BCB 204 - LAB / Dr. Smith', '', 'BIT 210 - ICT2 / Ms. Davis', ''],
      ],
      'List Format (Row per Class)': [
        ['Unit Code', 'Unit Name', 'Day', 'Time', 'Venue', 'Lecturer'],
        ['BCB 105', 'Biology', 'MONDAY', '07:00 - 10:00', 'LR1', 'Dr. Smith'],
        ['BIT 314', 'Programming', 'TUESDAY', '07:00 - 10:00', 'ICT1', 'Prof. Jones'],
        ['BCS 113', 'Data Structures', 'WEDNESDAY', '07:00 - 10:00', 'LT2', 'Mr. Brown'],
      ],
      'Exam Format': [
        ['Unit Code', 'Unit Name', 'Exam Date', 'Time', 'Venue', 'Invigilator'],
        ['BCB 105', 'Biology', '15/12/2025', '09:00 - 12:00', 'Main Hall', 'Dr. Smith'],
        ['BIT 314', 'Programming', '16/12/2025', '09:00 - 12:00', 'LT1', 'Prof. Jones'],
      ],
    };

    const data = templateData[formatName];
    if (!data) {
      console.error('Template not found for format:', formatName);
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, `timetable_template_${formatName.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  }
}

export * from './parser-types';
