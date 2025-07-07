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

export default function CreateWeightForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        weight: '',
        weight_type: 'kg',
    });

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/weights', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Weight created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating weight:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create weight. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="weight">Weight Value</Label>
                    <Input
                        id="weight"
                        value={data.weight}
                        onChange={e => setData('weight', e.target.value)}
                        required
                        placeholder="Enter weight value"
                        type="number"
                        step="0.01"
                    />
                    {errors.weight && (
                        <p className="text-destructive text-sm">{errors.weight}</p>
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
                        Specify if this weight represents kilograms or pairs
                    </p>
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Weight
                </Button>
            </DialogFooter>
        </form>
    );
}