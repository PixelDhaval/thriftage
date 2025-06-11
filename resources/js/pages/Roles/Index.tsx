import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission, type Role } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateRoleForm from './CreateRoleForm';
import EditRoleForm from './EditRoleForm';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles Management',
        href: '/roles',
    },
];

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function Index({ roles, permissions }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];
    console.log(userPermissions);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const filterableColumns = [
        {
            label: 'Name',
            key: 'name'
        },
        {
            label: 'Display Name',
            key: 'display_name'
        },
        {
            label: 'Permissions',
            key: 'permissions.name'
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
        },
        {
            id: "permissions",
            header: 'Permissions',
            cell: ({ row } : { row: any }) => (
                <div className=" flex flex-wrap gap-1">
                    {row.original.permissions.map((permission: any) => (
                        <Badge key={permission.id} variant="outline">
                            {permission.name}
                        </Badge>
                    ))}
                </div>
            ),
        }
    ];

    const handleDeleteConfirm = async () => {
        if (roleToDelete) {
            await axios.delete(`/roles/${roleToDelete.id}`)
        }
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        window.refreshDataTable?.();
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setIsEditDialogOpen(true);
    };
    const handleDelete = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteDialogOpen(true);
    };
    const confirmDelete = () => {
        if (roleToDelete) {
            router.delete(`/roles/${roleToDelete.id}`);
            toast.success(`Role ${roleToDelete.name} deleted successfully.`);
        }
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles Management" />


            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                { userPermissions.includes('roles-update') && (
                    <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Roles Management</h1>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Role</DialogTitle>
                                <DialogDescription>Add a new role and assign permissions.</DialogDescription>
                            </DialogHeader>
                            <CreateRoleForm permissions={permissions} onSuccess={() => { setIsCreateDialogOpen(false); window.refreshDataTable?.(); }} />
                        </DialogContent>
                    </Dialog>
                </div>
                )}
                

                <DataTable<Role> filterableColumns={filterableColumns} route="/api/roles"  columns={columns} pageSize={10} { ...(userPermissions.includes('roles-update') && { onEdit: handleEdit }) } { ...(userPermissions.includes('roles-update') && { onDelete: handleDelete }) } params={{}}/>
                
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>Update role details and permissions.</DialogDescription>
                    </DialogHeader>
                    {selectedRole && <EditRoleForm role={selectedRole} permissions={permissions} onSuccess={() => { setIsEditDialogOpen(false); window.refreshDataTable?.(); }} />}
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setRoleToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Role"
                description={`Are you sure you want to delete ${roleToDelete?.name}? This action cannot be undone. Any users with this role will lose it.`}
            />
        </AppLayout>
    );
}
