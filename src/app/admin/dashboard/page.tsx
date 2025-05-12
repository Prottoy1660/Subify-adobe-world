import { AdminDashboardWrapper } from '@/components/admin/dashboard-wrapper';
import { fetchAllSubmissionsForAdmin, getResellers } from '@/app/actions';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Subify',
  description: 'Manage all reseller customer submissions.',
};

function AdminDashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-10 w-1/2" /> {/* Title skeleton */}
      {/* Filters skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg shadow-sm bg-card">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
      {/* Table skeleton */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(10)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(10)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <React.Suspense fallback={<AdminDashboardLoadingSkeleton />}>
        <SubmissionsData />
      </React.Suspense>
    </div>
  );
}

async function SubmissionsData() {
  const [submissions, resellers] = await Promise.all([
    fetchAllSubmissionsForAdmin(),
    getResellers()
  ]);
  return <AdminDashboardWrapper submissions={submissions} resellers={resellers} />;
}
