import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { AsyncSelectInput } from '@/components/ui/async-select';

export default function CreateUserForm({ roles, permissions, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const { data, setData, reset, errors, setError, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
        permissions: [],
    });

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);
        
        try {
            const response = await axios.post('/users', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            
            toast.success('User created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating user:', error);
            
            // Handle validation errors from Laravel
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(key => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create user. Please try again later.');
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
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && (
                        <p className="text-destructive text-sm">{errors.email}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && (
                        <p className="text-destructive text-sm">{errors.password}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {roles.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`role-${role.id}`}
                                    checked={data.roles.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setData('roles', [...data.roles, role.id]);
                                        } else {
                                            setData('roles', data.roles.filter(id => id !== role.id));
                                        }
                                    }}
                                />
                                <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                                    {role.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {errors.roles && (
                        <p className="text-destructive text-sm">{errors.roles}</p>
                    )}
                </div>

            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create User
                </Button>
            </DialogFooter>
        </form>
    );
}