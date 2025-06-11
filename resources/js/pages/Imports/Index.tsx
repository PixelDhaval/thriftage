import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Import } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CreateImportForm from './CreateImportForm';
import EditImportForm from './EditImportForm';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports Management',
        href: '/imports',
    },
];

interface Props {
    imports: Import[];
}

export default function Index({ imports }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];

    // Imports state
    const [isCreateImportDialogOpen, setIsCreateImportDialogOpen] = useState(false);
    const [isEditImportDialogOpen, setIsEditImportDialogOpen] = useState(false);
    const [isDeleteImportDialogOpen, setIsDeleteImportDialogOpen] = useState(false);
    const [selectedImport, setSelectedImport] = useState<Import | null>(null);
    const [importToDelete, setImportToDelete] = useState<Import | null>(null);

    // Import handlers
    const handleDeleteImportClick = (import_data: Import) => {
        setImportToDelete(import_data);
        setIsDeleteImportDialogOpen(true);
    };

    const handleDeleteImportConfirm = async () => {
        if (importToDelete) {
            try {
                await axios.delete(`/imports/${importToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Import ${importToDelete.container_no} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting import:', error);
                toast.error('Failed to delete import. Please try again later.');
            }
        }
        setIsDeleteImportDialogOpen(false);
        setImportToDelete(null);
    };

    const handleEditImport = (import_data: Import) => {
        router.get(`/imports/${import_data.id}`);
    };

    // DataTable configurations
    const importFilterableColumns = [
        { label: 'Party', key: 'party.name' },
        { label: 'Container No', key: 'container_no' },
        { label: 'BL No', key: 'bl_no' },
        { label: 'BE No', key: 'be_no' },
        { label: 'Type', key: 'type' },
    ];

    const importColumns = [
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
            id: 'container_no',
            header: 'Container No',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.container_no || '-'}</span>
                </div>
            ),
        },
        {
            id: 'movement_date',
            header: 'Movement Date',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.movement_date ? format(row.original.movement_date, 'dd/MM/yyyy') : '-'}</span>
                </div>
            ),
        },
        {
            id: 'bl_details',
            header: 'BL Details',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    {row.original.type === 'container' ? (
                        <>
                            <span>No: {row.original.bl_no || '-'}</span>
                            <span>Date: {row.original.bl_date ? format(row.original.bl_date, 'dd/MM/yyyy') : '-'}</span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">Local Delivery</span>
                    )}
                </div>
            ),
        },
        {
            id: 'be_details',
            header: 'BE Details',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    {row.original.type === 'container' ? (
                        <>
                            <span>No: {row.original.be_no || '-'}</span>
                            <span>Date: {row.original.be_date ? format(row.original.be_date, 'dd/MM/yyyy') : '-'}</span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">Local Delivery</span>
                    )}
                </div>
            ),
        },
        {
            id: 'weights',
            header: 'Weights',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    {row.original.type === 'container' && (
                        <span>BL: {row.original.bl_weight ? `${row.original.bl_weight} kg` : '-'}</span>
                    )}
                    <span>
                        {row.original.type === 'container' ? 'WB:' : 'Total:'} {row.original.weigh_bridge_weight ? `${row.original.weigh_bridge_weight} kg` : '-'}
                    </span>
                </div>
            ),
        },
        {
            id: 'type',
            header: 'Type',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        row.original.type === 'container' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {row.original.type === 'container' ? 'Via Container' : 'Local Delivery'}
                    </span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(row.original.created_at, 'dd/MM/yyyy')}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Imports Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4 flex justify-between">
                    <h1 className="text-2xl mt-4 font-semibold">Imports Management</h1>
                    {userPermissions.includes('imports-update') && (
                        <Dialog open={isCreateImportDialogOpen} onOpenChange={setIsCreateImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Import</DialogTitle>
                                    <DialogDescription>Add a new import to the system.</DialogDescription>
                                </DialogHeader>
                                <CreateImportForm
                                    onSuccess={() => {
                                        setIsCreateImportDialogOpen(false);
                                        window.refreshDataTable?.();
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <DataTable<Import>
                    filterableColumns={importFilterableColumns}
                    route="/api/imports"
                    columns={importColumns}
                    pageSize={20}
                    {...(userPermissions.includes('imports-update') && { onEdit: handleEditImport })}
                    {...(userPermissions.includes('imports-update') && { onDelete: handleDeleteImportClick })}
                    params={{}}
                />

                <Dialog open={isEditImportDialogOpen} onOpenChange={setIsEditImportDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Import</DialogTitle>
                            <DialogDescription>Update import details.</DialogDescription>
                        </DialogHeader>
                        {selectedImport && (
                            <EditImportForm
                                import={selectedImport}
                                onSuccess={() => {
                                    setIsEditImportDialogOpen(false);
                                    window.refreshDataTable?.();
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <DeleteConfirmationDialog
                    isOpen={isDeleteImportDialogOpen}
                    onClose={() => {
                        setIsDeleteImportDialogOpen(false);
                        setImportToDelete(null);
                    }}
                    onConfirm={handleDeleteImportConfirm}
                    title="Delete Import"
                    description={`Are you sure you want to delete ${importToDelete?.container_no}? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}
