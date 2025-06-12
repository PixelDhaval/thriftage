import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarInput } from '@/components/ui/calendar-input';

interface Props {
    importData: any;
    onSuccess: () => void;
}

export default function CreateGradedItemPoolForm({ importData, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        import_id: importData.id,
        party_id: importData.type === 'local' ? importData.party_id : '',
        item_id: '',
        grade_id: '',
        weight: '',
        graded_at: new Date(),
    });
    const [selectedParty, setSelectedParty] = useState<any>(
        importData.type === 'local' ? { id: importData.party_id, name: importData.party?.name } : null
    );
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [availableOpenedGoods, setAvailableOpenedGoods] = useState<any[]>([]);
    const [maxAvailableWeight, setMaxAvailableWeight] = useState<number>(0);

    // Fetch grades and available opened goods
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gradesResponse, availableGoodsResponse] = await Promise.all([
                    axios.get('/api/grades'),
                    axios.get(`/api/imports/${importData.id}/available-opened-goods`)
                ]);
                
                setGrades(gradesResponse.data);
                setAvailableOpenedGoods(availableGoodsResponse.data);
                
                if (formData.party_id) {
                    const partyGoods = availableGoodsResponse.data.filter((item: any) => item.party_id == formData.party_id);
                    const totalAvailable = partyGoods.reduce((sum: number, item: any) => sum + item.available_weight, 0);
                    setMaxAvailableWeight(totalAvailable);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load form data.');
            }
        };

        fetchData();
    }, [importData.id, formData.party_id]);

    const handlePartyChange = (selected: any) => {
        setSelectedParty(selected);
        setFormData(prev => ({ ...prev, party_id: selected?.id || '' }));
    };

    const handleItemChange = (selected: any) => {
        setSelectedItem(selected);
        setFormData(prev => ({ ...prev, item_id: selected?.id || '' }));
    };

    const handleInputChange = (field: string, value: string | number | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.party_id || !formData.item_id || !formData.grade_id || !formData.weight || !formData.graded_at) {
            toast.error('Please fill in all required fields');
            return;
        }

        const weight = parseFloat(formData.weight.toString());
        if (weight <= 0) {
            toast.error('Weight must be greater than 0');
            return;
        }

        // Validate against available weight
        if (weight > maxAvailableWeight) {
            toast.error(
                `Insufficient opened goods available. Maximum available: ${maxAvailableWeight}kg`
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                ...formData,
                weight: weight,
                graded_at: format(formData.graded_at, 'yyyy-MM-dd'),
            };

            const response = await axios.post('/graded-items-pools', submitData);

            if (response.data.success) {
                toast.success('Graded item pool created successfully!');
                onSuccess();
                
                // Reset form
                setFormData({
                    import_id: importData.id,
                    party_id: importData.type === 'local' ? importData.party_id : '',
                    item_id: '',
                    grade_id: '',
                    weight: '',
                    graded_at: new Date(),
                });
                setSelectedItem(null);
                setSelectedParty(null);
                
                if (importData.type === 'container') {
                    setSelectedParty(null);
                }
            }
        } catch (error: any) {
            console.error('Error creating graded item pool:', error);
            
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0] as string[];
                toast.error(firstError[0]);
            } else {
                toast.error('Failed to create graded item pool. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Party Selection - Only show for container imports */}
            {importData.type === 'container' && (
                <div className="grid gap-2">
                    <Label htmlFor="party">Party *</Label>
                    <AsyncSelectInput
                        route="/api/parties/select"
                        params={{ type: 'supplier' }}
                        value={selectedParty}
                        onChange={handlePartyChange}
                        placeholder="Select party"
                        renderOption={(option) => option.name}
                        renderSelected={(option) => option.name}
                    />
                </div>
            )}

            {/* Available Weight Display */}
            {maxAvailableWeight > 0 && (
                <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="text-sm text-blue-900">
                        <div className="font-medium mb-1">Available for Grading:</div>
                        <div className="font-bold text-lg">{maxAvailableWeight} kg</div>
                        <div className="text-xs text-blue-700">
                            Total weight of opened goods available for grading
                        </div>
                    </div>
                </div>
            )}

            {maxAvailableWeight === 0 && formData.party_id && (
                <div className="p-3 border rounded-lg bg-red-50">
                    <div className="text-sm text-red-900">
                        <div className="font-medium">No opened goods available for grading</div>
                        <div className="text-xs text-red-700">
                            Please open some bags before creating graded items
                        </div>
                    </div>
                </div>
            )}

            {/* Item Selection */}
            <div className="grid gap-2">
                <Label htmlFor="item">Item *</Label>
                <AsyncSelectInput
                    route="/api/items/select"
                    value={selectedItem}
                    onChange={handleItemChange}
                    placeholder="Select item"
                    renderOption={(option) => `${option.name} - ${option.section?.name || 'No Section'}`}
                    renderSelected={(option) => option.name}
                    required
                />
            </div>

            {/* Grade Selection */}
            <div className="grid gap-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select value={formData.grade_id} onValueChange={(value) => handleInputChange('grade_id', value)} required>
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
            </div>

            {/* Weight */}
            <div className="grid gap-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxAvailableWeight || undefined}
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="Enter weight in kg"
                    required
                />
                <p className="text-sm text-muted-foreground">
                    Enter the weight of graded items in kilograms
                </p>
            </div>

            {/* Graded At Date */}
            <div className="grid gap-2">
                <Label htmlFor="graded_at">Graded At *</Label>
                <CalendarInput
                    id='graded_at'
                    value={formData.graded_at}
                    onChange={(e) => handleInputChange('graded_at', e.target.value)}
                 />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
                <Button 
                    type="submit" 
                    disabled={isSubmitting || maxAvailableWeight === 0}
                >
                    {isSubmitting ? 'Creating...' : 'Create Graded Item'}
                </Button>
            </div>
        </form>
    );
}
