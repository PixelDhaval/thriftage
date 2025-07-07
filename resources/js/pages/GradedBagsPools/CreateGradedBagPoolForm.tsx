import { AsyncSelectInput } from '@/components/ui/async-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { printGradedBarcodes } from '@/utils/printGradedBarcodes';
import axios from 'axios';
import { AlertCircle, Info, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface BatchProgress {
    current: number;
    total: number;
    isProcessing: boolean;
    isPrinting: boolean;
    currentBatch: any[];
}

export default function CreateGradedBagPoolForm({ isOpen, onClose, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        item_id: '',
        grade_id: '',
        weight_id: '',
        quantity: 1,
        weight_value: 0, // Total weight in kg for all bags
    });
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [weights, setWeights] = useState<any[]>([]);
    const [availableStock, setAvailableStock] = useState<number>(0);
    const [stockInfo, setStockInfo] = useState<any>(null);
    const [isWeightTypePair, setIsWeightTypePair] = useState(false);
    const [weightType, setWeightType] = useState('kg');
    const [batchProgress, setBatchProgress] = useState<BatchProgress>({
        current: 0,
        total: 0,
        isProcessing: false,
        isPrinting: false,
        currentBatch: [],
    });

    // Fetch grades on component mount
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const gradesResponse = await axios.get('/api/grades');
                setGrades(gradesResponse.data);
            } catch (error) {
                console.error('Error fetching grades:', error);
                toast.error('Failed to load grades.');
            }
        };

        if (isOpen) {
            fetchGrades();
            // Reset form when dialog opens
            setFormData({
                item_id: '',
                grade_id: '',
                weight_id: '',
                quantity: 1,
                weight_value: 0,
            });
            setSelectedItem(null);
            setWeightType('kg');
            setIsWeightTypePair(false);
        }
    }, [isOpen]);

    // When item is selected, check for default weight and update grade
    // Also fetch weights based on section's weight_type
    useEffect(() => {
        if (selectedItem) {
            // Update grade if item has a default grade
            if (selectedItem.grade_id) {
                setFormData((prev) => ({
                    ...prev,
                    grade_id: selectedItem.grade_id.toString(),
                }));
            }

            // Set weight type based on section
            if (selectedItem.section?.weight_type) {
                const sectionWeightType = selectedItem.section.weight_type;
                setWeightType(sectionWeightType);
                setIsWeightTypePair(sectionWeightType === 'pair');

                // Remember the default weight ID before fetching weights
                const defaultWeightId = selectedItem.default_weight_id;

                // Fetch weights filtered by the section's weight_type
                const fetchWeightsForSection = async () => {
                    try {
                        const weightsResponse = await axios.get('/api/weights', {
                            params: { weight_type: sectionWeightType },
                        });

                        // Set weights first
                        setWeights(weightsResponse.data);

                        // After setting weights, check if default weight exists in the response data
                        if (defaultWeightId) {
                            setTimeout(() => {
                                setFormData((prev) => ({
                                    ...prev,
                                    weight_id: defaultWeightId.toString(), // Ensure weight_id is a string
                                }));
                            }, 100);
                        }

                        console.log(defaultWeightId);
                    } catch (error) {
                        console.error('Error fetching weights for section:', error);
                        toast.error('Failed to load weights for this section.');
                    }
                };

                fetchWeightsForSection();
            }
        } else {
            // Reset weights when no item is selected
            setWeights([]);
            setWeightType('kg');
            setIsWeightTypePair(false);
        }
    }, [selectedItem]);

    // Check stock availability when item, grade, or quantity changes
    useEffect(() => {
        const checkStock = async () => {
            if (formData.item_id && formData.grade_id && formData.weight_id) {
                try {
                    // Calculate required weight
                    let requiredWeight;

                    if (isWeightTypePair) {
                        // For pair type, we use the total weight directly
                        requiredWeight = formData.weight_value;
                    } else {
                        // For kg type, we calculate based on weight value × quantity
                        const selectedWeight = weights.find((w) => w.id.toString() === formData.weight_id);
                        requiredWeight = formData.quantity * parseFloat(selectedWeight?.weight || '0');
                    }

                    const response = await axios.post('/api/graded-stock/check-availability', {
                        item_id: formData.item_id,
                        grade_id: formData.grade_id,
                        required_weight: requiredWeight,
                        include_pair_info: isWeightTypePair,
                    });

                    setStockInfo(response.data);
                    setAvailableStock(response.data.available_weight);
                } catch (error) {
                    console.error('Error checking stock:', error);
                    setStockInfo(null);
                    setAvailableStock(0);
                }
            } else {
                setStockInfo(null);
                setAvailableStock(0);
            }
        };

        checkStock();
    }, [formData.item_id, formData.grade_id, formData.weight_id, formData.quantity, formData.weight_value, weights, isWeightTypePair]);

    const handleItemChange = (selected: any) => {
        setSelectedItem(selected);
        setFormData((prev) => ({
            ...prev,
            item_id: selected?.id || '',
            weight_id: selected?.default_weight_id || '', // Reset weight when item changes
        }));
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const createBatch = async (batchData: any) => {
        const response = await axios.post('/api/graded-bags-pools/batch', batchData, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        return response.data;
    };

    const processBatches = async () => {
        const totalQuantity = formData.quantity;
        const batchSize = 10;
        const totalBatches = Math.ceil(totalQuantity / batchSize);

        setBatchProgress({
            current: 0,
            total: totalBatches,
            isProcessing: true,
            isPrinting: false,
            currentBatch: [],
        });

        try {
            const selectedWeight = weights.find((w) => w.id.toString() === formData.weight_id);
            const selectedGrade = grades.find((g) => g.id.toString() === formData.grade_id);

            for (let i = 0; i < totalBatches; i++) {
                const currentBatchSize = Math.min(batchSize, totalQuantity - i * batchSize);

                // Update progress
                setBatchProgress((prev) => ({
                    ...prev,
                    current: i + 1,
                    isProcessing: true,
                    isPrinting: false,
                }));

                // Prepare batch data based on weight type
                let batchData: any = {
                    item_id: formData.item_id,
                    grade_id: formData.grade_id,
                    weight_id: formData.weight_id,
                    quantity: currentBatchSize,
                };

                // Add weight data for pair weight type
                if (isWeightTypePair) {
                    // Calculate weight per batch
                    const weightPerBatch = (formData.weight_value / totalQuantity) * currentBatchSize;
                    batchData.weight = weightPerBatch;
                }

                const response = await createBatch(batchData);
                const bags = response.graded_bags_pools;

                // Update progress with current batch
                setBatchProgress((prev) => ({
                    ...prev,
                    currentBatch: bags,
                    isProcessing: false,
                    isPrinting: true,
                }));

                // Print barcodes using the utility function
                await printGradedBarcodes({
                    bags,
                    partyName: 'Graded Items',
                    weightValue: selectedWeight?.weight || 'Unknown',
                    itemName: selectedItem?.name || 'Unknown',
                    itemSection: selectedItem?.section?.name,
                    gradeName: selectedGrade?.name || 'Unknown',
                    weightType: weightType,
                    pairCount: isWeightTypePair ? parseInt(selectedWeight?.weight) : undefined,
                });

                toast.success(`Batch ${i + 1}/${totalBatches} completed: ${currentBatchSize} graded bags created and printed.`);

                // Small delay between batches
                if (i < totalBatches - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }

            // Reset progress
            setBatchProgress({
                current: 0,
                total: 0,
                isProcessing: false,
                isPrinting: false,
                currentBatch: [],
            });

            toast.success(`All ${totalQuantity} graded bags created and printed successfully!`);

            // Reset form
            setFormData({
                item_id: '',
                grade_id: '',
                weight_id: '',
                quantity: 1,
                weight_value: 0,
            });
            setSelectedItem(null);

            onSuccess?.();
        } catch (error: any) {
            console.error('Error in batch processing:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to process batches. Please try again later.');
            }

            setBatchProgress({
                current: 0,
                total: 0,
                isProcessing: false,
                isPrinting: false,
                currentBatch: [],
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.item_id || !formData.grade_id || !formData.weight_id || !formData.quantity) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.quantity < 1 || formData.quantity > 100) {
            toast.error('Quantity must be between 1 and 100');
            return;
        }

        // Validate for pair weight type
        if (isWeightTypePair && formData.weight_value <= 0) {
            toast.error('Please enter a valid total weight value (greater than 0)');
            return;
        }

        // Check stock availability
        if (stockInfo && !stockInfo.is_sufficient) {
            toast.error(`Insufficient stock. Available: ${stockInfo.available_weight}kg, Required: ${stockInfo.required_weight}kg`);
            return;
        }

        setIsSubmitting(true);

        if (formData.quantity <= 10) {
            // Process single batch with printing
            try {
                // Prepare request data
                let requestData: any = {
                    ...formData,
                };

                // For pair weight type, send total weight
                if (isWeightTypePair) {
                    requestData.weight = formData.weight_value;
                }

                const response = await axios.post('/graded-bags-pools', requestData, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });

                const bags = response.data.graded_bags_pools || [];

                toast.success(`${formData.quantity} graded bags created successfully!`);

                // Print the labels
                if (bags.length > 0 && selectedItem) {
                    const selectedWeight = weights.find((w) => w.id.toString() === formData.weight_id);
                    const selectedGrade = grades.find((g) => g.id.toString() === formData.grade_id);

                    try {
                        await printGradedBarcodes({
                            bags,
                            partyName: 'Graded Items',
                            weightValue: selectedWeight?.weight || 'Unknown',
                            itemName: selectedItem?.name || 'Unknown',
                            itemSection: selectedItem?.section?.name,
                            gradeName: selectedGrade?.name || 'Unknown',
                            weightType: weightType,
                            pairCount: isWeightTypePair ? parseInt(selectedWeight?.weight) : undefined,
                        });
                        toast.success('Labels printed successfully!');
                    } catch (printError) {
                        console.error('Print error:', printError);
                        toast.error('Graded bags created but printing failed. You can print them later.');
                    }
                }

                // Reset form
                setFormData({
                    item_id: '',
                    grade_id: '',
                    weight_id: '',
                    quantity: 1,
                    weight_value: 0,
                });
                setSelectedItem(null);

                onSuccess?.();
            } catch (error: any) {
                console.error('Error creating graded bags:', error);

                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error('Failed to create graded bags. Please try again later.');
                }
            }
        } else {
            // Process in batches with printing
            await processBatches();
        }

        setIsSubmitting(false);
    };

    const isProcessingBatches = batchProgress.isProcessing || batchProgress.isPrinting;
    const progressPercentage = batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0;

    // For pair type, we only need total weight field
    const renderPairWeightField = () => {
        if (!isWeightTypePair) return null;

        return (
            <div className="grid gap-2">
                <Label htmlFor="weight_value">Total Weight (kg) *</Label>
                <Input
                    id="weight_value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.weight_value}
                    onChange={(e) => handleInputChange('weight_value', parseFloat(e.target.value) || 0)}
                    placeholder="Enter total weight for all bags"
                    required={isWeightTypePair}
                />
                <p className="text-muted-foreground text-sm">Enter the total weight in kg for all {formData.quantity} bags</p>
            </div>
        );
    };

    // Render stock information display with pair information when applicable
    const renderStockInfo = () => {
        if (!stockInfo) return null;

        const isSufficient = stockInfo.is_sufficient;

        return (
            <div className={`rounded-lg border p-3 ${isSufficient ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className={`text-sm ${isSufficient ? 'text-green-900' : 'text-red-900'}`}>
                    <div className="mb-1 font-medium">Stock Availability:</div>
                    <div className="space-y-1">
                        <div>
                            Available: <span className="font-bold">{stockInfo.available_weight} kg</span>
                        </div>
                        {isWeightTypePair && stockInfo.available_pair !== undefined && (
                            <div>
                                Available Pairs: <span className="font-bold">{stockInfo.available_pair} pairs</span>
                            </div>
                        )}
                        <div>
                            Required: <span className="font-bold">{stockInfo.required_weight} kg</span>
                        </div>
                        {isWeightTypePair && formData.pair > 0 && (
                            <div>
                                Required Pairs: <span className="font-bold">{formData.pair * formData.quantity} pairs</span>
                            </div>
                        )}
                        {!isSufficient && (
                            <div className="text-red-700">
                                Shortage: <span className="font-bold">{stockInfo.shortage} kg</span>
                            </div>
                        )}
                    </div>
                    {isSufficient ? (
                        <div className="mt-2 font-medium text-green-700">✓ Sufficient stock available</div>
                    ) : (
                        <div className="mt-2 font-medium text-red-700">✗ Insufficient stock</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Graded Bag Pool</DialogTitle>
                    <DialogDescription>Create new graded bags. Press Ctrl+O to open this dialog.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Item Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="item">Item *</Label>
                        <AsyncSelectInput
                            route="/api/items/select"
                            value={selectedItem}
                            onChange={handleItemChange}
                            placeholder="Select item"
                            renderOption={(option) => {
                                console.log(option);
                                return (
                                    <div className="flex items-center justify-between">
                                        <span>{option.id} - {option.name}</span>
                                        <span className="flex items-center gap-2">
                                            <Badge variant="outline">{option.grade?.name + ' Grade' || 'No Grade'}</Badge>
                                            <Badge variant={option.default_weight?.weight ? 'default' : 'secondary'}>
                                                {option.default_weight?.weight
                                                    ? `${option.default_weight.weight} ${option.section?.weight_type?.toUpperCase()}`
                                                    : 'No Default Weight'}
                                            </Badge>
                                        </span>
                                    </div>
                                );
                            }}
                            renderSelected={(option) => option.name}
                        />
                        {selectedItem?.section?.weight_type && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Info className="h-4 w-4" />
                                <span>Section weight type: {selectedItem.section.weight_type.toUpperCase()}</span>
                            </div>
                        )}
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
                        {formData.grade_id && selectedItem?.grade_id === parseInt(formData.grade_id) && (
                            <div className="text-muted-foreground text-xs">Default grade for this item</div>
                        )}
                    </div>

                    {/* Weight Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="weight">Weight Type *</Label>
                        <Select
                            value={formData.weight_id}
                            onValueChange={(value) => handleInputChange('weight_id', value)}
                            required
                            disabled={weights.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={weights.length === 0 ? 'Select an item first' : 'Select weight'} />
                            </SelectTrigger>
                            <SelectContent>
                                {weights.map((weight) => (
                                    <SelectItem key={weight.id} value={weight.id.toString()}>
                                        {weight.weight} {weight.weight_type === 'kg' ? 'kg' : 'pairs'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formData.weight_id && selectedItem?.default_weight_id === parseInt(formData.weight_id) && (
                            <div className="text-muted-foreground text-xs">Default weight for this item</div>
                        )}
                        {formData.weight_id && (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">Type: {weightType.toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max="100"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                            placeholder="Enter quantity (1-100)"
                            required
                        />
                        {formData.weight_id && !isWeightTypePair && (
                            <div className="text-muted-foreground text-sm">
                                {(() => {
                                    const selectedWeight = weights.find((w) => w.id.toString() === formData.weight_id);
                                    const totalWeight = formData.quantity * parseFloat(selectedWeight?.weight || '0');
                                    return `Total weight required: ${totalWeight}kg`;
                                })()}
                            </div>
                        )}
                        {formData.quantity > 10 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Quantities over 10 will be processed in batches of 10 with automatic printing.</span>
                            </div>
                        )}
                    </div>

                    {/* Total weight field for pair weight type */}
                    {renderPairWeightField()}

                    {/* Stock Information Display */}
                    {renderStockInfo()}

                    {/* Batch Processing Progress */}
                    {isProcessingBatches && (
                        <div className="rounded-lg border bg-blue-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Printer className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">
                                    {batchProgress.isPrinting ? 'Printing Batch' : 'Creating Batch'} {batchProgress.current} of {batchProgress.total}
                                </span>
                            </div>

                            <Progress value={progressPercentage} className="mb-2" />

                            <div className="text-sm text-blue-700">
                                {batchProgress.isPrinting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-pulse">🖨️</div>
                                        <span>Printing {batchProgress.currentBatch.length} graded barcodes... Please ensure printer is ready.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin">⏳</div>
                                        <span>Creating graded bags...</span>
                                    </div>
                                )}
                            </div>

                            {batchProgress.currentBatch.length > 0 && (
                                <div className="mt-3 rounded border bg-white p-2">
                                    <div className="mb-1 text-xs text-gray-600">Current Batch Barcodes:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {batchProgress.currentBatch.slice(0, 5).map((bag: any) => (
                                            <span key={bag.id} className="rounded bg-gray-100 px-1 font-mono text-xs">
                                                {bag.barcode}
                                            </span>
                                        ))}
                                        {batchProgress.currentBatch.length > 5 && (
                                            <span className="text-xs text-gray-500">+{batchProgress.currentBatch.length - 5} more</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isProcessingBatches || (stockInfo && !stockInfo.is_sufficient)}
                            className="gap-2"
                        >
                            {isProcessingBatches ? (
                                <>
                                    <div className="animate-spin">⏳</div>
                                    Processing...
                                </>
                            ) : isSubmitting ? (
                                'Creating...'
                            ) : (
                                <>
                                    <Printer className="h-4 w-4" />
                                    Create & Print Labels
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
