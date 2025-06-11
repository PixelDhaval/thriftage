import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission, type Role, type User } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CreateUserForm from './CreateUserForm';
import EditUserForm from './EditUserForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users Management',
        href: '/users',
    },
];

const columns: ColumnDef<User>[] = [
    {
        id: "name",
        header: 'Name',
        enableSorting: true,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span>{row.original.name}</span>
            </div>
        ),
    },
    {
        id: "email",
        header: 'Email',
        enableSorting: true,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span>{row.original.email}</span>
            </div>
        )
    },
    {
        id: 'roles',
        header: 'Roles',
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
                {row.original.roles.map((role) => (
                    <Badge key={role.id} variant="outline">
                        {role.name}
                    </Badge>
                ))}
            </div>
        ),
    },
];

const filterableColumns = [
    {
        label: 'Name',
        key: 'name'
    },
    {
        label: 'Email',
        key: 'email'
    },
    {
        label: 'Role',
        key: 'roles.name'
    }
];

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function Index({ roles, permissions }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];
    const canEdit = userPermissions.includes('users-update');
    const canDelete = userPermissions.includes('users-delete');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            router.delete(`/users/${userToDelete.id}`, {
                onSuccess: () => {
                    toast.success('User deleted successfully!');
                    setUserToDelete(null);
                    window.refreshDataTable?.();
                },
                onError: () => {
                    toast.error('Failed to delete user. Please try again.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {canEdit && (
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Users Management</h1>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                )}

                <DataTable<User> 
                    filterableColumns={filterableColumns} 
                    route="/api/users"  
                    columns={columns} 
                    pageSize={10} 
                    {...(canEdit && { onEdit: handleEdit })}
                    {...(canEdit && { onDelete: handleDelete })}
                    params={{}} 
                />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new user to the system.</DialogDescription>
                    </DialogHeader>
                    <CreateUserForm
                        roles={roles}
                        permissions={permissions}
                        onSuccess={() => {
                            setIsCreateDialogOpen(false);
                            window.refreshDataTable?.();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user details, roles, and permissions.</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <EditUserForm
                            user={selectedUser}
                            roles={roles}
                            permissions={permissions}
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setSelectedUser(null);
                                window.refreshDataTable?.();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
