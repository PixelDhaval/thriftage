import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface Props {
    onSuccess?: () => void;
}

export default function CreateGradeForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: '',
    });

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/grades', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Grade created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating grade:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create grade. Please try again later.');
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
                        placeholder="Enter grade name"
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Grade
                </Button>
            </DialogFooter>
        </form>
    );
}