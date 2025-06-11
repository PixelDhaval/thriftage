import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Item } from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    item: Item;
    onSuccess?: () => void;
}

interface Section {
    id: number;
    name: string;
}

export default function EditItemForm({ item, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: item.name,
        section_id: item.section_id?.toString() || '',
        description: item.description || '',
    });
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    useEffect(() => {
        setData({
            name: item.name,
            section_id: item.section_id?.toString() || '',
            description: item.description || '',
        });

        setSelectedSection({
            id: item.section_id || '',
            name: item.section?.name || '',
        });
    }, [item]);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.put(`/items/${item.id}`, data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            toast.success('Item updated successfully!');
            onSuccess?.();
        } catch (error) {
            console.error('Error updating item:', error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to update item. Please try again later.');
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
                    <Label htmlFor="section_id">Section</Label>
                    <AsyncSelectInput
                        route="/api/sections/select"
                        value={selectedSection}
                        onChange={(value: any) => {
                            setData('section_id', value.id.toString());
                            setSelectedSection(value);
                        }}
                    />
                    {errors.section_id && <p className="text-destructive text-sm">{errors.section_id}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={data.description || ''} onChange={(e) => setData('description', e.target.value)} rows={3} />
                    {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Update Item
                </Button>
            </DialogFooter>
        </form>
    );
}
