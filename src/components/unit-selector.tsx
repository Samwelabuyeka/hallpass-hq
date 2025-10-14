import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  id: string
  unit_code: string
  unit_name: string
  department: string | null
  semester: number
  year: number
  credits: number | null
}

interface UnitSelectorProps {
  universityId: string
  semester: number
  year: number
  value?: string[]
  onValueChange: (units: string[]) => void
}

export function UnitSelector({ universityId, semester, year, value = [], onValueChange }: UnitSelectorProps) {
  const [open, setOpen] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUnits()
  }, [universityId, semester, year])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('master_units')
        .select('*')
        .eq('university_id', universityId)
        .eq('semester', semester)
        .eq('year', year)
        .order('unit_code')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {value.length > 0
            ? `${value.length} courses selected`
            : "Select courses..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search courses..." />
          <CommandList>
            <CommandEmpty>No course found.</CommandEmpty>
            <CommandGroup>
              {units.map((unit) => (
                <CommandItem
                  key={unit.id}
                  value={unit.unit_code}
                  onSelect={(currentValue) => {
                    const newValue = value.includes(currentValue)
                      ? value.filter((v) => v !== currentValue)
                      : [...value, currentValue]
                    onValueChange(newValue)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(unit.unit_code) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">{unit.unit_code}</div>
                    <div className="text-sm text-muted-foreground">{unit.unit_name}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
