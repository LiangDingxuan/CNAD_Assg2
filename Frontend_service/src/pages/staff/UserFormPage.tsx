import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as accountService from '@/services/accountService';
import type { Unit, User } from '@/types/account';
import { StaffHeader } from '@/components/staff/StaffHeader';

export default function UserFormPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(userId);

  const [units, setUnits] = useState<Unit[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'resident'>('staff');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [unitId, setUnitId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingUser, setExistingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const unitsData = await accountService.listUnits({ isActive: true });
        setUnits(unitsData);

        if (userId) {
          const user = await accountService.getUser(userId);
          setExistingUser(user);
          setUsername(user.username);
          setEmail(user.email ?? '');
          setRole(user.role);
          setUnitId(user.unitId ?? '');
          setIsActive(user.isActive);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!isEdit && !password) {
      toast.error('Password is required');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && userId) {
        const payload: Record<string, unknown> = {};
        if (username !== existingUser?.username) payload.username = username.trim();
        if (email !== (existingUser?.email ?? '')) payload.email = email.trim() || undefined;
        if (password) payload.password = password;
        if (pin && role === 'resident') payload.pin = pin;
        if (unitId !== (existingUser?.unitId ?? '')) payload.unitId = unitId || undefined;
        if (isActive !== existingUser?.isActive) payload.isActive = isActive;

        await accountService.updateUser(userId, payload);
        toast.success('User updated');
      } else {
        await accountService.createStaffOrAdmin({
          username: username.trim(),
          email: email.trim() || undefined,
          password,
          role: 'admin',
        });
        toast.success('User created');
      }
      navigate('/staff/users');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
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
            <CardTitle>{isEdit ? 'Edit User' : 'New User'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., john_doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., john@example.com"
                />
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isEdit && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <p className="text-sm text-muted-foreground capitalize">{role}</p>
                </div>
              )}

              {role !== 'resident' && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {isEdit ? '(leave blank to keep)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEdit}
                  />
                </div>
              )}

              {isEdit && role === 'resident' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN (4 digits) (leave blank to keep)</Label>
                    <Input
                      id="pin"
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit *</Label>
                    <Select value={unitId} onValueChange={setUnitId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {isEdit && role !== 'resident' && (
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit (optional)</Label>
                  <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No unit</SelectItem>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unitNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Button type="button" variant="outline" onClick={() => navigate('/staff/users')}>
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
