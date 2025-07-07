import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface Props {
    onSuccess?: () => void;
}

export default function CreateSectionForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: '',
        weight_type: 'kg',
    });

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/sections', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Section created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating section:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create section. Please try again later.');
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
                        placeholder="Enter section name"
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="weight_type">Weight Type</Label>
                    <Select 
                        value={data.weight_type} 
                        onValueChange={value => setData('weight_type', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select weight type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="pair">Pairs</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.weight_type && (
                        <p className="text-destructive text-sm">{errors.weight_type}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Select whether this section measures items in kilograms or pairs
                    </p>
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Section
                </Button>
            </DialogFooter>
        </form>
    );
}