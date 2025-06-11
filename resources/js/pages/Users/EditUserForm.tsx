import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditUserForm({ user, roles, permissions, onSuccess }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles.map((role: any) => role.id),
        permissions: user.permissions.map((permission: any) => permission.id),
    });

    useEffect(() => {
        // Update form data when user prop changes
        setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            roles: user.roles.map((role: any) => role.id),
            permissions: user.permissions.map((permission: any) => permission.id),
        });
    }, [user]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            // Send request using Axios
            const response = await axios.put(`/users/${user.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            toast.success('User updated successfully!');

            if (response.data.user) {
                // Update local data with the returned user if needed
                // This is useful if the server modifies some values
            }

            onSuccess?.();
        } catch (error: any) {
            console.error('Error updating user:', error);

            // Handle validation errors from Laravel
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key: any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update user. Please try again later.');
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
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Leave blank to keep current password"
                    />
                    {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Leave blank to keep current password"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {roles.map((role : any) => (
                            <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`role-${role.id}`}
                                    checked={data.roles.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setData('roles', [...data.roles, role.id]);
                                        } else {
                                            setData(
                                                'roles',
                                                data.roles.filter((id: any) => id !== role.id),
                                            );
                                        }
                                    }}
                                />
                                <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                                    {role.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {errors.roles && <p className="text-destructive text-sm">{errors.roles}</p>}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Update User
                </Button>
            </DialogFooter>
        </form>
    );
}
