
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Unit {
  code: string;
  name: string;
}

export function UnitSelection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, combination } = location.state || {};

  const [units, setUnits] = useState<Unit[]>([{ code: '', name: '' }]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user || !courseId) {
      toast.error('Invalid Access', { description: 'This page was accessed incorrectly.' });
      navigate('/registration');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('year, semester')
        .eq('user_id', user.id)
        .single();
      if (error) {
        toast.error('Error fetching profile');
        navigate('/dashboard');
      } else {
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, [user, courseId, navigate]);

  const handleUnitChange = (index: number, field: keyof Unit, value: string) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const addUnit = () => {
    setUnits([...units, { code: '', name: '' }]);
  };

  const removeUnit = (index: number) => {
    const newUnits = units.filter((_, i) => i !== index);
    setUnits(newUnits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !courseId) return;

    const validUnits = units.filter(u => u.code.trim() && u.name.trim());
    if (validUnits.length === 0) {
      toast.error('No units provided', { description: 'Please add at least one unit.' });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the new unit set
      const { data: unitSet, error: unitSetError } = await supabase
        .from('course_unit_sets')
        .insert({
          course_id: courseId,
          combination,
          year: userProfile.year,
          semester: userProfile.semester,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (unitSetError) throw unitSetError;
      const unitSetId = unitSet.id;

      // Step 2: Add the units to this new set
      const unitSetUnits = validUnits.map(u => ({
        unit_set_id: unitSetId,
        unit_code: u.code.trim(),
        unit_name: u.name.trim(),
      }));

      const { error: unitsInsertError } = await supabase.from('course_unit_set_units').insert(unitSetUnits);
      if (unitsInsertError) throw unitsInsertError;

      // Step 3: Enroll the current student in these units
      const studentUnits = validUnits.map(u => ({
        user_id: user.id,
        unit_code: u.code.trim(),
        unit_name: u.name.trim(),
        is_active: true,
        semester: userProfile.semester,
        year: userProfile.year,
      }));

      const { error: studentUnitsError } = await supabase.from('student_units').insert(studentUnits);
      if (studentUnitsError) throw studentUnitsError;

      toast.success('Units Saved!', { description: `You have been enrolled in ${validUnits.length} units. Others in your course will thank you!` });
      navigate('/dashboard');

    } catch (error: any) {
      toast.error('Submission Failed', { description: error.message || 'An unexpected error occurred.' });
      console.error('Unit submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Define Course Units</CardTitle>
          <CardDescription>
            You're the first for your course! Please enter the units for your course and combination.
            This will be used to automatically enroll other students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {units.map((unit, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-grow grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`unit-code-${index}`}>Unit Code</Label>
                    <Input
                      id={`unit-code-${index}`}
                      value={unit.code}
                      onChange={e => handleUnitChange(index, 'code', e.target.value)}
                      placeholder="e.g., COS101"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unit-name-${index}`}>Unit Name</Label>
                    <Input
                      id={`unit-name-${index}`}
                      value={unit.name}
                      onChange={e => handleUnitChange(index, 'name', e.target.value)}
                      placeholder="e.g., Introduction to Computing"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeUnit(index)}
                  disabled={units.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}

            <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={addUnit}>
                    Add Another Unit
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save and Complete Registration'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
