import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as accountService from '@/services/accountService';
import type { Unit, User, TabletSession } from '@/types/account';
import { StaffHeader } from '@/components/staff/StaffHeader';

export default function UnitDetailPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [tablet, setTablet] = useState<TabletSession | null>(null);
  const [residents, setResidents] = useState<User[]>([]);
  const [availableResidents, setAvailableResidents] = useState<User[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newResidentUsername, setNewResidentUsername] = useState('');
  const [newResidentPin, setNewResidentPin] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    if (!unitId) return;

    try {
      const [unitData, allUsers, allTablets] = await Promise.all([
        accountService.getUnit(unitId),
        accountService.listUsers({ unitId, role: 'resident' }),
        accountService.listTablets(),
      ]);

      setUnit(unitData);
      setResidents(allUsers);

      const unitTablet = allTablets.find(t => t.unitId === unitId);
      setTablet(unitTablet || null);

      const loggedInIds = unitTablet?.loggedInUsers.map(u => u.id) || [];
      const available = allUsers.filter(u => !loggedInIds.includes(u.id));
      setAvailableResidents(available);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load unit details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const handleCopySecret = async () => {
    if (!tablet?.deviceSecret) return;
    await navigator.clipboard.writeText(tablet.deviceSecret);
    setCopied(true);
    toast.success('Device secret copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddResident = async () => {
    if (!selectedResidentId || !tablet) return;

    try {
      await accountService.loginResident(tablet.tabletId, selectedResidentId);
      toast.success('Resident added to tablet');
      setAddDialogOpen(false);
      setSelectedResidentId('');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add resident');
    }
  };

  const handleRemoveResident = async (userId: string) => {
    if (!tablet) return;

    try {
      await accountService.logoutResident(tablet.tabletId, userId);
      toast.success('Resident removed from tablet');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove resident');
    }
  };

  const handleDeleteResident = async (userId: string) => {
    try {
      await accountService.deleteUser(userId);
      toast.success('Resident deleted');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resident');
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unit?.id || !tablet) {
      toast.error('Unit or tablet not found');
      return;
    }

    if (newResidentPin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    setIsCreating(true);
    try {
      const newUser = await accountService.createUser({
        username: newResidentUsername.trim(),
        pin: newResidentPin,
        role: 'resident',
        unitId: unit.id
      });

      await accountService.loginResident(tablet.tabletId, newUser.id);

      toast.success(`Resident ${newUser.username} created and added to tablet`);
      setNewResidentUsername('');
      setNewResidentPin('');
      setCreateDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create resident');
    } finally {
      setIsCreating(false);
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

  if (!unit) {
    return (
      <div className="min-h-screen bg-background">
        <StaffHeader />
        <main className="container mx-auto px-4 py-6">
          <p className="text-muted-foreground">Unit not found</p>
        </main>
      </div>
    );
  }

  const loggedInUserIds = tablet?.loggedInUsers.map(u => u.id) || [];
  const canAddResident = loggedInUserIds.length < 2;

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/staff/units')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Units
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Unit Information</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/staff/units/${unit.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Unit
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit Number</p>
                <p className="font-medium">{unit.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Floor</p>
                <p className="font-medium">{unit.floor ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Block</p>
                <p className="font-medium">{unit.block ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                  {unit.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tablet Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tablet ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Tablet ID</p>
                    <p className="font-mono text-sm">{tablet.tabletId}</p>
                  </div>
                  <Alert>
                    <AlertTitle>Device Secret</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Store this secret securely on the tablet device.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">
                          {tablet.deviceSecret || 'Not available'}
                        </code>
                        <Button variant="outline" size="sm" onClick={handleCopySecret}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No tablet registered for this unit</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Residents ({residents.length})</CardTitle>
              <div className="flex gap-2">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={!canAddResident || availableResidents.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Existing
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Resident to Tablet</DialogTitle>
                    <DialogDescription>
                      Select a resident to log into the tablet. Maximum 2 residents per tablet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resident</label>
                      <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resident" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableResidents.map(resident => (
                            <SelectItem key={resident.id} value={resident.id}>
                              {resident.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddResident} disabled={!selectedResidentId}>
                        Add
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canAddResident || !unit}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Resident</DialogTitle>
                    <DialogDescription>
                      Create a new resident account and add them to this tablet.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateResident} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username *</Label>
                      <Input
                        id="new-username"
                        value={newResidentUsername}
                        onChange={(e) => setNewResidentUsername(e.target.value)}
                        placeholder="e.g., john_doe"
                        required
                        disabled={isCreating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-pin">PIN (4 digits) *</Label>
                      <Input
                        id="new-pin"
                        type="password"
                        maxLength={4}
                        value={newResidentPin}
                        onChange={(e) => setNewResidentPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        required
                        disabled={isCreating}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be exactly 4 numeric digits
                      </p>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create & Add to Tablet'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            </CardHeader>
            <CardContent>
              {residents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No residents assigned to this unit</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Tablet Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.map((resident) => {
                      const isLoggedIn = loggedInUserIds.includes(resident.id);
                      return (
                        <TableRow key={resident.id}>
                          <TableCell className="font-medium">{resident.username}</TableCell>
                          <TableCell>
                            <Badge variant={isLoggedIn ? 'default' : 'secondary'}>
                              {isLoggedIn ? 'Logged In' : 'Not Logged In'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={resident.isActive ? 'default' : 'secondary'}>
                              {resident.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/staff/users/${resident.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            {isLoggedIn && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveResident(resident.id)}
                              >
                                <span className="text-xs">Logout</span>
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Resident?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {resident.username}. They must be logged out first.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteResident(resident.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
