import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import * as XLSX from 'xlsx'

interface TimetableEntry {
  unit_code: string
  unit_name: string
  day?: string
  time_start?: string
  time_end?: string
  venue?: string
  lecturer?: string
  exam_date?: string
  type: 'lecture' | 'exam'
}

interface UploadProps {
  universityId?: string
  onUploadComplete?: () => void
}

export function TimetableUpload({ universityId, onUploadComplete }: UploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [semester, setSemester] = useState<number>(1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)

  const parseExcelFile = async (file: File): Promise<TimetableEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)

          const entries: TimetableEntry[] = jsonData.map((row: any) => ({
            unit_code: row['Unit Code'] || row['Course Code'] || '',
            unit_name: row['Unit Name'] || row['Course Name'] || '',
            day: row['Day'],
            time_start: row['Start Time'],
            time_end: row['End Time'],
            venue: row['Venue'] || row['Room'],
            lecturer: row['Lecturer'] || row['Instructor'],
            exam_date: row['Exam Date'],
            type: row['Type']?.toLowerCase() === 'exam' ? 'exam' : 'lecture'
          }))

          resolve(entries.filter(e => e.unit_code && e.unit_name))
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !universityId) {
      toast({
        title: "Error",
        description: "Please select a university first",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)
    setUploadResult(null)

    try {
      const entries = await parseExcelFile(file)
      setProgress(30)

      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        
        try {
          // First ensure the unit exists in master_units
          const { error: unitError } = await supabase
            .from('master_units')
            .upsert({
              university_id: universityId,
              unit_code: entry.unit_code,
              unit_name: entry.unit_name,
              semester,
              year,
            }, {
              onConflict: 'university_id,unit_code,semester,year'
            })

          if (unitError) throw unitError

          // Then insert timetable entry
          const { error: timetableError } = await supabase
            .from('master_timetables')
            .insert({
              university_id: universityId,
              unit_code: entry.unit_code,
              unit_name: entry.unit_name,
              semester,
              year,
              type: entry.type,
              day: entry.day,
              time_start: entry.time_start,
              time_end: entry.time_end,
              venue: entry.venue,
              lecturer: entry.lecturer,
              exam_date: entry.exam_date,
            })

          if (timetableError) throw timetableError

          successCount++
        } catch (error) {
          console.error('Error uploading entry:', error)
          failedCount++
        }

        setProgress(30 + ((i + 1) / entries.length) * 70)
      }

      setUploadResult({ success: successCount, failed: failedCount })

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} entries. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? "destructive" : "default",
      })

      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error: any) {
      console.error('Error processing file:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process timetable file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Timetable
          </CardTitle>
          <CardDescription>
            Upload an Excel file containing course timetable data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester.toString()} onValueChange={(value) => setSemester(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2030}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timetable-file">Excel File</Label>
            <input
              id="timetable-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading || !universityId}
              className="hidden"
            />
            <Button asChild disabled={uploading || !universityId} className="w-full">
              <label htmlFor="timetable-file" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Choose File"}
              </label>
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {uploadResult && (
            <Card className={uploadResult.failed === 0 ? "border-green-500" : "border-orange-500"}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {uploadResult.failed === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <p className="font-medium">Upload Results</p>
                    <p className="text-sm text-muted-foreground">
                      Successfully uploaded: {uploadResult.success} entries
                    </p>
                    {uploadResult.failed > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Failed: {uploadResult.failed} entries
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Excel Format</CardTitle>
          <CardDescription>
            Your Excel file should contain the following columns:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Unit Code / Course Code</li>
              <li>Unit Name / Course Name</li>
              <li>Type (lecture/exam)</li>
            </ul>
            <p className="mt-4"><strong>Optional columns for lectures:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Day</li>
              <li>Start Time</li>
              <li>End Time</li>
              <li>Venue / Room</li>
              <li>Lecturer / Instructor</li>
            </ul>
            <p className="mt-4"><strong>Optional columns for exams:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Exam Date</li>
              <li>Start Time</li>
              <li>End Time</li>
              <li>Venue / Room</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
