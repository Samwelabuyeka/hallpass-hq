import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, Download, Info } from "lucide-react";
import { TimetableParser } from "@/utils/timetable-parsers";

interface University {
  id: string;
  name: string;
  code: string;
}

export default function TimetableImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<{ units: number; timetables: number; parser: string } | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [semester, setSemester] = useState<string>("1");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  
  // Load universities on mount
  useState(() => {
    loadUniversities();
  });
  
  const loadUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error loading universities:', error);
      toast.error('Failed to load universities');
      return;
    }
    
    setUniversities(data || []);
    if (data && data.length > 0) {
      setSelectedUniversity(data[0].id);
    }
  };

  const handleImport = async (file: File) => {
    if (!selectedUniversity) {
      toast.error('Please select a university');
      return;
    }
    
    setImporting(true);
    setProgress("Reading and analyzing file format...");
    
    try {
      // Use intelligent parser
      const parseResult = await TimetableParser.parseFile(
        file,
        parseInt(semester),
        parseInt(year),
        selectedUniversity
      );
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse timetable');
      }
      
      const { entries, units } = parseResult.data;
      
      setProgress(`✓ Detected format: ${parseResult.parserUsed}\nFound ${units.size} units and ${entries.length} timetable entries. Importing to database...`);

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
        timetables: entries.length,
        parser: parseResult.parserUsed || 'Unknown'
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
  
  const handleDownloadTemplate = (formatName: string) => {
    TimetableParser.downloadTemplate(formatName);
    toast.success('Template downloaded');
  };
  
  const availableParsers = TimetableParser.getAvailableParsers();

  return (
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
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger id="university">
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            ))}
            
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
  );
}
