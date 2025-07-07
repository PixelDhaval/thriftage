import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Section } from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    section: Section;
    onSuccess?: () => void;
}

export default function EditSectionForm({ section, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, clearErrors } = useForm({
        name: section.name,
        weight_type: section.weight_type || 'kg',
    });

    useEffect(() => {
        setData({
            name: section.name,
            weight_type: section.weight_type || 'kg',
        });
    }, [section]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.put(`/sections/${section.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Section updated successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error updating section:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(key => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update section. Please try again later.');
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
                    Update Section
                </Button>
            </DialogFooter>
        </form>
    );
}