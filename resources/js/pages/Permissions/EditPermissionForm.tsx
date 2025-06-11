import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useEffect, useState } from 'react';
import { type Permission } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';

interface Props {
    permission: Permission;
    onSuccess?: () => void;
}

export default function EditPermissionForm({ permission, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: permission.name,
        display_name: permission.display_name,
    });

    useEffect(() => {
        setData({
            name: permission.name,
            display_name: permission.display_name,
        });
    }, [permission]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.put(`/permissions/${permission.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Permission updated successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error updating permission:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(key => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update permission. Please try again later.');
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
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                        id="display_name"
                        value={data.display_name}
                        onChange={e => setData('display_name', e.target.value)}
                        required
                    />
                    {errors.display_name && (
                        <p className="text-destructive text-sm">{errors.display_name}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Update Permission
                </Button>
            </DialogFooter>
        </form>
    );
}