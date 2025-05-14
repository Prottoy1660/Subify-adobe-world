'use client';

import React, { useState, useMemo, useEffect, useActionState } from 'react';
import type { Submission, SubmissionStatus, User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, CheckCircle2, XCircle, Search, Edit3, Clock, Info, Loader2, Filter, CalendarClock, AlertOctagon, FileSearch, Trash2, BarChart3, Download, Upload, RefreshCw } from 'lucide-react';
import { updateSubmission, updateSubmissionProfileName } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useFormStatus } from 'react-dom';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { deleteUserAccount } from '@/lib/data-service';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AdminDashboardClientProps {
  submissions: Submission[];
  resellers: User[];
}

interface ProfileNameFormState {
  message: string;
  errors?: Record<string, string[]>;
  submission?: Submission | null;
}

const initialProfileNameFormState: ProfileNameFormState = {
  message: '',
  errors: {},
  submission: null
};

export function AdminDashboardClient({ submissions: initialSubmissions, resellers }: AdminDashboardClientProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [resellerFilter, setResellerFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ email: string; name?: string; id: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isProfileNameDialogOpen, setIsProfileNameDialogOpen] = useState(false);
  const [currentSubmissionForProfileName, setCurrentSubmissionForProfileName] = useState<Submission | null>(null);
  const [profileNameFormState, profileNameFormAction] = useActionState<ProfileNameFormState>(
    updateSubmissionProfileName,
    initialProfileNameFormState
  );
  const [profileNameInput, setProfileNameInput] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  useEffect(() => {
    if (profileNameFormState?.message) {
      toast({
        title: profileNameFormState.errors ? 'Error' : 'Success',
        description: profileNameFormState.message,
        variant: profileNameFormState.errors ? 'destructive' : 'default',
      });
      if (!profileNameFormState.errors && profileNameFormState.submission) {
        setSubmissions(prev =>
          prev.map(sub => sub.id === profileNameFormState.submission!.id ? profileNameFormState.submission! : sub)
        );
        setIsProfileNameDialogOpen(false);
        setCurrentSubmissionForProfileName(null);
        setProfileNameInput('');
      }
    }
  }, [profileNameFormState, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
      toast({
        title: "Refreshed",
        description: "Dashboard data has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusUpdate = async (submissionId: string, newStatus: SubmissionStatus) => {
    console.log(`Attempting to update submission with ID: ${submissionId} to status: ${newStatus}`);
    const originalSubmission = submissions.find(sub => sub.id === submissionId);
    if (!originalSubmission) {
      console.error(`Submission with ID ${submissionId} not found in local state.`);
      return;
    }

    const optimisticSubmissions = submissions.map(sub =>
      sub.id === submissionId ? { ...sub, status: newStatus, updatedAt: new Date().toISOString() } : sub
    );
    setSubmissions(optimisticSubmissions);
    setIsLoading(prev => ({ ...prev, [submissionId]: true }));

    try {
      const result = await updateSubmission(submissionId, newStatus);

      if (result.submission) {
        setSubmissions(prev =>
          prev.map(sub => (sub.id === submissionId ? result.submission! : sub))
        );
        toast({
          title: 'Success',
          description: result.message,
          variant: 'default',
        });
      } else {
        console.error(`Failed to update submission with ID ${submissionId}: ${result.message}`);
        setSubmissions(prev => prev.map(sub => sub.id === submissionId ? originalSubmission : sub));
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error updating submission with ID ${submissionId}:`, error);
      setSubmissions(prev => prev.map(sub => sub.id === submissionId ? originalSubmission : sub));
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const openProfileNameDialog = (submission: Submission) => {
    setCurrentSubmissionForProfileName(submission);
    setProfileNameInput(submission.profileName || '');
    setIsProfileNameDialogOpen(true);
  };

  const handleDeleteClick = (submission: Submission) => {
    setAccountToDelete({ 
      email: submission.customerEmail,
      name: submission.profileName,
      id: submission._id?.toString() || submission.id
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    try {
      setIsDeleting(accountToDelete.email);
      console.log('Attempting to delete account:', accountToDelete);
      
      const success = await deleteUserAccount(accountToDelete.id);
      console.log('Delete result:', success);
      
      if (success) {
        setSubmissions(prev => prev.filter(s => s.id !== accountToDelete.id));
        
        toast({
          title: "Account Deleted",
          description: `Account for ${accountToDelete.email} has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete account - operation returned false');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleProfileNameSubmit = async (formData: FormData) => {
    await profileNameFormAction(formData);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const searchMatch = sub.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.resellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.profileName && sub.profileName.toLowerCase().includes(searchTerm.toLowerCase()));
      const statusMatch = statusFilter === 'all' || sub.status === statusFilter;
      const resellerMatch = resellerFilter === 'all' || sub.resellerId === resellerFilter;
      return searchMatch && statusMatch && resellerMatch;
    }).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [submissions, searchTerm, statusFilter, resellerFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const successful = submissions.filter(s => s.status === 'Successful').length;
    const pending = submissions.filter(s => s.status === 'Pending').length;
    const canceled = submissions.filter(s => s.status === 'Canceled').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total,
      successful,
      pending,
      canceled,
      successRate
    };
  }, [submissions]);

  if (initialSubmissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <Image src="https://picsum.photos/seed/emptyadmin/300/200" alt="No submissions" width={300} height={200} className="rounded-lg mb-8 opacity-70 shadow-lg" />
        <h2 className="text-2xl font-semibold mb-2">No Submissions Yet</h2>
        <p className="text-muted-foreground">When resellers submit customer data, it will appear here for management.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-gradient">
            Adobe Account Management
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="transition-all duration-500 hover:scale-110 hover:rotate-180 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="group animate-in fade-in slide-in-from-left duration-700 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-background hover:to-primary/5 hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Total Submissions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground animate-pulse group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 group-hover:text-primary transition-colors duration-300">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 group-hover:text-primary/80">
                {stats.successful} successful, {stats.pending} pending
              </p>
            </CardContent>
          </Card>

          <Card className="group animate-in fade-in slide-in-from-bottom duration-700 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-background hover:to-primary/5 hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500 animate-bounce-slow group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 group-hover:text-primary transition-colors duration-300">
                {stats.successRate.toFixed(1)}%
              </div>
              <Progress 
                value={stats.successRate} 
                className="h-2 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 group-hover:bg-primary/20 transition-colors duration-300 group-hover:scale-105" 
              />
            </CardContent>
          </Card>

          <Card className="group animate-in fade-in slide-in-from-bottom duration-700 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-background hover:to-primary/5 hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Pending Submissions</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500 animate-spin-slow group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 group-hover:text-primary transition-colors duration-300">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 group-hover:text-primary/80">
                {((stats.pending / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="group animate-in fade-in slide-in-from-right duration-700 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-background hover:to-primary/5 hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Canceled Submissions</CardTitle>
              <XCircle className="h-4 w-4 text-red-500 animate-pulse-slow group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 group-hover:text-primary transition-colors duration-300">
                {stats.canceled}
              </div>
              <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 group-hover:text-primary/80">
                {((stats.canceled / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-end p-4 border rounded-lg shadow-sm bg-card animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 hover:shadow-md transition-all duration-500 hover:bg-gradient-to-br hover:from-background hover:to-primary/5 hover:shadow-primary/10">
          <div className="group">
            <Label htmlFor="search" className="group-hover:text-primary transition-colors duration-300">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              <Input
                id="search"
                type="search"
                placeholder="Search email, reseller, profile..."
                className="pl-8 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="group">
            <Label htmlFor="status-filter" className="group-hover:text-primary transition-colors duration-300">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}>
              <SelectTrigger id="status-filter" className="transition-all duration-300 group-hover:border-primary/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Successful">Successful</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="group">
            <Label htmlFor="reseller-filter" className="group-hover:text-primary transition-colors duration-300">Reseller</Label>
            <Select value={resellerFilter} onValueChange={(value) => setResellerFilter(value)}>
              <SelectTrigger id="reseller-filter" className="transition-all duration-300 group-hover:border-primary/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Filter by reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resellers</SelectItem>
                {resellers.map(reseller => (
                  <SelectItem key={reseller.id} value={reseller.id}>{reseller.name || reseller.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border shadow-sm overflow-hidden animate-in fade-in duration-700 delay-200 hover:shadow-lg transition-all duration-500">
          <Table>
            <TableHeader>
              <TableRow className="animate-in fade-in slide-in-from-top-2 duration-700">
                <TableHead>Customer Email</TableHead>
                <TableHead>Profile Name</TableHead>
                <TableHead>Reseller</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Plan ID</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Info</TableHead>
                <TableHead className="text-center">Renewal (%)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length > 0 ? filteredSubmissions.map((sub, index) => {
                const reseller = resellers.find(r => r.id === sub.resellerId);
                const resellerDisplay = reseller
                  ? `${reseller.name || reseller.email} (${reseller.email})`
                  : sub.resellerName;
                return (
                  <TableRow 
                    key={sub.id} 
                    className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:bg-muted/30"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <TableCell className="font-medium">{sub.customerEmail}</TableCell>
                    <TableCell>{sub.profileName || <span className="text-xs text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{resellerDisplay}</TableCell>
                    <TableCell>{formatDate(sub.requestDate)}</TableCell>
                    <TableCell>{sub.requestedPlanId}</TableCell>
                    <TableCell>{sub.durationMonths}m</TableCell>
                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                    <TableCell>
                      <ExpiryDisplay endDate={sub.endDate} status={sub.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <RenewalProgress submission={sub} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading[sub.id]}>
                              {isLoading[sub.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="animate-in fade-in zoom-in-95 duration-150">
                            <DropdownMenuLabel>Manage Status</DropdownMenuLabel>
                            {sub.status !== 'Successful' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'Successful')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
                              </DropdownMenuItem>
                            )}
                            {sub.status !== 'Canceled' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'Canceled')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                              </DropdownMenuItem>
                            )}
                            {sub.status !== 'Pending' && (sub.status === 'Successful' || sub.status === 'Canceled') && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(sub.id, 'Pending')}>
                                <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Mark as Pending
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Other Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openProfileNameDialog(sub)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile Name
                            </DropdownMenuItem>
                            {reseller && (
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/resellers/${reseller.id}`}>
                                  <Info className="mr-2 h-4 w-4" /> View Reseller Profile
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(sub)}
                              disabled={isDeleting === sub.customerEmail}
                            >
                              {isDeleting === sub.customerEmail ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Account</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <TableCell colSpan={10} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <FileSearch className="w-12 h-12 opacity-50 animate-bounce-slow" />
                      <p className="text-lg animate-in fade-in slide-in-from-bottom-2 duration-500">No submissions match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredSubmissions.length === 0 && submissions.length > 0 && (
          <Alert className="animate-in fade-in duration-300">
            <Filter className="h-4 w-4" />
            <AlertTitle>No Results</AlertTitle>
            <AlertDescription>
              No submissions match your current filter criteria. Try adjusting your search or filters.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Name Dialog */}
        {currentSubmissionForProfileName && (
          <Dialog open={isProfileNameDialogOpen} onOpenChange={setIsProfileNameDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Profile Name</DialogTitle>
                <DialogDescription>
                  Update profile name for {currentSubmissionForProfileName.customerEmail}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProfileNameSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profileName">Profile Name</Label>
                    <Input
                      id="profileName"
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      placeholder="Enter profile name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Account Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <DialogDescription>
                Are you sure you want to delete the account for {accountToDelete?.email}?
                {accountToDelete?.name && ` (${accountToDelete.name})`}
              </DialogDescription>
              <DialogDescription>
                This action cannot be undone and will:
              </DialogDescription>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Delete the user account</li>
                <li>Remove all associated submissions</li>
                <li>Delete all related data</li>
              </ul>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setAccountToDelete(null);
                }}
                disabled={isDeleting === accountToDelete?.email}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting === accountToDelete?.email}
              >
                {isDeleting === accountToDelete?.email ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function ExpiryDisplay({ endDate, status }: { endDate?: string; status: SubmissionStatus }) {
  if (!endDate || status !== 'Successful') return <span className="text-muted-foreground">N/A</span>;

  const end = parseISO(endDate);
  const now = new Date();
  const daysLeft = differenceInDays(end, now);
  const hoursLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60)) % 24;
  const minutesLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60)) % 60;

  if (daysLeft < 0) {
    return (
      <div className="flex items-center gap-2 text-red-500 animate-pulse">
        <AlertOctagon className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="font-medium">Expired</span>
          <span className="text-xs opacity-75">Expired on {format(end, 'MMM dd, yyyy hh:mm a')}</span>
        </div>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div className="flex items-center gap-2 text-yellow-500">
        <CalendarClock className="h-4 w-4 animate-bounce" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-medium">{daysLeft}</span>
            <span className="text-xs opacity-75">days</span>
            <span className="font-medium">{hoursLeft}</span>
            <span className="text-xs opacity-75">hours</span>
            <span className="font-medium">{minutesLeft}</span>
            <span className="text-xs opacity-75">min</span>
          </div>
          <span className="text-xs opacity-75">Expires {format(end, 'MMM dd, yyyy hh:mm a')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-500">
      <CalendarClock className="h-4 w-4" />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-medium">{daysLeft}</span>
          <span className="text-xs opacity-75">days</span>
          <span className="font-medium">{hoursLeft}</span>
          <span className="text-xs opacity-75">hours</span>
          <span className="font-medium">{minutesLeft}</span>
          <span className="text-xs opacity-75">min</span>
        </div>
        <span className="text-xs opacity-75">Expires {format(end, 'MMM dd, yyyy hh:mm a')}</span>
      </div>
    </div>
  );
}

function RenewalProgress({ submission }: { submission: Submission }) {
  if (!submission.endDate || submission.status !== 'Successful') {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const end = parseISO(submission.endDate);
  const start = parseISO(submission.requestDate);
  const now = new Date();

  const totalDuration = differenceInDays(end, start);
  const elapsed = differenceInDays(now, start);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16">
        <Progress 
          value={progress} 
          className={`h-2 transition-all duration-500 ${getProgressColor(progress)}`}
        />
      </div>
      <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
    </div>
  );
}

