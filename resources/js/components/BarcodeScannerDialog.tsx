import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { AlertCircle, CheckCircle, Package, Scan } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BarcodeScannerDialog({ isOpen, onClose }: Props) {
    const [barcode, setBarcode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastScannedBag, setLastScannedBag] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingBarcode, setPendingBarcode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Audio functions for sound feedback
    const playSuccessSound = () => {
        // Create success sound (higher pitch beep)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };

    const playAlertSound = () => {
        // Create alert sound (lower pitch, longer beep)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(350, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    };

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Focus input after processing
    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 100);
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!barcode.trim()) {
            toast.error('Please enter a barcode');
            focusInput();
            return;
        }

        setIsProcessing(true);

        try {
            const response = await axios.post('/api/import-bags/scan', 
                { barcode: barcode.trim() },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            const { success, message, type, bag, new_status } = response.data;

            if (type === 'already_opened') {
                // Show confirmation dialog for already opened bag and play alert sound
                setShowConfirmDialog(true);
                setPendingBarcode(barcode.trim());
                setLastScannedBag(bag);
                playAlertSound(); // Play alert sound for confirmation
            } else if (type === 'status_changed') {
                // Success - bag status changed and play success sound
                toast.success(message);
                setLastScannedBag({ ...bag, status: new_status });
                setBarcode('');
                focusInput();
                playSuccessSound(); // Play success sound
                
                // Refresh DataTable if available
                window.refreshDataTable?.();
            }

        } catch (error: any) {
            console.error('Error scanning barcode:', error);
            
            if (error.response?.status === 404) {
                toast.error(error.response.data.message || 'Bag not found');
                setLastScannedBag(null);
            } else {
                toast.error('Failed to process barcode. Please try again.');
            }
            
            setBarcode('');
            focusInput();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmToggle = async () => {
        setIsProcessing(true);
        
        try {
            const response = await axios.post('/api/import-bags/toggle-status',
                { 
                    barcode: pendingBarcode,
                    new_status: 'unopened'
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            const { message, bag, new_status } = response.data;
            toast.success(message);
            setLastScannedBag({ ...bag, status: new_status });
            playSuccessSound(); // Play success sound when status is toggled
            
            // Refresh DataTable if available
            window.refreshDataTable?.();
            
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update bag status.');
        } finally {
            setIsProcessing(false);
            setShowConfirmDialog(false);
            setPendingBarcode('');
            setBarcode('');
            focusInput();
        }
    };

    const handleCancelToggle = () => {
        setShowConfirmDialog(false);
        setPendingBarcode('');
        setBarcode('');
        focusInput();
    };

    const handleDialogClose = () => {
        setBarcode('');
        setLastScannedBag(null);
        setShowConfirmDialog(false);
        setPendingBarcode('');
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scan className="h-5 w-5" />
                            Barcode Scanner
                        </DialogTitle>
                        <DialogDescription>
                            Scan or enter barcode to update bag status. Press Ctrl+I to open this scanner.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Barcode</Label>
                            <Input
                                ref={inputRef}
                                id="barcode"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Scan or enter barcode..."
                                disabled={isProcessing}
                                className="font-mono text-center text-lg py-3"
                                autoComplete="off"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isProcessing || !barcode.trim()}
                        >
                            {isProcessing ? 'Processing...' : 'Update Status'}
                        </Button>
                    </form>

                    {/* Last Scanned Bag Info */}
                    {lastScannedBag && (
                        <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4" />
                                <span className="font-medium">Last Scanned Bag</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div>
                                    <strong>Barcode:</strong> <span className="font-mono">{lastScannedBag.barcode}</span>
                                </div>
                                <div>
                                    <strong>Party:</strong> {lastScannedBag.party?.name || 'Unknown'}
                                </div>
                                <div>
                                    <strong>Weight:</strong> {lastScannedBag.weight?.weight || 'Unknown'} kg
                                </div>
                                <div>
                                    <strong>Import:</strong> {lastScannedBag.import?.container_no || 'Unknown'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong>Status:</strong>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        lastScannedBag.status === 'opened' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {lastScannedBag.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={handleDialogClose}>
                            Close Scanner
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Already Opened Bags */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            Bag Already Opened
                        </DialogTitle>
                        <DialogDescription>
                            This bag is already marked as opened. Do you want to change the status to unopened?
                        </DialogDescription>
                    </DialogHeader>

                    {lastScannedBag && (
                        <div className="p-3 border rounded-lg bg-amber-50">
                            <div className="space-y-1 text-sm">
                                <div>
                                    <strong>Barcode:</strong> <span className="font-mono">{lastScannedBag.barcode}</span>
                                </div>
                                <div>
                                    <strong>Party:</strong> {lastScannedBag.party?.name || 'Unknown'}
                                </div>
                                <div>
                                    <strong>Current Status:</strong> 
                                    <span className="ml-2 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                        Opened
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button 
                            onClick={handleConfirmToggle} 
                            disabled={isProcessing}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isProcessing ? 'Updating...' : 'Change to Unopened'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelToggle} disabled={isProcessing}>
                            Cancel
                        </Button>
                        
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
