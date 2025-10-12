import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';

interface TimetableEntry {
  unit_code: string;
  unit_name: string;
  type: string;
  day: string;
  time_start: string;
  time_end: string;
  venue: string | null;
  lecturer: string | null;
  semester: number;
  year: number;
  university_id: string;
}

const KFU_ID = "62bfa473-d38d-4141-9e10-322a7a3ca000";
const SEMESTER = 1;
const YEAR = 2025;

export default function TimetableImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<{ units: number; timetables: number } | null>(null);

  const parseTimeSlot = (timeSlot: string): { start: string; end: string } => {
    const match = timeSlot.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (match) {
      return {
        start: `${match[1]}:${match[2]}:00`,
        end: `${match[3]}:${match[4]}:00`
      };
    }
    return { start: "00:00:00", end: "00:00:00" };
  };

  const parseCellEntry = (entry: string): { code: string; room: string | null; lecturer: string | null } => {
    if (!entry || entry.trim() === "") {
      return { code: "", room: null, lecturer: null };
    }

    // Format: "UNIT_CODE - ROOM / LECTURER" or variations
    const parts = entry.split('/');
    const lecturer = parts.length > 1 ? parts[1].trim() : null;
    
    const codeParts = parts[0].split('-');
    const code = codeParts[0].trim();
    const room = codeParts.length > 1 ? codeParts[1].trim() : null;

    return { code, room, lecturer };
  };

  const determineType = (code: string): string => {
    // You can enhance this logic based on course codes
    if (code.includes('LAB') || code.includes('PRAC')) return 'Lab';
    if (code.includes('TUT')) return 'Tutorial';
    return 'Lecture';
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setProgress("Reading file...");
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      setProgress("Parsing timetable data...");
      
      const entries: TimetableEntry[] = [];
      const uniqueUnits = new Map<string, { code: string; name: string }>();
      
      // Days mapping (assuming columns 1-5 are MONDAY to FRIDAY)
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      
      // Find time slot rows (they start with time like "07:00 - 10:00")
      for (let row = 0; row < jsonData.length; row++) {
        const timeSlotCell = jsonData[row][0];
        if (timeSlotCell && typeof timeSlotCell === 'string' && timeSlotCell.includes(':')) {
          const times = parseTimeSlot(timeSlotCell);
          
          // Parse entries for each day
          for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
            const colIndex = dayIndex + 1;
            const cellValue = jsonData[row][colIndex];
            
            if (cellValue && typeof cellValue === 'string') {
              // Split by newline in case multiple classes are in one cell
              const classes = cellValue.split('\n').filter(c => c.trim());
              
              for (const classEntry of classes) {
                const parsed = parseCellEntry(classEntry);
                if (parsed.code && parsed.code.length > 0) {
                  const unitCode = parsed.code;
                  
                  // Add to unique units
                  if (!uniqueUnits.has(unitCode)) {
                    uniqueUnits.set(unitCode, { code: unitCode, name: unitCode });
                  }
                  
                  entries.push({
                    unit_code: unitCode,
                    unit_name: unitCode, // We'll use code as name for now
                    type: determineType(unitCode),
                    day: days[dayIndex],
                    time_start: times.start,
                    time_end: times.end,
                    venue: parsed.room,
                    lecturer: parsed.lecturer,
                    semester: SEMESTER,
                    year: YEAR,
                    university_id: KFU_ID
                  });
                }
              }
            }
          }
        }
      }

      setProgress(`Found ${uniqueUnits.size} units and ${entries.length} timetable entries. Importing to database...`);

      // Import units first
      const unitsArray = Array.from(uniqueUnits.values()).map(u => ({
        unit_code: u.code,
        unit_name: u.name,
        university_id: KFU_ID,
        semester: SEMESTER,
        year: YEAR,
        department: 'General',
        credits: 3
      }));

      const { error: unitsError } = await supabase
        .from('master_units')
        .upsert(unitsArray, { 
          onConflict: 'university_id,unit_code,semester,year',
          ignoreDuplicates: false 
        });

      if (unitsError) {
        console.error("Units import error:", unitsError);
        throw new Error(`Failed to import units: ${unitsError.message}`);
      }

      setProgress(`Imported ${unitsArray.length} units. Now importing timetable entries...`);

      // Import timetable entries in batches
      const batchSize = 100;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const { error: timetableError } = await supabase
          .from('master_timetables')
          .insert(batch);

        if (timetableError) {
          console.error("Timetable import error:", timetableError);
          throw new Error(`Failed to import timetable entries: ${timetableError.message}`);
        }

        setProgress(`Imported ${Math.min(i + batchSize, entries.length)} of ${entries.length} timetable entries...`);
      }

      setResults({
        units: unitsArray.length,
        timetables: entries.length
      });

      toast.success("Timetable imported successfully!");
      
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import timetable");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Timetable Import Tool</h1>
          <p className="text-muted-foreground">Import timetable data for Kaimosi Friends University</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Timetable File</CardTitle>
            <CardDescription>
              Upload an Excel file (.xlsx, .xls, .xlsm) containing the timetable data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button disabled={importing} asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? "Importing..." : "Upload Timetable File"}
                  </span>
                </Button>
              </label>
            </div>

            {progress && (
              <div className="p-4 bg-primary/10 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm">{progress}</p>
              </div>
            )}

            {results && (
              <div className="p-4 bg-green-500/10 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Import Completed Successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Imported {results.units} units and {results.timetables} timetable entries
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Make sure you're logged in as an administrator</p>
            <p>2. Select the Excel file containing the timetable data</p>
            <p>3. The system will automatically parse and import the data</p>
            <p>4. Units will be created/updated first, then timetable entries will be added</p>
            <p>5. Duplicate entries will be handled automatically</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
