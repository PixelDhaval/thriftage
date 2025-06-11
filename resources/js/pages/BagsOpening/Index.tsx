import BarcodeScannerDialog from '@/components/BarcodeScannerDialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type ImportBag } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { Scan } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Bags Opening',
        href: '/bags-opening',
    },
];

export default function Index() {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [params, setParams] = useState({
        status: 'unopened',
        sort_column: 'updated_at',
        sort_direction: 'desc',
    });

    // Handle marking bag as opened
    const handleMarkAsOpened = async (importBag: ImportBag) => {
        setIsUpdating(importBag.id.toString());

        try {
            await axios.put(
                `/import-bags/${importBag.id}`,
                { status: 'opened' },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );

            toast.success(`Bag ${importBag.barcode} marked as opened successfully.`);
            window.refreshDataTable?.();
        } catch (error) {
            console.error('Error updating import bag status:', error);
            toast.error('Failed to mark bag as opened. Please try again later.');
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle marking bag as unopened
    const handleMarkAsUnopened = async (importBag: ImportBag) => {
        setIsUpdating(importBag.id.toString());

        try {
            await axios.put(
                `/import-bags/${importBag.id}`,
                { status: 'unopened' },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );

            toast.success(`Bag ${importBag.barcode} marked as unopened successfully.`);
            window.refreshDataTable?.();
        } catch (error) {
            console.error('Error updating import bag status:', error);
            toast.error('Failed to mark bag as unopened. Please try again later.');
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle status filter change
    const handleStatusChange = (status: string) => {
        setParams((prev) => ({
            ...prev,
            status: status === 'all' ? '' : status,
        }));
    };

    // DataTable configurations
    const importBagFilterableColumns = [
        { label: 'Barcode', key: 'barcode' },
        { label: 'Party', key: 'party.name' },
        { label: 'Weight', key: 'weight.weight' },
        { label: 'Container/Reference', key: 'import.container_no' },
        { label: 'Created At', key: 'created_at' },
    ];

    // Update status column to show dynamic status based on filter
    const importBagColumns = [
        {
            id: 'barcode',
            header: 'Barcode',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{row.original.barcode}</span>
                </div>
            ),
        },
        {
            id: 'party',
            header: 'Party',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.party?.name || '-'}</span>
                </div>
            ),
        },
        {
            id: 'weight',
            header: 'Weight',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.weight?.weight || '-'} kg</span>
                </div>
            ),
        },
        {
            id: 'import_details',
            header: 'Import Details',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{row.original.import?.container_no || '-'}</span>
                    <span className="text-muted-foreground text-xs">{row.original.import?.type === 'container' ? 'Container' : 'Local'}</span>
                </div>
            ),
        },
        {
            id: 'movement_date',
            header: 'Movement Date',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.import?.movement_date ? format(row.original.import.movement_date, 'dd/MM/yyyy') : '-'}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(row.original.created_at, 'dd/MM/yyyy HH:mm')}</span>
                </div>
            ),
        },
        {
            id: 'updated_at',
            header: 'Updated At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(row.original.updated_at, 'dd/MM/yyyy HH:mm')}</span>
                </div>
            ),
        },
        ...(userPermissions.includes('bags-opening-update')
            ? [
                  {
                      id: 'status',
                      header: 'Status',
                      enableSorting: false,
                      cell: ({ row }: { row: any }) => (
                          <div className="flex items-center gap-2">
                              <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                      row.original.status === 'opened' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                  {row.original.status}
                              </span>
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bags Opening" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Bags Opening</h1>
                        <p className="text-muted-foreground">
                            Press <kbd className="bg-muted rounded px-1 py-0.5 text-xs">Ctrl+I</kbd> to open barcode scanner.
                        </p>
                    </div>
                    {userPermissions.includes('bags-opening-update') && (
                        <Button onClick={() => setIsScannerOpen(true)} className="gap-2">
                            <Scan className="h-4 w-4" />
                            Open Scanner
                        </Button>
                    )}
                </div>

                {/* Status Filter Buttons */}
                <div className="mb-4 flex gap-2">
                    <Button
                        variant={params.status === '' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('all')}
                        className="h-9"
                    >
                        All Bags
                    </Button>
                    <Button
                        variant={params.status === 'unopened' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('unopened')}
                        className="h-9"
                    >
                        Unopened Bags
                    </Button>
                    <Button
                        variant={params.status === 'opened' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('opened')}
                        className="h-9"
                    >
                        Opened Bags
                    </Button>
                </div>

                <DataTable<ImportBag>
                    filterableColumns={importBagFilterableColumns}
                    route="/api/import-bags-with-barcodes"
                    columns={importBagColumns}
                    pageSize={20}
                    params={params}
                    key={`status-${params.status}`}
                />

                <BarcodeScannerDialog isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
            </div>
        </AppLayout>
    );
}
