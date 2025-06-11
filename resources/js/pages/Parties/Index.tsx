import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Party } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CreatePartyForm from './CreatePartyForm';
import EditPartyForm from './EditPartyForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Parties Management',
        href: '/parties',
    },
];

interface Props {
    parties: Party[];
}

export default function Index({ parties }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];

    // Parties state
    const [isCreatePartyDialogOpen, setIsCreatePartyDialogOpen] = useState(false);
    const [isEditPartyDialogOpen, setIsEditPartyDialogOpen] = useState(false);
    const [isDeletePartyDialogOpen, setIsDeletePartyDialogOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState<Party | null>(null);
    const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);

    // Party handlers
    const handleDeletePartyClick = (party: Party) => {
        setPartyToDelete(party);
        setIsDeletePartyDialogOpen(true);
    };

    const handleDeletePartyConfirm = async () => {
        if (partyToDelete) {
            try {
                await axios.delete(`/parties/${partyToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Party ${partyToDelete.name} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting party:', error);
                toast.error('Failed to delete party. Please try again later.');
            }
        }
        setIsDeletePartyDialogOpen(false);
        setPartyToDelete(null);
    };

    const handleEditParty = (party: Party) => {
        setSelectedParty(party);
        setIsEditPartyDialogOpen(true);
    };

    // DataTable configurations
    const partyFilterableColumns = [
        { label: 'Name', key: 'name' },
        { label: 'Type', key: 'type' },
        { label: 'City', key: 'city' },
        { label: 'State', key: 'state' },
        { label: 'Phone', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'GST', key: 'gst' },
    ];

    const partyColumns = [
        {
            id: 'name',
            header: 'Name',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex parties-center gap-2">
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            id: 'type',
            header: 'Type',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex parties-center gap-2">
                    <span>{row.original.type || '-'}</span>
                </div>
            ),
        },
        {
            id: 'address',
            header: 'Address',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    <span>{row.original.address_line_1 || ''}</span>
                    {row.original.address_line_2 && <span>{row.original.address_line_2}</span>}
                    <span>
                        {[row.original.city, row.original.state, row.original.zip]
                            .filter(Boolean)
                            .join(', ')}
                    </span>
                    <span>{row.original.country || ''}</span>
                </div>
            ),
        },
        {
            id: 'contact',
            header: 'Contact',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    <span>{row.original.phone || '-'}</span>
                    <span>{row.original.email || '-'}</span>
                </div>
            ),
        },
        {
            id: 'gst',
            header: 'GST',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex parties-center gap-2">
                    <span>{row.original.gst || '-'}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex parties-center gap-2">
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parties Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4 flex justify-between">
                    <h1 className="text-2xl mt-4 font-semibold">Parties Management</h1>
                    {userPermissions.includes('parties-update') && (
                        <Dialog open={isCreatePartyDialogOpen} onOpenChange={setIsCreatePartyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Party
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create New Party</DialogTitle>
                                    <DialogDescription>Add a new party to the system.</DialogDescription>
                                </DialogHeader>
                                <CreatePartyForm
                                    onSuccess={() => {
                                        setIsCreatePartyDialogOpen(false);
                                        window.refreshDataTable?.();
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <DataTable<Party>
                    filterableColumns={partyFilterableColumns}
                    route="/api/parties"
                    columns={partyColumns}
                    pageSize={20}
                    {...(userPermissions.includes('parties-update') && { onEdit: handleEditParty })}
                    {...(userPermissions.includes('parties-update') && { onDelete: handleDeletePartyClick })}
                    params={{}}
                />

                <Dialog open={isEditPartyDialogOpen} onOpenChange={setIsEditPartyDialogOpen}>
                    <DialogContent className='max-h-[90vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle>Edit Party</DialogTitle>
                            <DialogDescription>Update party details.</DialogDescription>
                        </DialogHeader>
                        {selectedParty && (
                            <EditPartyForm
                                party={selectedParty}
                                onSuccess={() => {
                                    setIsEditPartyDialogOpen(false);
                                    window.refreshDataTable?.();
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <DeleteConfirmationDialog
                    isOpen={isDeletePartyDialogOpen}
                    onClose={() => {
                        setIsDeletePartyDialogOpen(false);
                        setPartyToDelete(null);
                    }}
                    onConfirm={handleDeletePartyConfirm}
                    title="Delete Party"
                    description={`Are you sure you want to delete ${partyToDelete?.name}? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}
