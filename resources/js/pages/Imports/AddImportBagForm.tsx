import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsyncSelectInput } from '@/components/ui/async-select';
import { Progress } from '@/components/ui/progress';
import { FormEventHandler, useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { printBarcodes } from '@/utils/printBarcodes';
import { Printer, AlertCircle } from 'lucide-react';
import { Import, Party } from '@/types';

interface Props {
    importData: Import;
    onSuccess?: () => void;
}

interface Weight {
    id: number;
    weight: string;
}

interface BatchProgress {
    current: number;
    total: number;
    isProcessing: boolean;
    isPrinting: boolean;
    currentBatch: any[];
}

export default function AddImportBagForm({ importData, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [weights, setWeights] = useState<Weight[]>([]);
    const [batchProgress, setBatchProgress] = useState<BatchProgress>({
        current: 0,
        total: 0,
        isProcessing: false,
        isPrinting: false,
        currentBatch: []
    });
    
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        import_id: importData.id,
        party_id: '',
        weight_id: '',
        quantity: 1,
    });

    const [selectedParty, setSelectedParty] = useState<Party | null>(null);

    useEffect(() => {
        const fetchWeights = async () => {
            try {
                const response = await axios.get('/api/weights');
                setWeights(response.data);
            } catch (error) {
                console.error('Error fetching weights:', error);
                toast.error('Failed to load weights.');
            }
        };
        fetchWeights();
        if(importData && importData.type === 'local'){
            setSelectedParty(importData.party);
            setData('party_id', importData.party.id);
        }
    }, [importData]);

    const createBatch = async (batchData: any) => {
        const response = await axios.post('/import-bags/batch', batchData, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return response.data;
    };

    const processBatches = async () => {
        const totalQuantity = data.quantity;
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
                    import_id: data.import_id,
                    party_id: data.party_id,
                    weight_id: data.weight_id,
                    quantity: currentBatchSize
                };

                const response = await createBatch(batchData);
                const bags = response.import_bags;

                // Update progress with current batch
                setBatchProgress(prev => ({
                    ...prev,
                    currentBatch: bags,
                    isProcessing: false,
                    isPrinting: true
                }));

                // Get party and weight details for printing
                const selectedWeight = weights.find(w => w.id.toString() === data.weight_id);
                

                // Print barcodes using the utility function
                await printBarcodes({
                    bags,
                    partyName: selectedParty.name,
                    containerNo: importData?.container_no,
                    movementDate: importData?.movement_date,
                    weightValue: selectedWeight?.weight || 'Unknown'
                });

                toast.success(`Batch ${i + 1}/${totalBatches} completed: ${currentBatchSize} bags created and printed.`);
            }

            // Reset progress
            setBatchProgress({
                current: 0,
                total: 0,
                isProcessing: false,
                isPrinting: false,
                currentBatch: []
            });

            toast.success(`All ${totalQuantity} bags created and printed successfully!`);
            reset();
            onSuccess?.();

        } catch (error: any) {
            console.error('Error in batch processing:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key: any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
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

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        if (data.quantity <= 10) {
            // Process single batch with printing
            try {
                const response = await axios.post('/import-bags', data, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                const bags = response.data.import_bags || [];
                const barcodes = bags.map((bag: any) => bag.barcode);
                
                toast.success(`${data.quantity} bags created successfully!`);
                
                // Print the labels using the utility function
                if (bags.length > 0 && selectedParty) {
                    const selectedWeight = weights.find(w => w.id.toString() === data.weight_id);
                    
                    try {
                        await printBarcodes({
                            bags,
                            partyName: selectedParty.name,
                            containerNo: importData?.container_no,
                            movementDate: importData?.movement_date,
                            weightValue: selectedWeight?.weight || 'Unknown'
                        });
                        toast.success('Labels printed successfully!');
                    } catch (printError) {
                        console.error('Print error:', printError);
                        toast.error('Bags created but printing failed. You can print them later.');
                    }
                }
                
                reset();
                onSuccess?.();
            } catch (error: any) {
                console.error('Error creating import bags:', error);
                
                if (error.response?.status === 422) {
                    const validationErrors = error.response.data.errors;
                    Object.keys(validationErrors).forEach((key: any) => {
                        setError(key, validationErrors[key][0]);
                    });
                    toast.error('Please check the form for errors.');
                } else {
                    toast.error('Failed to create import bags. Please try again later.');
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                { importData.type === 'container' && (
                    <div className="grid gap-2">
                        <Label htmlFor="party_id">Supplier</Label>
                        <AsyncSelectInput
                            route="/api/parties/select"
                            params={{ type: 'supplier' }}
                            value={selectedParty}
                            onChange={(selected: any) => {
                                setSelectedParty(selected)
                                setData('party_id', selected?.id || '');
                            }}
                            placeholder="Select a supplier"
                            renderOption={(option) => option.name}
                            renderSelected={(option) => option.name}
                        />
                        {errors.party_id && (
                            <p className="text-destructive text-sm">{errors.party_id}</p>
                        )}
                    </div>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="weight_id">Weight</Label>
                    <Select value={data.weight_id.toString()} onValueChange={(value) => setData('weight_id', value)}>
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
                    {errors.weight_id && (
                        <p className="text-destructive text-sm">{errors.weight_id}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={data.quantity}
                        onChange={e => setData('quantity', parseInt(e.target.value))}
                        placeholder="Enter quantity"
                        required
                    />
                    {errors.quantity && (
                        <p className="text-destructive text-sm">{errors.quantity}</p>
                    )}
                    {data.quantity > 10 && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Quantities over 10 will be processed in batches of 10 with automatic printing.</span>
                        </div>
                    )}
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
                                    <span>Printing {batchProgress.currentBatch.length} barcodes... Please ensure printer is ready.</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin">⏳</div>
                                    <span>Creating import bags...</span>
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
            </div>

            <DialogFooter>
                <Button 
                    type="submit" 
                    disabled={isSubmitting || isProcessingBatches}
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
            </DialogFooter>
        </form>
    );
}
