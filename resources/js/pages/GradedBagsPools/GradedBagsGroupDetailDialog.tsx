import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { printGradedBarcodes } from '@/utils/printGradedBarcodes';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item_id: number;
    grade_id: number;
    weight_id: number;
    created_date: string;
    itemName: string;
    gradeName: string;
    weightValue: string;
    totalQuantity: number;
}

export default function GradedBagsGroupDetailDialog({ 
    isOpen, 
    onClose, 
    item_id,
    grade_id,
    weight_id,
    created_date,
    itemName,
    gradeName,
    weightValue,
    totalQuantity
}: Props) {
    const [weightType, setWeightType] = useState<string>('kg');
    const [itemSectionName, setItemSectionName] = useState<string | undefined>(undefined);

    // Fetch weight type and section info when dialog opens
    useEffect(() => {
        if (isOpen) {
            const fetchDetails = async () => {
                try {
                    // Fetch weight type
                    const weightResponse = await axios.get(`/api/weights/${weight_id}`);
                    if (weightResponse.data && weightResponse.data.weight_type) {
                        setWeightType(weightResponse.data.weight_type);
                    }
                    
                    // Fetch item section
                    const itemResponse = await axios.get(`/api/items/${item_id}`);
                    if (itemResponse.data && itemResponse.data.section) {
                        setItemSectionName(itemResponse.data.section.name);
                    }
                } catch (error) {
                    console.error('Error fetching details:', error);
                }
            };
            
            fetchDetails();
        }
    }, [isOpen, weight_id, item_id]);

    // Print individual graded barcode function
    const handlePrintSingleBarcode = async (gradedBag: any) => {
        try {
            await printGradedBarcodes({
                bags: [gradedBag],
                partyName: 'Graded Items',
                weightValue: gradedBag.weight?.weight || weightValue,
                itemName: gradedBag.item?.name || itemName,
                itemSection: gradedBag.item?.section?.name || itemSectionName,
                gradeName: gradedBag.grade?.name || gradeName,
                isSingle: true,
                weightType: weightType,
                pairCount: weightType === 'pair' ? parseInt(gradedBag.weight?.weight || weightValue) : undefined
            });
            toast.success(`Print initiated for graded barcode ${gradedBag.barcode}.`);
        } catch (error) {
            console.error('Error printing graded barcode:', error);
            toast.error('Failed to print graded barcode.');
        }
    };

    // Print all barcodes in this group
    const handlePrintAllBarcodes = async () => {
        try {
            // Fetch all bags for this combination
            const response = await axios.get('/api/graded-bags-pools-with-barcodes', {
                params: {
                    item_id,
                    grade_id,
                    weight_id,
                    created_date
                }
            });

            const bags = response.data.data || response.data;

            if (bags.length === 0) {
                toast.error('No bags found to print.');
                return;
            }

            // Use the utility function
            await printGradedBarcodes({
                bags,
                partyName: 'Graded Items',
                weightValue: weightValue,
                itemName: itemName,
                itemSection: itemSectionName,
                gradeName: gradeName,
                weightType: weightType,
                pairCount: weightType === 'pair' ? parseInt(weightValue) : undefined
            });

            toast.success(`Print initiated for ${bags.length} barcodes.`);
        } catch (error) {
            console.error('Error fetching bags for printing:', error);
            toast.error('Failed to fetch bags for printing.');
        }
    };

    // DataTable configurations for individual graded bags
    const filterableColumns = [
        { label: 'Barcode', key: 'barcode' },
        { label: 'Created At', key: 'created_at' },
    ];

    const columns = [
        {
            id: 'barcode',
            header: 'Barcode',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{row.original.barcode}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm')}</span>
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
                        title="Print this graded barcode label"
                    >
                        <Printer className="mr-1 h-3 w-3" />
                        Print
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Graded Bags Details</DialogTitle>
                    <DialogDescription>
                        Individual graded bags for {itemName} - {gradeName} - {weightValue} {weightType === 'pair' ? 'pairs' : 'kg'}
                        <br />
                        Created on: {format(new Date(created_date), 'dd/MM/yyyy')} | Total Quantity: {totalQuantity}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex justify-end mb-4">
                    <Button 
                        variant="default" 
                        onClick={handlePrintAllBarcodes}
                        className="flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Print All Labels
                    </Button>
                </div>
                
                <div className="mt-2">
                    <DataTable
                        filterableColumns={filterableColumns}
                        route="/api/graded-bags-pools-with-barcodes"
                        columns={columns}
                        pageSize={20}
                        params={{ 
                            item_id: item_id,
                            grade_id: grade_id,
                            weight_id: weight_id,
                            created_date: created_date
                        }}
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
