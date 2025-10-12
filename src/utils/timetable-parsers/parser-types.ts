export interface TimetableEntry {
  unit_code: string;
  unit_name: string;
  type: string;
  day: string | null;
  time_start: string | null;
  time_end: string | null;
  venue: string | null;
  lecturer: string | null;
  semester: number;
  year: number;
  university_id: string;
  exam_date?: string | null;
}

export interface ParsedData {
  entries: TimetableEntry[];
  units: Map<string, { code: string; name: string; department?: string }>;
}

export interface ParserConfig {
  name: string;
  description: string;
  detect: (data: any[][]) => boolean;
  parse: (data: any[][], semester: number, year: number, universityId: string) => ParsedData;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedData;
  error?: string;
  parserUsed?: string;
}
