import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Plus, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import CreateGradedBagPoolForm from './CreateGradedBagPoolForm';
import GradedBagsGroupDetailDialog from './GradedBagsGroupDetailDialog';
import { printGradedBarcodes } from '@/utils/printGradedBarcodes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Graded Bags Pool',
        href: '/graded-bags-pools',
    },
];

export default function Index() {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGroupDetailDialogOpen, setIsGroupDetailDialogOpen] = useState(false);
    const [selectedGroupDetail, setSelectedGroupDetail] = useState<{
        item_id: number;
        grade_id: number;
        weight_id: number;
        created_date: string;
        itemName: string;
        gradeName: string;
        weightValue: string;
        totalQuantity: number;
    } | null>(null);

    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // State for date range parameters
    const [dateParams, setDateParams] = useState({
        from_created_date: today,
        to_created_date: today,
    });

    // Handle date range changes
    const handleDateRangeChange = (field: string, value: string) => {
        setDateParams(prev => ({ ...prev, [field]: value }));
    };

    // Reset date range to today
    const resetDateRange = () => {
        setDateParams({
            from_created_date: today,
            to_created_date: today,
        });
    };

    // Keyboard shortcut for opening create dialog
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'o') {
                event.preventDefault();
                setIsCreateDialogOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Print individual graded barcode function
    const handlePrintSingleBarcode = async (gradedBag: any) => {
        try {
            // Check if the bag has weight type info, otherwise fetch it
            let currentWeightType = 'kg';
            if (gradedBag.weight?.weight_type) {
                currentWeightType = gradedBag.weight.weight_type;
            } else if (gradedBag.item?.section?.weight_type) {
                currentWeightType = gradedBag.item.section.weight_type;
            }
            
            await printGradedBarcodes({
                bags: [gradedBag],
                partyName: 'Graded Items',
                weightValue: gradedBag.weight?.weight || 'Unknown',
                itemName: gradedBag.item?.name || 'Unknown',
                itemSection: gradedBag.item?.section?.name,
                gradeName: gradedBag.grade?.name || 'Unknown',
                isSingle: true,
                weightType: currentWeightType,
                pairCount: currentWeightType === 'pair' ? parseInt(gradedBag.weight?.weight || '0') : undefined
            });
            toast.success(`Print initiated for graded barcode ${gradedBag.barcode}.`);
        } catch (error) {
            console.error('Error printing graded barcode:', error);
            toast.error('Failed to print graded barcode.');
        }
    };

    // Handle group detail click
    const handleGroupDetailClick = (row: any) => {
        setSelectedGroupDetail({
            item_id: row.item_id,
            grade_id: row.grade_id,
            weight_id: row.weight_id,
            created_date: row.created_date,
            itemName: row.item?.name || 'Unknown',
            gradeName: row.grade?.name || 'Unknown',
            weightValue: row.weight?.weight || 'Unknown',
            totalQuantity: row.total_quantity,
        });
        setIsGroupDetailDialogOpen(true);
    };

    // DataTable configurations for individual graded bags with barcodes
    const barcodesFilterableColumns = [
        { label: 'Barcode', key: 'barcode' },
        { label: 'Item', key: 'item.name' },
        { label: 'Grade', key: 'grade.name' },
        { label: 'Weight', key: 'weight.weight' },
        { label: 'Created At', key: 'created_at' },
    ];

    const barcodesColumns = [
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
            id: 'item',
            header: 'Item',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.item?.name || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                        ({row.original.item?.section?.name || 'No Section'})
                    </span>
                </div>
            ),
        },
        {
            id: 'grade',
            header: 'Grade',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.grade?.name || '-'}</span>
                </div>
            ),
        },
        {
            id: 'weight',
            header: 'Weight',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.weight?.weight || '-'} kg</span>
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

    // DataTable configurations for grouped graded bags
    const groupedFilterableColumns = [
        { label: 'Item', key: 'item.name' },
        { label: 'Grade', key: 'grade.name' },
        { label: 'Weight', key: 'weight.weight' },
        { label: 'Created Date', key: 'created_date' },
        { label: 'Total Quantity', key: 'total_quantity' },
    ];

    const groupedColumns = [
        {
            id: 'item',
            header: 'Item',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.item?.name || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                        ({row.original.item?.section?.name || 'No Section'})
                    </span>
                </div>
            ),
        },
        {
            id: 'grade',
            header: 'Grade',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.grade?.name || '-'}</span>
                </div>
            ),
        },
        {
            id: 'weight',
            header: 'Weight',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.weight?.weight || '-'} kg</span>
                </div>
            ),
        },
        {
            id: 'total_quantity',
            header: 'Total Quantity',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{row.original.total_quantity}</span>
                </div>
            ),
        },
        {
            id: 'total_weight',
            header: 'Total Weight',
            enableSorting: false,
            cell: ({row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold">
                        {(row.original.total_quantity * parseFloat(row.original.weight?.weight || '0')).toFixed(2)} kg
                    </span>
                </div>
            ),
        },
        {
            id: 'created_date',
            header: 'Created Date',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(new Date(row.original.created_date), 'dd/MM/yyyy')}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Graded Bags Pool" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Graded Bags Pool</h1>
                        <p className="text-muted-foreground">
                            Press <kbd className="bg-muted rounded px-1 py-0.5 text-xs">Ctrl+O</kbd> to create new graded bags.
                        </p>
                    </div>
                    {userPermissions.includes('graded-bags-pools-create') && (
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Graded Bags
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="barcodes" className="w-full">
                    <TabsList>
                        <TabsTrigger value="barcodes">Individual Barcodes</TabsTrigger>
                        <TabsTrigger value="grouped">Grouped Summary</TabsTrigger>
                    </TabsList>

                    {/* Date Range Filter Section */}
                    <div className="bg-muted/50 mb-6 grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <Label htmlFor="from-date">From Date</Label>
                            <Input
                                id="from-date"
                                type="date"
                                value={dateParams.from_created_date}
                                onChange={(e) => handleDateRangeChange('from_created_date', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="to-date">To Date</Label>
                            <Input
                                id="to-date"
                                type="date"
                                value={dateParams.to_created_date}
                                onChange={(e) => handleDateRangeChange('to_created_date', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={resetDateRange} 
                                className="h-10"
                                title="Reset to today's date"
                            >
                                Reset to Today
                            </Button>
                        </div>

                        <div className="flex items-end justify-end">
                            <div className="text-sm text-muted-foreground">
                                Showing data from {format(new Date(dateParams.from_created_date), 'dd/MM/yyyy')} to {format(new Date(dateParams.to_created_date), 'dd/MM/yyyy')}
                            </div>
                        </div>
                    </div>

                    <TabsContent value="barcodes">
                        <DataTable
                            filterableColumns={barcodesFilterableColumns}
                            route="/api/graded-bags-pools-with-barcodes"
                            columns={barcodesColumns}
                            pageSize={20}
                            params={dateParams}
                            key={`barcodes-${dateParams.from_created_date}-${dateParams.to_created_date}`}
                        />
                    </TabsContent>

                    <TabsContent value="grouped">
                        <DataTable
                            filterableColumns={groupedFilterableColumns}
                            route="/api/graded-bags-pools"
                            columns={groupedColumns}
                            pageSize={20}
                            onEdit={handleGroupDetailClick}
                            params={dateParams}
                            key={`grouped-${dateParams.from_created_date}-${dateParams.to_created_date}`}
                        />
                    </TabsContent>
                </Tabs>

                <CreateGradedBagPoolForm
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                    onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        window.refreshDataTable?.();
                    }}
                />

                {/* Group Detail Dialog */}
                {selectedGroupDetail && (
                    <GradedBagsGroupDetailDialog
                        isOpen={isGroupDetailDialogOpen}
                        onClose={() => {
                            setIsGroupDetailDialogOpen(false);
                            setSelectedGroupDetail(null);
                        }}
                        item_id={selectedGroupDetail.item_id}
                        grade_id={selectedGroupDetail.grade_id}
                        weight_id={selectedGroupDetail.weight_id}
                        created_date={selectedGroupDetail.created_date}
                        itemName={selectedGroupDetail.itemName}
                        gradeName={selectedGroupDetail.gradeName}
                        weightValue={selectedGroupDetail.weightValue}
                        totalQuantity={selectedGroupDetail.totalQuantity}
                    />
                )}
            </div>
        </AppLayout>
    );
}
