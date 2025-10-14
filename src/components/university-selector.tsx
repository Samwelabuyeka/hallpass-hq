import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
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

interface University {
  id: string
  name: string
  code: string
  country: string
  logo_url: string | null
}

interface UniversitySelectorProps {
  value?: string
  onValueChange: (universityId: string) => void
  placeholder?: string
}

export function UniversitySelector({ value, onValueChange, placeholder = "Select university..." }: UniversitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUniversities()
  }, [])

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, code, country, logo_url')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setUniversities(data || [])
    } catch (error) {
      console.error('Error fetching universities:', error)
      toast({
        title: "Error",
        description: "Failed to load universities",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUniversity = universities.find(uni => uni.id === value)

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
          {selectedUniversity ? (
            <div className="flex items-center gap-2">
              {selectedUniversity.logo_url && (
                <img 
                  src={selectedUniversity.logo_url} 
                  alt={selectedUniversity.name}
                  className="w-5 h-5 rounded-sm object-cover"
                />
              )}
              <span>{selectedUniversity.name}</span>
              <span className="text-muted-foreground text-sm">({selectedUniversity.code})</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search universities..." />
          <CommandList>
            <CommandEmpty>No university found.</CommandEmpty>
            <CommandGroup>
              {universities.map((university) => (
                <CommandItem
                  key={university.id}
                  value={`${university.name} ${university.code} ${university.country}`}
                  onSelect={() => {
                    onValueChange(university.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {university.logo_url && (
                      <img 
                        src={university.logo_url} 
                        alt={university.name}
                        className="w-5 h-5 rounded-sm object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <span>{university.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {university.code} • {university.country}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === university.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}