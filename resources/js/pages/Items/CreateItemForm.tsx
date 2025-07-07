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

export default function CreateItemForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [weights, setWeights] = useState<Weight[]>([]);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: '',
        section_id: '',
        grade_id: '',
        default_weight_id: '',
        description: '',
    });
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);
    
    // Fetch grades on component mount
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const gradesResponse = await axios.get('/api/grades');
                setGrades(gradesResponse.data);
            } catch (error) {
                console.error('Error fetching grades:', error);
            }
        };
        
        fetchGrades();
    }, []);

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
                    
                    // Clear the selected weight if it doesn't match the section's weight type
                    if (selectedWeight && selectedWeight.weight_type !== selectedSection.weight_type) {
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
            setSelectedWeight(null);
            setData('default_weight_id', '');
        }
    }, [selectedSection]);

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
                        onChange={(value: Section) => {
                            setData('section_id', value.id.toString());
                            setSelectedSection(value);
                        }}
                        renderOption={(option) => `${option.name} (${option.weight_type.toUpperCase()})`}
                        renderSelected={(option) => option.name}
                    />
                    {errors.section_id && (
                        <p className="text-destructive text-sm">{errors.section_id}</p>
                    )}
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
                    {errors.grade_id && (
                        <p className="text-destructive text-sm">{errors.grade_id}</p>
                    )}
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
                    {errors.default_weight_id && (
                        <p className="text-destructive text-sm">{errors.default_weight_id}</p>
                    )}
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