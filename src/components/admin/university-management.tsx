import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Pencil, Trash2, Globe } from "lucide-react"

interface University {
  id: string
  name: string
  code: string
  country: string
  logo_url?: string
  is_active: boolean
  created_at: string
}

export function UniversityManagement() {
  const { toast } = useToast()
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [country, setCountry] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name')

      if (error) throw error
      setUniversities(data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
      toast({
        title: "Error",
        description: "Failed to load universities",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !code || !country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingUniversity) {
        // Update existing university
        const { error } = await supabase
          .from('universities')
          .update({
            name,
            code: code.toUpperCase(),
            country,
            logo_url: logoUrl || null,
            is_active: isActive,
          })
          .eq('id', editingUniversity.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "University updated successfully",
        })
      } else {
        // Create new university
        const { error } = await supabase
          .from('universities')
          .insert({
            name,
            code: code.toUpperCase(),
            country,
            logo_url: logoUrl || null,
            is_active: isActive,
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "University created successfully",
        })
      }

      resetForm()
      setDialogOpen(false)
      loadUniversities()
    } catch (error: any) {
      console.error('Error saving university:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save university",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (university: University) => {
    setEditingUniversity(university)
    setName(university.name)
    setCode(university.code)
    setCountry(university.country)
    setLogoUrl(university.logo_url || "")
    setIsActive(university.is_active)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this university? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "University deleted successfully",
      })

      loadUniversities()
    } catch (error: any) {
      console.error('Error deleting university:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete university",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('universities')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: `University ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      })

      loadUniversities()
    } catch (error) {
      console.error('Error toggling university status:', error)
      toast({
        title: "Error",
        description: "Failed to update university status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setName("")
    setCode("")
    setCountry("")
    setLogoUrl("")
    setIsActive(true)
    setEditingUniversity(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              University Management
            </CardTitle>
            <CardDescription>
              Manage university information and settings
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUniversity ? 'Edit University' : 'Add New University'}
                </DialogTitle>
                <DialogDescription>
                  {editingUniversity
                    ? 'Update the university information below'
                    : 'Enter the details for the new university'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">University Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Kenyatta University"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">University Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., KU"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., Kenya"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="logo">Logo URL (optional)</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUniversity ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {universities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No universities found</p>
                  </TableCell>
                </TableRow>
              ) : (
                universities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {university.logo_url ? (
                          <img
                            src={university.logo_url}
                            alt={university.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4" />
                          </div>
                        )}
                        {university.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{university.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {university.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={university.is_active}
                          onCheckedChange={() => toggleActive(university.id, university.is_active)}
                        />
                        <Badge variant={university.is_active ? "default" : "secondary"}>
                          {university.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(university)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(university.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
