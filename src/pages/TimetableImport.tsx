
import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UniversitySelector } from "@/components/university-selector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, Download, Info } from "lucide-react";
import { TimetableParser } from "@/utils/timetable-parsers";
import { AdminGuard } from "@/components/admin/admin-guard";

export default function TimetableImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<{ units: number; timetables: number; parser: string } | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [semester, setSemester] = useState<string>("1");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const handleImport = async (file: File, isExam: boolean) => {
    if (!selectedUniversity) {
      toast.error('Please select a university');
      return;
    }
    
    setImporting(true);
    setProgress("Reading and analyzing file format...");
    
    try {
      const timetableType = isExam ? 'exam' : 'class';
      const parseResult = await TimetableParser.parseFile(
        file,
        parseInt(semester),
        parseInt(year),
        selectedUniversity,
        isExam ? ['Exam Format'] : ['Grid Format (Days as Columns)', 'List Format (Row per Class)']
      );
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || `Failed to parse ${timetableType} timetable`);
      }
      
      const { entries, units } = parseResult.data;
      
      setProgress(`✓ Detected format: ${parseResult.parserUsed}\\nFound ${units.size} units and ${entries.length} timetable entries. Importing to database...`);

      // Import units first
      const unitsArray = Array.from(units.values()).map(u => ({
        unit_code: u.code,
        unit_name: u.name,
        university_id: selectedUniversity,
        semester: parseInt(semester),
        year: parseInt(year),
        department: u.department || 'General',
        credits: 3
      }));

      const { data: existing, error: existingErr } = await supabase
        .from('master_units')
        .select('unit_code')
        .eq('university_id', selectedUniversity)
        .eq('semester', parseInt(semester))
        .eq('year', parseInt(year));

      if (existingErr) {
        console.error('Failed to check existing units:', existingErr);
      }

      const existingCodes = new Set((existing || []).map((e: any) => e.unit_code));
      const newUnits = unitsArray.filter(u => !existingCodes.has(u.unit_code));

      if (newUnits.length > 0) {
        const { error: unitsError } = await supabase.from('master_units').insert(newUnits);
        if (unitsError) {
            handleImportError(unitsError, 'units');
            return;
        }
      }

      setProgress(`Imported ${unitsArray.length} units. Now importing timetable entries...`);

      const timetableEntries = entries.map(entry => ({ ...entry, type: timetableType }));

      // Import timetable entries in batches
      const batchSize = 100;
      for (let i = 0; i < timetableEntries.length; i += batchSize) {
        const batch = timetableEntries.slice(i, i + batchSize);
        const { error: timetableError } = await supabase
          .from('master_timetables')
          .insert(batch);

        if (timetableError) {
            handleImportError(timetableError, 'timetable entries');
            return;
        }

        setProgress(`Imported ${Math.min(i + batchSize, timetableEntries.length)} of ${timetableEntries.length} timetable entries...`);
      }

      setResults({
        units: unitsArray.length,
        timetables: timetableEntries.length,
        parser: parseResult.parserUsed || 'Unknown'
      });

      toast.success(`${isExam ? 'Exam timetable' : 'Timetable'} imported successfully!`);
      
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : `Failed to import ${isExam ? 'exam timetable' : 'timetable'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImportError = (error: any, type: string) => {
    console.error(`${type} import error:`, error);
    const msg = error.message?.toLowerCase?.() || '';
    if (msg.includes('row-level') || msg.includes('rls') || msg.includes('permission')) {
      toast.error(`Import blocked by permissions. Admin access required to import ${type}.`);
    } else {
      toast.error(`Failed to import ${type}: ${error.message}`);
    }
    setImporting(false);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isExam: boolean) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file, isExam);
    }
  };
  
  const handleDownloadTemplate = (formatName: string) => {
    TimetableParser.downloadTemplate(formatName);
    toast.success('Template downloaded');
  };
  
  const availableParsers = TimetableParser.getAvailableParsers();

  return (
    <AdminGuard>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Timetable Import Tool</h1>
          <p className="text-muted-foreground">Import timetable data for Kaimosi Friends University</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Select university and academic period for the timetable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <UniversitySelector
                  value={selectedUniversity}
                  onValueChange={setSelectedUniversity}
                  placeholder="Select university"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger id="semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger id="year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3].map(offset => {
                      const y = new Date().getFullYear() + offset;
                      return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Timetable File</CardTitle>
            <CardDescription>
              The system will automatically detect and parse the timetable format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                onChange={(e) => handleFileUpload(e, false)}
                disabled={importing}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button disabled={importing} asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? "Importing..." : "Upload Class Timetable"}
                  </span>
                </Button>
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                onChange={(e) => handleFileUpload(e, true)}
                disabled={importing}
                className="hidden"
                id="exam-file-upload"
              />
              <label htmlFor="exam-file-upload">
                <Button disabled={importing} asChild variant="outline">
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? "Importing..." : "Upload Exam Timetable"}
                  </span>
                </Button>
              </label>
            </div>

            {progress && (
              <div className="p-4 bg-primary/10 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm whitespace-pre-wrap">{progress}</p>
              </div>
            )}

            {results && (
              <div className="p-4 bg-green-500/10 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Import Completed Successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Parser used: {results.parser}
                  </p>
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
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Supported Formats & Templates
            </CardTitle>
            <CardDescription>
              The system intelligently detects these timetable formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableParsers.map((parser, index) => (
              <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{parser.name}</p>
                  <p className="text-sm text-muted-foreground">{parser.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(parser.name)}
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            ))}\
            
            <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works:</p>
              <p>1. Select your university and academic period</p>
              <p>2. Upload your timetable file (Excel format)</p>
              <p>3. The system automatically detects the format and parses it</p>
              <p>4. Units are created/updated, then timetable entries are added</p>
              <p>5. Duplicate entries are handled automatically</p>
            </div>
          </CardContent>
        </Card>
      </div>
      </AppLayout>
    </AdminGuard>
  );
}
