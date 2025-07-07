import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    weight_type: string;
}

interface Grade {
    id: number;
    name: string;
}

interface Weight {
    id: number;
    weight: string;
    weight_type: string;
}

export default function EditItemForm({ item, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [weights, setWeights] = useState<Weight[]>([]);
    const { data, setData, errors, setError, clearErrors } = useForm({
        name: item.name,
        section_id: item.section_id?.toString() || '',
        grade_id: item.grade_id?.toString() || '',
        default_weight_id: item.default_weight_id?.toString() || '',
        description: item.description || '',
    });
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);
    const [initialLoad, setInitialLoad] = useState(true);

    // Initialize form data and fetch related data
    useEffect(() => {
        setData({
            name: item.name,
            section_id: item.section_id?.toString() || '',
            grade_id: item.grade_id?.toString() || '',
            default_weight_id: item.default_weight_id?.toString() || '',
            description: item.description || '',
        });

        if (item.section) {
            setSelectedSection({
                id: item.section_id || 0,
                name: item.section?.name || '',
                weight_type: item.section?.weight_type || 'kg',
            });
        }
        
        // Fetch grades
        const fetchGrades = async () => {
            try {
                const gradesResponse = await axios.get('/api/grades');
                setGrades(gradesResponse.data);
                
                // Set selected grade if it exists
                if (item.grade_id) {
                    const grade = gradesResponse.data.find((g: Grade) => g.id === item.grade_id);
                    if (grade) setSelectedGrade(grade);
                }
            } catch (error) {
                console.error('Error fetching grades:', error);
                toast.error('Failed to load grades.');
            }
        };
        
        fetchGrades();
        
        // Initial load flag to avoid clearing selected weight on first render
        setInitialLoad(true);
    }, [item]);

    // Fetch weights when section changes
    useEffect(() => {
        if (selectedSection) {
            const fetchWeights = async () => {
                try {
                    // Pass weight_type parameter to filter weights by the section's weight type
                    const weightsResponse = await axios.get('/api/weights/select', {
                        params: { weight_type: selectedSection.weight_type }
                    });
                    
                    setWeights(weightsResponse.data);
                    
                    // On first load, set the default weight if it exists
                    if (initialLoad && item.default_weight_id) {
                        const weight = weightsResponse.data.find((w: Weight) => w.id === item.default_weight_id);
                        if (weight) {
                            setSelectedWeight(weight);
                        } else {
                            // If the weight doesn't exist in the filtered list, clear it
                            setSelectedWeight(null);
                            setData('default_weight_id', '');
                        }
                        setInitialLoad(false);
                    } 
                    // After initial load, check if selected weight matches section's weight type
                    else if (!initialLoad && selectedWeight && selectedWeight.weight_type !== selectedSection.weight_type) {
                        setSelectedWeight(null);
                        setData('default_weight_id', '');
                    }
                } catch (error) {
                    console.error('Error fetching weights:', error);
                    toast.error('Failed to load weights for this section.');
                }
            };
            
            fetchWeights();
        } else {
            // Reset weights when no section is selected
            setWeights([]);
            if (!initialLoad) {
                setSelectedWeight(null);
                setData('default_weight_id', '');
            }
        }
    }, [selectedSection]);

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
                        onChange={(value: Section) => {
                            setData('section_id', value.id.toString());
                            setSelectedSection(value);
                        }}
                        renderOption={(option) => `${option.name} (${option.weight_type.toUpperCase()})`}
                        renderSelected={(option) => option.name}
                    />
                    {errors.section_id && <p className="text-destructive text-sm">{errors.section_id}</p>}
                    {selectedSection && (
                        <p className="text-sm text-muted-foreground">
                            Weight type: <span className="font-medium">{selectedSection.weight_type.toUpperCase()}</span>
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="grade_id">Grade</Label>
                    <Select 
                        value={data.grade_id} 
                        onValueChange={(value) => {
                            setData('grade_id', value);
                            const selected = grades.find(grade => grade.id.toString() === value);
                            setSelectedGrade(selected || null);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                            {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id.toString()}>
                                    {grade.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.grade_id && <p className="text-destructive text-sm">{errors.grade_id}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="default_weight_id">Default Weight (Optional)</Label>
                    <Select 
                        value={data.default_weight_id} 
                        onValueChange={(value) => {
                            setData('default_weight_id', value);
                            const selected = weights.find(weight => weight.id.toString() === value);
                            setSelectedWeight(selected || null);
                        }}
                        disabled={!selectedSection || weights.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={selectedSection ? "Select default weight" : "Select a section first"} />
                        </SelectTrigger>
                        <SelectContent>
                            {weights.map((weight) => (
                                <SelectItem key={weight.id} value={weight.id.toString()}>
                                    {weight.weight} {weight.weight_type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.default_weight_id && <p className="text-destructive text-sm">{errors.default_weight_id}</p>}
                    {!selectedSection ? (
                        <p className="text-sm text-muted-foreground">
                            Select a section first to see compatible weights
                        </p>
                    ) : weights.length === 0 ? (
                        <p className="text-sm text-amber-500">
                            No weights found for {selectedSection.weight_type} weight type
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Optional default weight for this item ({selectedSection.weight_type} weight type)
                        </p>
                    )}
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
