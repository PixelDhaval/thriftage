import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { printGradedBarcodes } from '@/utils/printGradedBarcodes';
import { Printer, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
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
    });
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [weights, setWeights] = useState<any[]>([]);
    const [availableStock, setAvailableStock] = useState<number>(0);
    const [stockInfo, setStockInfo] = useState<any>(null);
    const [batchProgress, setBatchProgress] = useState<BatchProgress>({
        current: 0,
        total: 0,
        isProcessing: false,
        isPrinting: false,
        currentBatch: []
    });

    // Fetch grades and weights on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gradesResponse, weightsResponse] = await Promise.all([
                    axios.get('/api/grades'),
                    axios.get('/api/weights')
                ]);
                setGrades(gradesResponse.data);
                setWeights(weightsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load form data.');
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Check stock availability when item, grade, or quantity changes
    useEffect(() => {
        const checkStock = async () => {
            if (formData.item_id && formData.grade_id && formData.weight_id && formData.quantity) {
                try {
                    const selectedWeight = weights.find(w => w.id.toString() === formData.weight_id);
                    const requiredWeight = formData.quantity * parseFloat(selectedWeight?.weight || '0');

                    const response = await axios.post('/api/graded-stock/check-availability', {
                        item_id: formData.item_id,
                        grade_id: formData.grade_id,
                        required_weight: requiredWeight
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
    }, [formData.item_id, formData.grade_id, formData.weight_id, formData.quantity, weights]);

    const handleItemChange = (selected: any) => {
        setSelectedItem(selected);
        setFormData(prev => ({ ...prev, item_id: selected?.id || '' }));
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const createBatch = async (batchData: any) => {
        const response = await axios.post('/api/graded-bags-pools/batch', batchData, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
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
            currentBatch: []
        });

        try {
            const selectedWeight = weights.find(w => w.id.toString() === formData.weight_id);
            const selectedGrade = grades.find(g => g.id.toString() === formData.grade_id);

            for (let i = 0; i < totalBatches; i++) {
                const currentBatchSize = Math.min(batchSize, totalQuantity - (i * batchSize));
                
                // Update progress
                setBatchProgress(prev => ({
                    ...prev,
                    current: i + 1,
                    isProcessing: true,
                    isPrinting: false
                }));

                // Create batch
                const batchData = {
                    item_id: formData.item_id,
                    grade_id: formData.grade_id,
                    weight_id: formData.weight_id,
                    quantity: currentBatchSize
                };

                const response = await createBatch(batchData);
                const bags = response.graded_bags_pools;

                // Update progress with current batch
                setBatchProgress(prev => ({
                    ...prev,
                    currentBatch: bags,
                    isProcessing: false,
                    isPrinting: true
                }));

                // Print barcodes using the utility function
                await printGradedBarcodes({
                    bags,
                    partyName: 'Graded Items',
                    weightValue: selectedWeight?.weight || 'Unknown',
                    itemName: selectedItem?.name || 'Unknown',
                    itemSection: selectedItem?.section?.name,
                    gradeName: selectedGrade?.name || 'Unknown',
                });

                toast.success(`Batch ${i + 1}/${totalBatches} completed: ${currentBatchSize} graded bags created and printed.`);

                // Small delay between batches
                if (i < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Reset progress
            setBatchProgress({
                current: 0,
                total: 0,
                isProcessing: false,
                isPrinting: false,
                currentBatch: []
            });

            toast.success(`All ${totalQuantity} graded bags created and printed successfully!`);
            
            // Reset form
            setFormData({
                item_id: '',
                grade_id: '',
                weight_id: '',
                quantity: 1,
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
                currentBatch: []
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

        // Check stock availability
        if (stockInfo && !stockInfo.is_sufficient) {
            toast.error(`Insufficient stock. Available: ${stockInfo.available_weight}kg, Required: ${stockInfo.required_weight}kg`);
            return;
        }

        setIsSubmitting(true);

        if (formData.quantity <= 10) {
            // Process single batch with printing
            try {
                const response = await axios.post('/graded-bags-pools', formData, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                const bags = response.data.graded_bags_pools || [];
                
                toast.success(`${formData.quantity} graded bags created successfully!`);
                
                // Print the labels using the utility function
                if (bags.length > 0 && selectedItem) {
                    const selectedWeight = weights.find(w => w.id.toString() === formData.weight_id);
                    const selectedGrade = grades.find(g => g.id.toString() === formData.grade_id);
                    
                    try {
                        await printGradedBarcodes({
                            bags,
                            partyName: 'Graded Items',
                            weightValue: selectedWeight?.weight || 'Unknown',
                            itemName: selectedItem?.name || 'Unknown',
                            itemSection: selectedItem?.section?.name,
                            gradeName: selectedGrade?.name || 'Unknown',
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Graded Bag Pool</DialogTitle>
                    <DialogDescription>
                        Create new graded bags. Press Ctrl+O to open this dialog.
                    </DialogDescription>
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
                            renderOption={(option) => `${option.name} - ${option.section?.name || 'No Section'}`}
                            renderSelected={(option) => option.name}
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

                    {/* Weight Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="weight">Weight *</Label>
                        <Select value={formData.weight_id} onValueChange={(value) => handleInputChange('weight_id', value)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                            </SelectTrigger>
                            <SelectContent>
                                {weights.map((weight) => (
                                    <SelectItem key={weight.id} value={weight.id.toString()}>
                                        {weight.weight} kg
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stock Information Display */}
                    {stockInfo && (
                        <div className={`p-3 border rounded-lg ${stockInfo.is_sufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`text-sm ${stockInfo.is_sufficient ? 'text-green-900' : 'text-red-900'}`}>
                                <div className="font-medium mb-1">Stock Availability:</div>
                                <div className="space-y-1">
                                    <div>Available: <span className="font-bold">{stockInfo.available_weight} kg</span></div>
                                    <div>Required: <span className="font-bold">{stockInfo.required_weight} kg</span></div>
                                    {!stockInfo.is_sufficient && (
                                        <div className="text-red-700">
                                            Shortage: <span className="font-bold">{stockInfo.shortage} kg</span>
                                        </div>
                                    )}
                                </div>
                                {stockInfo.is_sufficient ? (
                                    <div className="mt-2 text-green-700 font-medium">✓ Sufficient stock available</div>
                                ) : (
                                    <div className="mt-2 text-red-700 font-medium">✗ Insufficient stock</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max="100"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                            placeholder="Enter quantity (1-100)"
                            required
                        />
                        {formData.weight_id && (
                            <div className="text-sm text-muted-foreground">
                                {(() => {
                                    const selectedWeight = weights.find(w => w.id.toString() === formData.weight_id);
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
                        <p className="text-sm text-muted-foreground">
                            Graded bags will be created with automatic barcode printing.
                        </p>
                    </div>

                    {/* Batch Processing Progress */}
                    {isProcessingBatches && (
                        <div className="border rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center gap-2 mb-2">
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
                                <div className="mt-3 p-2 bg-white rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Current Batch Barcodes:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {batchProgress.currentBatch.slice(0, 5).map((bag: any) => (
                                            <span key={bag.id} className="text-xs font-mono bg-gray-100 px-1 rounded">
                                                {bag.barcode}
                                            </span>
                                        ))}
                                        {batchProgress.currentBatch.length > 5 && (
                                            <span className="text-xs text-gray-500">
                                                +{batchProgress.currentBatch.length - 5} more
                                            </span>
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
