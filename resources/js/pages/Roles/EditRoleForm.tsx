import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEventHandler, useEffect, useState } from 'react';
import { type Permission, type Role } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';

interface Props {
    role: Role;
    permissions: Permission[];
    onSuccess?: () => void;
}

export default function EditRoleForm({ role, permissions, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: role.name,
        display_name: role.display_name,
        permissions: role.permissions.map(permission => permission.id)
    });

    useEffect(() => {
        // Update form data when role prop changes
        setData({
            name: role.name,
            display_name: role.display_name,
            permissions: role.permissions.map(permission => permission.id)
        });
    }, [role]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.put(`/roles/${role.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Role updated successfully!');
            
            if (response.data.role) {
                // Update local data with the returned role if needed
                // This is useful if the server modifies some values
            }
            
            onSuccess?.();
        } catch (error) {
            console.error('Error updating role:', error);
            
            // Handle validation errors from Laravel
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(key => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update role. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        required
                        placeholder="role-name"
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                        id="display_name"
                        value={data.display_name}
                        onChange={e => setData('display_name', e.target.value)}
                        required
                        placeholder="Role Name"
                    />
                    {errors.display_name && (
                        <p className="text-destructive text-sm">{errors.display_name}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={data.permissions.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setData('permissions', [...data.permissions, permission.id]);
                                        } else {
                                            setData('permissions', data.permissions.filter(id => id !== permission.id));
                                        }
                                    }}
                                />
                                <Label htmlFor={`permission-${permission.id}`} className="text-sm font-normal">
                                    {permission.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {errors.permissions && (
                        <p className="text-destructive text-sm">{errors.permissions}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Update Role
                </Button>
            </DialogFooter>
        </form>
    );
}