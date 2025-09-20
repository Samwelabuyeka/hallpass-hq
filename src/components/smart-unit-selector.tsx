import { useState, useEffect, useCallback } from "react"
import { Check, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Unit {
  id: string
  unit_code: string
  unit_name: string
  department: string
  semester: number
  year: number
  credits: number
  similarity_score?: number
}

interface SmartUnitSelectorProps {
  universityId: string
  semester: number
  year: number
  selectedUnits: string[]
  onUnitsChange: (units: string[]) => void
}

export function SmartUnitSelector({
  universityId,
  semester,
  year,
  selectedUnits,
  onUnitsChange
}: SmartUnitSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const { toast } = useToast()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const searchUnits = useCallback(async (query: string) => {
    if (!universityId || !query.trim()) {
      setUnits([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('search_units_fuzzy', {
        search_term: query.trim(),
        university_id_param: universityId,
        semester_param: semester,
        year_param: year
      })

      if (error) {
        console.error('Error searching units:', error)
        toast({
          title: "Search Error",
          description: "Failed to search for units",
          variant: "destructive",
        })
        return
      }

      // Filter out units that are already selected and sort by similarity
      const filteredUnits = (data || [])
        .filter((unit: Unit) => !selectedUnits.includes(unit.unit_code))
        .sort((a: Unit, b: Unit) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .slice(0, 10) // Limit to top 10 results

      setUnits(filteredUnits)
    } catch (error) {
      console.error('Error searching units:', error)
      toast({
        title: "Search Error",
        description: "Failed to search for units",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [universityId, semester, year, selectedUnits, toast])

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchUnits(debouncedQuery)
    } else {
      setUnits([])
    }
  }, [debouncedQuery, searchUnits])

  const handleUnitSelect = (unitCode: string) => {
    if (!selectedUnits.includes(unitCode)) {
      onUnitsChange([...selectedUnits, unitCode])
      setSearchQuery("")
      setUnits([])
    }
  }

  const removeUnit = (unitCode: string) => {
    onUnitsChange(selectedUnits.filter(code => code !== unitCode))
  }

  // Get selected units data
  const [selectedUnitsData, setSelectedUnitsData] = useState<Unit[]>([])

  useEffect(() => {
    const fetchSelectedUnits = async () => {
      if (selectedUnits.length === 0) {
        setSelectedUnitsData([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('master_units')
          .select('*')
          .eq('university_id', universityId)
          .eq('semester', semester)
          .eq('year', year)
          .in('unit_code', selectedUnits)

        if (error) {
          console.error('Error fetching selected units:', error)
          return
        }

        setSelectedUnitsData(data || [])
      } catch (error) {
        console.error('Error fetching selected units:', error)
      }
    }

    fetchSelectedUnits()
  }, [selectedUnits, universityId, semester, year])

  if (!universityId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a university first
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Units */}
      {selectedUnitsData.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Units ({selectedUnitsData.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedUnitsData.map((unit) => (
              <Badge key={unit.unit_code} variant="secondary" className="text-sm">
                <span className="font-mono font-semibold">{unit.unit_code}</span>
                <span className="mx-2">•</span>
                <span>{unit.unit_name}</span>
                <span className="ml-2 text-xs opacity-70">({unit.credits} credits)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeUnit(unit.unit_code)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Smart Search */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Add Units</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                <span className="text-muted-foreground">
                  Search by unit code, name, or department...
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Type to search units... (e.g., CS101, Computer Science, Math)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <CommandList>
                <ScrollArea className="h-[300px]">
                  {loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : units.length === 0 && debouncedQuery.length >= 2 ? (
                    <CommandEmpty>
                      No units found for "{debouncedQuery}".
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Try different keywords like unit codes (CS101), subject names, or departments.
                      </span>
                    </CommandEmpty>
                  ) : units.length === 0 && debouncedQuery.length < 2 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search
                    </div>
                  ) : (
                    <CommandGroup>
                      {units.map((unit) => (
                        <CommandItem
                          key={unit.id}
                          value={unit.unit_code}
                          onSelect={() => {
                            handleUnitSelect(unit.unit_code)
                            setOpen(false)
                          }}
                          className="flex items-center justify-between p-3 cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-semibold text-primary">
                                {unit.unit_code}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({unit.credits} credits)
                              </span>
                              {unit.similarity_score && unit.similarity_score > 0.8 && (
                                <Badge variant="outline" className="text-xs">
                                  Best match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">{unit.unit_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {unit.department}
                            </p>
                          </div>
                          <Check
                            className={`ml-2 h-4 w-4 ${
                              selectedUnits.includes(unit.unit_code)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </ScrollArea>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-xs text-muted-foreground">
          💡 The search is smart - try typing unit codes (like "CS101"), course names (like "Computer Science"), 
          or even partial matches (like "math" for mathematics courses).
        </p>
      )}
    </div>
  )
}