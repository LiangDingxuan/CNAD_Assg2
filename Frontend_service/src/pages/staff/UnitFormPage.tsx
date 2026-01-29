import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as accountService from '@/services/accountService';
import { StaffHeader } from '@/components/staff/StaffHeader';

export default function UnitFormPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(unitId);

  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [block, setBlock] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!unitId) return;

    const fetchUnit = async () => {
      try {
        const units = await accountService.listUnits();
        const unit = units.find(u => u.id === unitId);
        if (unit) {
          setUnitNumber(unit.unitNumber);
          setFloor(unit.floor?.toString() ?? '');
          setBlock(unit.block ?? '');
          setIsActive(unit.isActive);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load unit');
      } finally {
        setLoading(false);
      }
    };
    fetchUnit();
  }, [unitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      toast.error('Unit number is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        unitNumber: unitNumber.trim(),
        floor: floor ? Number(floor) : undefined,
        block: block.trim() || undefined,
        ...(isEdit && { isActive }),
      };

      if (isEdit && unitId) {
        await accountService.updateUnit(unitId, payload);
        toast.success('Unit updated');
      } else {
        await accountService.createUnit(payload);
        toast.success('Unit created');
      }
      navigate('/staff/units');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save unit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StaffHeader />
        <main className="container mx-auto px-4 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Unit' : 'New Unit'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Unit Number *</Label>
                <Input
                  id="unitNumber"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g., #12-345"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g., 12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Input
                  id="block"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder="e.g., A"
                />
              </div>

              {isEdit && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/staff/units')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
