import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { type ImportBag } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { printBarcodes } from '@/utils/printBarcodes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    importId: number;
    partyId: number;
    weightId: number;
    partyName?: string;
    weightValue?: string;
}

export default function ImportBagsWithBarcodesDialog({ 
    isOpen, 
    onClose, 
    importId, 
    partyId, 
    weightId, 
    partyName, 
    weightValue 
}: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [bagToDelete, setBagToDelete] = useState<ImportBag | null>(null);
    const [importData, setImportData] = useState<any>(null);
    
    const userPermissions = usePage().props.auth?.permissions || [];

    const handleImportBagDelete = (importBag: ImportBag) => {
        setBagToDelete(importBag);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (bagToDelete) {
            try {
                await axios.delete(`/import-bags/${bagToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Import bag ${bagToDelete.barcode} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting import bag:', error);
                toast.error('Failed to delete import bag. Please try again later.');
            }
        }
        setIsDeleteDialogOpen(false);
        setBagToDelete(null);
    };

    useEffect(() => {
        const fetchImportData = async () => {
            try {
                const response = await axios.get(`/api/imports/${importId}`);
                setImportData(response.data);
            } catch (error) {
                console.error('Error fetching import data:', error);
            }
        };

        if (isOpen) {
            fetchImportData();
        }
    }, [importId, isOpen]);

    // Print individual barcode
    const handlePrintSingleBarcode = async (importBag: ImportBag) => {
        try {
            await printBarcodes({
                bags: [importBag],
                partyName: partyName || 'Unknown',
                containerNo: importData?.container_no,
                movementDate: importData?.movement_date,
                weightValue: weightValue || 'Unknown',
                isSingle: true
            });
            toast.success(`Print initiated for barcode ${importBag.barcode}.`);
        } catch (error) {
            console.error('Error printing barcode:', error);
            toast.error('Failed to print barcode.');
        }
    };

    // DataTable configurations for individual import bags
    const importBagFilterableColumns = [
        { label: 'Barcode', key: 'barcode' },
        { label: 'Status', key: 'status' },
        { label: 'Created At', key: 'created_at' },
    ];

    const importBagColumns = [
        {
            id: 'barcode',
            header: 'Barcode',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{row.original.barcode}</span>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        row.original.status === 'opened' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {row.original.status}
                    </span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrintSingleBarcode(row.original);
                        }}
                        className="h-8 px-2"
                        title="Print this barcode label"
                    >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Import Bags - {partyName}</DialogTitle>
                        <DialogDescription>
                            Individual bags for {partyName} - Weight: {weightValue} kg
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        <DataTable<ImportBag>
                            filterableColumns={importBagFilterableColumns}
                            route="/api/import-bags-with-barcodes"
                            columns={importBagColumns}
                            pageSize={20}
                            params={{ 
                                import_id: importId,
                                party_id: partyId,
                                weight_id: weightId
                            }}
                            {...(userPermissions.includes('import-bags-delete') && {
                                onDelete: handleImportBagDelete
                            })}
                        />
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setBagToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Import Bag"
                description={`Are you sure you want to delete import bag with barcode ${bagToDelete?.barcode}? This action cannot be undone.`}
            />
        </>
    );
}
