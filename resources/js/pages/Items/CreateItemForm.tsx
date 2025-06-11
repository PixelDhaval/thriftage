import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsyncSelectInput } from '@/components/ui/async-select';

interface Props {
    onSuccess?: () => void;
}

interface Section {
    id: number;
    name: string;
}

export default function CreateItemForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: '',
        section_id: '',
        description: '',
    });
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/items', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Item created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating item:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create item. Please try again later.');
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
                        placeholder="Enter item name"
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="section_id">Section</Label>
                    <AsyncSelectInput
                        route='/api/sections/select'
                        value={selectedSection}
                        onChange={(value: any) => {
                            setData('section_id', value.id.toString());
                            setSelectedSection(value);
                        }}
                    />
                    {errors.section_id && (
                        <p className="text-destructive text-sm">{errors.section_id}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={data.description || ''}
                        onChange={e => setData('description', e.target.value)}
                        placeholder="Enter description (optional)"
                        rows={3}
                    />
                    {errors.description && (
                        <p className="text-destructive text-sm">{errors.description}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Item
                </Button>
            </DialogFooter>
        </form>
    );
}