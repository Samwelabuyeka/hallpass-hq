import { useState, useEffect } from "react"
import { Check, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  id: string
  code: string
  name: string
  department: string | null
  semester: string | null
  year: number | null
  credits: number | null
}

interface UnitSelectorProps {
  universityId: string
  selectedUnits: string[]
  onUnitsChange: (unitIds: string[]) => void
  semester?: string
  year?: number
}

export function UnitSelector({ 
  universityId, 
  selectedUnits, 
  onUnitsChange, 
  semester, 
  year 
}: UnitSelectorProps) {
  const [open, setOpen] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (universityId) {
      fetchUnits()
    }
  }, [universityId, semester, year])

  const fetchUnits = async () => {
    try {
      let query = supabase
        .from('master_units')
        .select('id, code, name, department, semester, year, credits')
        .eq('university_id', universityId)
        .order('code')

      if (semester) {
        query = query.eq('semester', semester)
      }
      if (year) {
        query = query.eq('year', year)
      }

      const { data, error } = await query

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
      toast({
        title: "Error",
        description: "Failed to load units",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnitToggle = (unitId: string) => {
    const newSelectedUnits = selectedUnits.includes(unitId)
      ? selectedUnits.filter(id => id !== unitId)
      : [...selectedUnits, unitId]
    
    onUnitsChange(newSelectedUnits)
  }

  const removeUnit = (unitId: string) => {
    onUnitsChange(selectedUnits.filter(id => id !== unitId))
  }

  const selectedUnitsData = units.filter(unit => selectedUnits.includes(unit.id))

  if (!universityId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a university first
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Units Display */}
      {selectedUnitsData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Units ({selectedUnitsData.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedUnitsData.map((unit) => (
              <Badge key={unit.id} variant="secondary" className="flex items-center gap-1">
                <span className="font-mono text-xs">{unit.code}</span>
                <span className="max-w-40 truncate">{unit.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeUnit(unit.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Unit Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Units
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <Command>
            <CommandInput placeholder="Search units..." />
            <CommandList>
              <CommandEmpty>No units found.</CommandEmpty>
              <CommandGroup>
                {units.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={`${unit.code} ${unit.name}`}
                    onSelect={() => handleUnitToggle(unit.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedUnits.includes(unit.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{unit.code}</span>
                          {unit.credits && (
                            <Badge variant="outline" className="text-xs">
                              {unit.credits} credits
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{unit.name}</span>
                        {unit.department && (
                          <span className="text-xs text-muted-foreground">{unit.department}</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}