import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Weight } from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    weight: Weight;
    onSuccess?: () => void;
}

export default function EditWeightForm({ weight, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, clearErrors } = useForm({
        weight: weight.weight,
        weight_type: weight.weight_type || 'kg',
    });

    useEffect(() => {
        setData({
            weight: weight.weight,
            weight_type: weight.weight_type || 'kg',
        });
    }, [weight]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.put(`/weights/${weight.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Weight updated successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error updating weight:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(key => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update weight. Please try again later.');
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
                    Update Weight
                </Button>
            </DialogFooter>
        </form>
    );
}