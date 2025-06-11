import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreatePermissionForm from './CreatePermissionForm';
import EditPermissionForm from './EditPermissionForm';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissions Management',
        href: '/permissions',
    },
];

interface Props {
    permissions: Permission[];
}

export default function Index({ permissions }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

    const handleDeleteClick = (permission: Permission) => {
        setPermissionToDelete(permission);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (permissionToDelete) {
            try {
                await axios.delete(`/permissions/${permissionToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json'
                    }
                });
                
                toast.success(`Permission ${permissionToDelete.name} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting permission:', error);
                toast.error('Failed to delete permission. Please try again later.');
            }
        }
        setIsDeleteDialogOpen(false);
        setPermissionToDelete(null);
        window.refreshDataTable?.();
    };

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIsEditDialogOpen(true);
        window.refreshDataTable?.();
    };

    const filterableColumns = [
        {
            label: 'Name',
            key: 'name'
        },
        {
            label: 'Display Name',
            key: 'display_name'
        }
    ];

    const columns = [
        {
            id: "name",
            header: 'Name',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            id: "display_name",
            header: 'Display Name',
            enableSorting: true,
            cell: ({ row } : { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.display_name}</span>
                </div>
            ),
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Permissions Management</h1>
                    {userPermissions.includes('permissions-update') && (
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Permission
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Permission</DialogTitle>
                                    <DialogDescription>Add a new permission to the system.</DialogDescription>
                                </DialogHeader>
                                <CreatePermissionForm onSuccess={() => {
                                    setIsCreateDialogOpen(false);
                                    window.refreshDataTable?.();
                                }} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <DataTable<Permission> filterableColumns={filterableColumns} route="/api/permissions"  columns={columns} pageSize={20} { ...(userPermissions.includes('permissions-update') && { onEdit: handleEdit }) } { ...(userPermissions.includes('permissions-update') && { onDelete: handleDeleteClick }) } params={{}} />
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Permission</DialogTitle>
                        <DialogDescription>Update permission details.</DialogDescription>
                    </DialogHeader>
                    {selectedPermission && <EditPermissionForm permission={selectedPermission} onSuccess={() => {
                        setIsEditDialogOpen(false);
                        window.refreshDataTable?.();
                    }} />}
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setPermissionToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Permission"
                description={`Are you sure you want to delete ${permissionToDelete?.name}? This action cannot be undone. Any users and roles with this permission will lose it.`}
            />
        </AppLayout>
    );
}
