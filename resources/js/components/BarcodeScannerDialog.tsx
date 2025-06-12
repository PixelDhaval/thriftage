import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { AlertCircle, Camera, Keyboard, Package, Scan, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

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
    const [isMobile, setIsMobile] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const scanningRef = useRef<boolean>(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            setIsMobile(isMobileDevice);
        };
        checkMobile();
    }, []);

    // Audio functions for sound feedback
    const playSuccessSound = () => {
        try {
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
        } catch (error) {
            // Ignore audio errors
        }
    };

    const playAlertSound = () => {
        try {
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
        } catch (error) {
            // Ignore audio errors
        }
    };

    // Initialize barcode reader
    useEffect(() => {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            'CODE_128',
            'CODE_39',
            'EAN_13',
            'EAN_8',
            'UPC_A',
            'UPC_E'
        ]);
        
        readerRef.current = new BrowserMultiFormatReader(hints);
        
        return () => {
            if (readerRef.current) {
                readerRef.current.reset();
            }
        };
    }, []);

    // Handle barcode detection from camera
    const handleBarcodeDetected = (result: string) => {
        if (result && result.trim() && !scanningRef.current) {
            scanningRef.current = true;
            setBarcode(result.trim());
            toast.success('Barcode detected!');
            playSuccessSound();
            
            // Auto-submit the barcode
            setTimeout(() => {
                handleBarcodeSubmit(null, result.trim());
                scanningRef.current = false;
            }, 500);
        }
    };

    // Start camera and scanning
    const startScanning = async () => {
        if (!readerRef.current || !videoRef.current) return;

        try {
            setIsScanning(true);
            setCameraError(null);
            scanningRef.current = false;

            // Get camera constraints
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    aspectRatio: { ideal: 16/9 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                
                // Start decoding from video element
                readerRef.current.decodeFromVideoDevice(
                    undefined, // Use default camera
                    videoRef.current,
                    (result, error) => {
                        if (result) {
                            handleBarcodeDetected(result.getText());
                        }
                        // Don't log NotFoundException as it's normal when no barcode is detected
                        if (error && !error.message.includes('NotFoundException')) {
                            console.warn('Decode error:', error);
                        }
                    }
                );
            }
        } catch (error: any) {
            console.error('Camera error:', error);
            setIsScanning(false);
            
            if (error?.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access and try again.');
                toast.error('Camera permission denied. Please check permissions.');
            } else if (error?.name === 'NotFoundError') {
                setCameraError('No camera found. Please ensure your device has a camera.');
                toast.error('No camera found on this device.');
            } else {
                setCameraError('Unable to access camera. Please check permissions and try again.');
                toast.error('Camera access failed. Please check permissions.');
            }
        }
    };

    // Stop scanning
    const stopScanning = () => {
        if (readerRef.current) {
            readerRef.current.reset();
        }
        
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        
        setIsScanning(false);
        scanningRef.current = false;
    };

    // Handle camera scanner toggle
    const toggleCameraScanner = () => {
        if (showCameraScanner) {
            stopScanning();
            setShowCameraScanner(false);
        } else {
            setShowCameraScanner(true);
            setCameraError(null);
            setTimeout(startScanning, 100);
        }
    };

    // Stop scanning when dialog closes
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
            setShowCameraScanner(false);
        }
    }, [isOpen]);

    // Stop scanning when camera scanner is closed
    useEffect(() => {
        if (!showCameraScanner) {
            stopScanning();
        }
    }, [showCameraScanner]);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current && !showCameraScanner) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, showCameraScanner]);

    // Reset camera error when scanner is closed
    useEffect(() => {
        if (!showCameraScanner) {
            setCameraError(null);
        }
    }, [showCameraScanner]);

    // Focus input after processing
    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 100);
    };

    const handleBarcodeSubmit = async (e?: React.FormEvent | null, submittedBarcode?: string) => {
        if (e) e.preventDefault();
        
        const barcodeToSubmit = submittedBarcode || barcode.trim();
        
        if (!barcodeToSubmit) {
            toast.error('Please enter a barcode');
            focusInput();
            return;
        }

        setIsProcessing(true);

        try {
            const response = await axios.post('/api/import-bags/scan', 
                { barcode: barcodeToSubmit },
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
                setPendingBarcode(barcodeToSubmit);
                setLastScannedBag(bag);
                playAlertSound(); // Play alert sound for confirmation
                
                // Stop camera scanning temporarily for confirmation dialog
                if (showCameraScanner && isMobile) {
                    stopScanning();
                }
            } else if (type === 'status_changed') {
                // Success - bag status changed and play success sound
                toast.success(message);
                setLastScannedBag({ ...bag, status: new_status });
                setBarcode('');
                playSuccessSound(); // Play success sound
                
                // Refresh DataTable if available
                window.refreshDataTable?.();
                
                // For mobile camera scanning, restart scanning after a short delay
                if (showCameraScanner && isMobile) {
                    setTimeout(() => {
                        if (showCameraScanner && isOpen) {
                            startScanning();
                        }
                    }, 1000);
                } else {
                    focusInput();
                }
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
            
            // For mobile camera scanning, restart scanning after error
            if (showCameraScanner && isMobile) {
                setTimeout(() => {
                    if (showCameraScanner && isOpen) {
                        startScanning();
                    }
                }, 1000);
            } else {
                focusInput();
            }
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
            
            // For mobile camera scanning, restart scanning after confirmation
            if (showCameraScanner && isMobile) {
                setTimeout(() => {
                    if (showCameraScanner && isOpen) {
                        startScanning();
                    }
                }, 500);
            } else {
                focusInput();
            }
        }
    };

    const handleCancelToggle = () => {
        setShowConfirmDialog(false);
        setPendingBarcode('');
        setBarcode('');
        
        // For mobile camera scanning, restart scanning after cancellation
        if (showCameraScanner && isMobile) {
            setTimeout(() => {
                if (showCameraScanner && isOpen) {
                    startScanning();
                }
            }, 500);
        } else {
            focusInput();
        }
    };

    const handleDialogClose = () => {
        setBarcode('');
        setLastScannedBag(null);
        setShowConfirmDialog(false);
        setPendingBarcode('');
        setShowCameraScanner(false);
        setCameraError(null);
        stopScanning();
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
                            {isMobile ? 'Scan with camera or enter barcode manually.' : 'Scan or enter barcode to update bag status. Press Ctrl+I to open this scanner.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Mobile scanner toggle */}
                    {isMobile && (
                        <div className="flex gap-2 mb-4">
                            <Button
                                type="button"
                                variant={!showCameraScanner ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    if (showCameraScanner) {
                                        toggleCameraScanner();
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <Keyboard className="h-4 w-4" />
                                Manual Input
                            </Button>
                            <Button
                                type="button"
                                variant={showCameraScanner ? "default" : "outline"}
                                size="sm"
                                onClick={toggleCameraScanner}
                                className="flex items-center gap-2"
                                disabled={isScanning}
                            >
                                <Camera className="h-4 w-4" />
                                {isScanning ? 'Starting...' : 'Camera Scan'}
                            </Button>
                        </div>
                    )}

                    {/* Camera Scanner */}
                    {showCameraScanner && (
                        <div className="space-y-4">
                            <div className="relative bg-black rounded-lg overflow-hidden">
                                {cameraError ? (
                                    <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                                        <div className="text-center p-4">
                                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">{cameraError}</p>
                                            <Button
                                                onClick={toggleCameraScanner}
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="w-full h-64 object-cover"
                                            playsInline
                                            muted
                                            autoPlay
                                        />
                                        <div className="absolute inset-0 border-2 border-red-500 border-dashed m-8 rounded-lg pointer-events-none">
                                            <div className="absolute top-2 left-2 right-2 text-center">
                                                <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                    {isProcessing ? 'Processing barcode...' : 
                                                     isScanning ? 'Scanning for Code 128 barcode...' : 
                                                     'Starting camera...'}
                                                </span>
                                            </div>
                                        </div>
                                        {isScanning && !isProcessing && (
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                                                    Ready to scan...
                                                </div>
                                            </div>
                                        )}
                                        {isProcessing && (
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                                                    Processing...
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    {isMobile ? 'Point camera at barcode to scan automatically' : 'Camera scanning enabled'}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCameraScanner(false)}
                                    disabled={isScanning && isProcessing}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Close Camera
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Manual Input Form */}
                    {!showCameraScanner && (
                        <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode (Code 128)</Label>
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
                    )}

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
                            {isMobile && ' Camera scanning will resume after this action.'}
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
                            {isMobile ? 'Cancel & Resume Scanning' : 'Cancel'}
                        </Button>
                        
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
