import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { printGradedBarcodes } from '@/utils/printGradedBarcodes';
import { format } from 'date-fns';

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

    // Print individual graded barcode function
    const handlePrintSingleBarcode = async (gradedBag: any) => {
        try {
            await printGradedBarcodes({
                bags: [gradedBag],
                partyName: 'Graded Items',
                weightValue: gradedBag.weight?.weight || weightValue,
                itemName: gradedBag.item?.name || itemName,
                itemSection: gradedBag.item?.section?.name,
                gradeName: gradedBag.grade?.name || gradeName,
                isSingle: true,
            });
            toast.success(`Print initiated for graded barcode ${gradedBag.barcode}.`);
        } catch (error) {
            console.error('Error printing graded barcode:', error);
            toast.error('Failed to print graded barcode.');
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
                        Individual graded bags for {itemName} - {gradeName} - {weightValue} kg
                        <br />
                        Created on: {format(new Date(created_date), 'dd/MM/yyyy')} | Total Quantity: {totalQuantity}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
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
