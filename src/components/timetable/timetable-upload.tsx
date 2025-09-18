import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, X, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import * as XLSX from "xlsx"

interface TimetableUploadProps {
  universityId: string
  onUploadComplete?: () => void
}

interface ParsedEntry {
  unit_code: string
  unit_name: string
  type: 'lecture' | 'tutorial' | 'lab' | 'exam'
  day?: string
  time_start?: string
  time_end?: string
  exam_date?: string
  venue?: string
  lecturer?: string
  semester?: string
  year?: number
}

export function TimetableUpload({ universityId, onUploadComplete }: TimetableUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedEntry[]>([])
  const [fileName, setFileName] = useState("")
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      parseFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  const parseFile = async (file: File) => {
    setUploading(true)
    setProgress(20)
    
    try {
      const data = await file.arrayBuffer()
      setProgress(40)
      
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]
      
      setProgress(60)
      
      // Parse and validate data
      const parsedEntries: ParsedEntry[] = jsonData.map((row, index) => {
        // Handle different column name variations
        const getColumnValue = (variations: string[]) => {
          for (const variant of variations) {
            if (row[variant] !== undefined) return row[variant]
          }
          return undefined
        }

        const entry: ParsedEntry = {
          unit_code: getColumnValue(['unit_code', 'code', 'unit_code', 'subject_code']) || '',
          unit_name: getColumnValue(['unit_name', 'name', 'subject_name', 'unit_title']) || '',
          type: (getColumnValue(['type', 'class_type', 'session_type']) || 'lecture').toLowerCase() as any,
          day: getColumnValue(['day', 'day_of_week', 'weekday']),
          time_start: getColumnValue(['time_start', 'start_time', 'start']),
          time_end: getColumnValue(['time_end', 'end_time', 'end']),
          exam_date: getColumnValue(['exam_date', 'examination_date', 'exam_datetime']),
          venue: getColumnValue(['venue', 'room', 'location', 'classroom']),
          lecturer: getColumnValue(['lecturer', 'instructor', 'teacher', 'staff']),
          semester: getColumnValue(['semester', 'term']),
          year: parseInt(getColumnValue(['year']) || new Date().getFullYear().toString())
        }

        // Validate required fields
        if (!entry.unit_code || !entry.unit_name) {
          throw new Error(`Missing required fields in row ${index + 2}`)
        }

        return entry
      })
      
      setProgress(80)
      setParsedData(parsedEntries)
      setProgress(100)
      
      toast({
        title: "File parsed successfully",
        description: `Found ${parsedEntries.length} timetable entries`,
      })
    } catch (error: any) {
      console.error('Error parsing file:', error)
      toast({
        title: "Parsing failed",
        description: error.message || "Failed to parse the uploaded file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const uploadToDatabase = async () => {
    if (!parsedData.length) return
    
    setUploading(true)
    try {
      // First, create or get units
      const units = Array.from(new Map(
        parsedData.map(entry => [entry.unit_code, {
          code: entry.unit_code,
          name: entry.unit_name,
          semester: entry.semester,
          year: entry.year
        }])
      ).values())

      for (const unit of units) {
        await supabase
          .from('master_units')
          .upsert({
            university_id: universityId,
            code: unit.code,
            name: unit.name,
            semester: unit.semester,
            year: unit.year
          }, {
            onConflict: 'university_id,code'
          })
      }

      // Get unit IDs
      const { data: unitData } = await supabase
        .from('master_units')
        .select('id, code')
        .eq('university_id', universityId)
        .in('code', units.map(u => u.code))

      const unitMap = new Map(unitData?.map(u => [u.code, u.id]) || [])

      // Create timetable entries
      const timetableEntries = parsedData.map(entry => ({
        university_id: universityId,
        unit_id: unitMap.get(entry.unit_code),
        type: entry.type,
        day: entry.day,
        time_start: entry.time_start,
        time_end: entry.time_end,
        exam_date: entry.exam_date,
        venue: entry.venue,
        lecturer: entry.lecturer,
        semester: entry.semester,
        year: entry.year
      })).filter(entry => entry.unit_id)

      const { error } = await supabase
        .from('master_timetables')
        .insert(timetableEntries)

      if (error) throw error

      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${timetableEntries.length} timetable entries`,
      })

      setParsedData([])
      setFileName("")
      onUploadComplete?.()
    } catch (error: any) {
      console.error('Error uploading to database:', error)
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        unit_code: 'MATH101',
        unit_name: 'Calculus I',
        type: 'lecture',
        day: 'Monday',
        time_start: '09:00',
        time_end: '11:00',
        venue: 'Room A1',
        lecturer: 'Dr. Smith',
        semester: '1',
        year: 2024
      },
      {
        unit_code: 'MATH101',
        unit_name: 'Calculus I',
        type: 'exam',
        exam_date: '2024-06-15',
        venue: 'Exam Hall B',
        semester: '1',
        year: 2024
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'timetable_template.xlsx')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Timetable
          </CardTitle>
          <CardDescription>
            Upload Excel or CSV files containing timetable data for your university
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Download a sample file to see the expected format
            </span>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the file here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drag & drop a timetable file here
                </p>
                <p className="text-muted-foreground">
                  or click to select files
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </>
            )}
          </div>

          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {fileName && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">{fileName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFileName("")
                  setParsedData([])
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>
              Review the parsed data before uploading to database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {parsedData.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  <Badge variant="outline">{entry.unit_code}</Badge>
                  <span className="flex-1 text-sm">{entry.unit_name}</span>
                  <Badge className="text-xs">{entry.type}</Badge>
                  {entry.day && <span className="text-xs text-muted-foreground">{entry.day}</span>}
                  {entry.time_start && (
                    <span className="text-xs text-muted-foreground">
                      {entry.time_start} - {entry.time_end}
                    </span>
                  )}
                </div>
              ))}
              {parsedData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {parsedData.length - 10} more entries
                </p>
              )}
            </div>

            <Button onClick={uploadToDatabase} disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : `Upload ${parsedData.length} Entries`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}