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
import { formatDate } from '@/lib/utils'; // Updated import path
import { MoreHorizontal, CheckCircle2, XCircle, Search, Edit3, Clock, Info, Loader2, Filter, CalendarClock, AlertOctagon, FileSearch, Trash2 } from 'lucide-react'; // Updated icons
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


interface AdminDashboardClientProps {
  submissions: Submission[];
  resellers: User[];
}

const initialProfileNameFormState = { message: '', errors: {}, submission: undefined };

function ProfileNameSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Save Profile Name
    </Button>
  );
}

interface ExpiryInfo {
  text: string;
  icon?: React.ElementType;
  colorClass?: string;
  tooltipText: string;
}

const calculateExpiryDetails = (endDateString?: string, status?: SubmissionStatus): ExpiryInfo | null => {
  if (!endDateString || status !== 'Successful') return null;

  const endDate = parseISO(endDateString);
  if (!isValid(endDate)) return { text: 'Invalid Date', tooltipText: 'End date is invalid' };

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = differenceInDays(endDate, todayDateOnly);

  if (daysLeft < 0) {
    return { text: 'Expired', icon: AlertOctagon, colorClass: 'text-red-600 dark:text-red-500', tooltipText: `Expired on ${format(endDate, 'PP')}` };
  }
  if (daysLeft === 0) {
     return { text: 'Expires Today', icon: CalendarClock, colorClass: 'text-orange-600 dark:text-orange-500', tooltipText: `Expires today, ${format(endDate, 'PP')}` };
  }
  if (daysLeft > 0 && daysLeft <= 7) {
    return { text: `${daysLeft}d left`, icon: CalendarClock, colorClass: 'text-orange-600 dark:text-orange-500', tooltipText: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} on ${format(endDate, 'PP')}` };
  }
  return { text: formatDate(endDateString), tooltipText: `Expires on ${format(endDate, 'PP')}` };
};

interface ExpiryDisplayProps {
  endDate?: string;
  status?: SubmissionStatus;
}

function ExpiryDisplay({ endDate: endDateString, status }: ExpiryDisplayProps) {
  const [expiryDetails, setExpiryDetails] = useState<ExpiryInfo | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (isClient) { 
      setExpiryDetails(calculateExpiryDetails(endDateString, status));
    }
  }, [endDateString, status, isClient]);

  if (!isClient || !expiryDetails) { 
    // Provide a consistent fallback during SSR or before client-side calculation
    return <span className="text-xs text-muted-foreground">{!isClient ? 'Loading...' : (endDateString && status === 'Successful' ? formatDate(endDateString) : 'N/A')}</span>;
  }

  const ExpiryIcon = expiryDetails.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-1 text-xs", expiryDetails.colorClass)}>
          {ExpiryIcon && <ExpiryIcon className="h-3.5 w-3.5" />}
          <span>{expiryDetails.text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{expiryDetails.tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}


export function AdminDashboardClient({ submissions: initialSubmissions, resellers }: AdminDashboardClientProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [resellerFilter, setResellerFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ email: string; name?: string; id: string } | null>(null);

  const [isProfileNameDialogOpen, setIsProfileNameDialogOpen] = useState(false);
  const [currentSubmissionForProfileName, setCurrentSubmissionForProfileName] = useState<Submission | null>(null);
  const [profileNameFormState, profileNameFormAction] = useActionState(updateSubmissionProfileName, initialProfileNameFormState);
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
      id: submission.id // Add submission ID
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
        // Remove the submission from the list
        setSubmissions(prev => prev.filter(s => s.id !== accountToDelete.id));
        
        toast({
          title: "Account Deleted",
          description: `Account for ${accountToDelete.email} has been deleted successfully.`,
        });
      } else {
        console.error('Delete operation returned false');
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

  const handleProfileNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubmissionForProfileName) return;
    
    const formData = new FormData();
    formData.append('submissionId', currentSubmissionForProfileName.id);
    formData.append('profileName', profileNameInput);
    
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

  if (initialSubmissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
         <Image src="https://picsum.photos/seed/emptyadmin/300/200" alt="No submissions" width={300} height={200} className="rounded-lg mb-8 opacity-70 shadow-lg" data-ai-hint="empty dashboard illustration" />
        <h2 className="text-2xl font-semibold mb-2">No Submissions Yet</h2>
        <p className="text-muted-foreground">When resellers submit customer data, it will appear here for management.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">Submissions Management</h1>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-end p-4 border rounded-lg shadow-sm bg-card animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder="Search email, reseller, profile..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}>
              <SelectTrigger id="status-filter">
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
          <div>
            <Label htmlFor="reseller-filter">Reseller</Label>
            <Select value={resellerFilter} onValueChange={(value) => setResellerFilter(value)}>
              <SelectTrigger id="reseller-filter">
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

        <div className="rounded-lg border shadow-sm overflow-hidden animate-in fade-in duration-300 delay-200">
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredSubmissions.length > 0 ? filteredSubmissions.map(sub => {
                const reseller = resellers.find(r => r.id === sub.resellerId);
                const resellerDisplay = reseller
                  ? `${reseller.name || reseller.email} (${reseller.email})`
                  : sub.resellerName;
                return (
                  <TableRow key={sub.id} className="hover:bg-muted/50 transition-colors duration-150 animate-in fade-in">
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
                      {sub.renewalLikelihood !== undefined ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-primary hover:underline">
                              {(sub.renewalLikelihood * 100).toFixed(0)}%
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 animate-in fade-in zoom-in-95 duration-150">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Renewal Prediction</h4>
                              <p className="text-sm text-muted-foreground">
                                Likelihood: <span className="font-semibold text-primary">{(sub.renewalLikelihood * 100).toFixed(0)}%</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Reason: {sub.renewalReason || "No specific reason provided."}
                              </p>
                              {sub.notes && (
                                <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                  Based on notes: <em>"{sub.notes.length > 100 ? sub.notes.substring(0,97) + "..." : sub.notes}"</em>
                                </p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <FileSearch className="w-12 h-12 opacity-50" />
                      <p className="text-lg">No submissions match your filters.</p>
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
              <form onSubmit={handleProfileNameSubmit} className="space-y-4 py-4">
                <input type="hidden" name="submissionId" value={currentSubmissionForProfileName.id} />
                <div className="space-y-2">
                  <Label htmlFor="profileName">Profile Name</Label>
                  <Input
                    id="profileName"
                    name="profileName"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    placeholder="Enter profile name"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsProfileNameDialogOpen(false);
                      setCurrentSubmissionForProfileName(null);
                      setProfileNameInput('');
                    }}
                    disabled={isLoading[currentSubmissionForProfileName.id]}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading[currentSubmissionForProfileName.id]}
                  >
                    {isLoading[currentSubmissionForProfileName.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Update Profile Name
                      </>
                    )}
                  </Button>
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
              <DialogDescription className="space-y-4">
                <p>
                  Are you sure you want to delete the account for {accountToDelete?.email}?
                  {accountToDelete?.name && ` (${accountToDelete.name})`}
                </p>
                <p>This action cannot be undone and will:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Delete the user account</li>
                  <li>Remove all associated submissions</li>
                  <li>Delete all related data</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
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

