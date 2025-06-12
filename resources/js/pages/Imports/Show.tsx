import { AsyncSelectInput } from '@/components/ui/async-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Import, type ImportBag } from '@/types';
import { printBarcodes } from '@/utils/printBarcodes';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Package, Plus, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddImportBagForm from './AddImportBagForm';
import EditImportForm from './EditImportForm';
import ImportBagsWithBarcodesDialog from './ImportBagsWithBarcodesDialog';
import CreateGradedItemPoolForm from './CreateGradedItemPoolForm';
import { format } from 'date-fns';

interface Props {
    import: Import;
}

export default function Show({ import: importData }: Props) {
    const [isEditImportDialogOpen, setIsEditImportDialogOpen] = useState(false);
    const [isAddBagDialogOpen, setIsAddBagDialogOpen] = useState(false);
    const [isAddBarcodeBagDialogOpen, setIsAddBarcodeBagDialogOpen] = useState(false);
    const [isBarcodesDialogOpen, setIsBarcodesDialogOpen] = useState(false);
    const [selectedBagGroup, setSelectedBagGroup] = useState<{
        importId: number;
        partyId: number;
        weightId: number;
        partyName: string;
        weightValue: string;
    } | null>(null);
    const [isAddGradedBagDialogOpen, setIsAddGradedBagDialogOpen] = useState(false);
    const [isGradedBarcodesDialogOpen, setIsGradedBarcodesDialogOpen] = useState(false);
    const [selectedGradedBagGroup, setSelectedGradedBagGroup] = useState<{
        importId: number;
        partyId: number;
        weightId: number;
        itemId: number;
        gradeId: number;
        partyName: string;
        weightValue: string;
        itemName: string;
        gradeName: string;
    } | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Imports Management',
            href: '/imports',
        },
        {
            title: ( importData.type == 'container' ? importData.container_no : importData.party?.name ) || 'N/A',
            href: '#',
        },
    ];

    // State for barcode bags filters
    const [barcodeBagParams, setBarcodeBagParams] = useState({
        import_id: importData.id,
        party_id: '',
        weight_id: '',
    });
    const [selectedPartyFilter, setSelectedPartyFilter] = useState<any>(null);
    const [weights, setWeights] = useState<any[]>([]);
    const [importStats, setImportStats] = useState<any>(null);

    // Fetch weights, stats and available goods on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [weightsResponse, statsResponse] = await Promise.all([
                    axios.get('/api/weights'),
                    axios.get(`/api/imports/${importData.id}/stats`),
                ]);
                setWeights(weightsResponse.data);
                setImportStats(statsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [importData.id]);

    // Handle party filter change
    const handlePartyFilterChange = (selected: any) => {
        setSelectedPartyFilter(selected);
        setBarcodeBagParams((prev) => ({
            ...prev,
            party_id: selected?.id || '',
        }));
    };

    // Handle weight filter change
    const handleWeightFilterChange = (weightId: string) => {
        setBarcodeBagParams((prev) => ({
            ...prev,
            weight_id: weightId,
        }));
    };

    // Reset filters
    const resetFilters = () => {
        setSelectedPartyFilter(null);
        setBarcodeBagParams({
            import_id: importData.id,
            party_id: '',
            weight_id: '',
        });
    };

    // Handle bag group click to show individual bags
    const handleBagGroupClick = (row: any) => {
        setSelectedBagGroup({
            importId: importData.id,
            partyId: row.original.party_id,
            weightId: row.original.weight_id,
            partyName: row.original.party?.name || 'Unknown',
            weightValue: row.original.weight?.weight || 'Unknown',
        });
        setIsBarcodesDialogOpen(true);
    };

    // Handle print all barcodes for a specific party and weight
    const handlePrintAllBarcodes = async (row: any) => {
        try {
            // Fetch all bags for this combination
            const response = await axios.get('/api/import-bags-with-barcodes', {
                params: {
                    import_id: importData.id,
                    party_id: row.original.party_id,
                    weight_id: row.original.weight_id,
                },
            });

            const bags = response.data.data || response.data;

            if (bags.length === 0) {
                toast.error('No bags found to print.');
                return;
            }

            // Use the utility function
            await printBarcodes({
                bags,
                partyName: row.original.party?.name || 'Unknown',
                containerNo: importData.container_no,
                movementDate: importData.movement_date,
                weightValue: row.original.weight?.weight || 'Unknown',
            });

            toast.success(`Print initiated for ${bags.length} barcodes.`);
        } catch (error) {
            console.error('Error fetching bags for printing:', error);
            toast.error('Failed to fetch bags for printing.');
        }
    };

    // Print individual barcode function
    const handlePrintSingleBarcode = async (importBag: any) => {
        try {
            await printBarcodes({
                bags: [importBag],
                partyName: importBag.party?.name || 'Unknown',
                containerNo: importData.container_no,
                movementDate: importData.movement_date,
                weightValue: importBag.weight?.weight || 'Unknown',
                isSingle: true,
            });
            toast.success(`Print initiated for barcode ${importBag.barcode}.`);
        } catch (error) {
            console.error('Error printing barcode:', error);
            toast.error('Failed to print barcode.');
        }
    };


    // DataTable configurations for import bags
    const importBagFilterableColumns = [
        { label: 'Party', key: 'party.name' },
        { label: 'Weight', key: 'weight' },
        { label: 'Status', key: 'status' },
    ];

    const importBagColumns = [
        ...(importData.type === 'container'
            ? [
                  {
                      id: 'party',
                      header: 'Party',
                      enableSorting: true,
                      cell: ({ row }: { row: any }) => (
                          <div className="flex items-center gap-2">
                              <span>{row.original.party?.name || '-'}</span>
                          </div>
                      ),
                  },
              ]
            : []),
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
            id: 'bag_count',
            header: 'Bag Count',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <Button variant="link" className="h-auto p-0 font-semibold text-blue-600" onClick={() => handleBagGroupClick(row)}>
                        {row.original.bag_count || 0}
                    </Button>
                </div>
            ),
        },
        {
            id: 'opened_count',
            header: 'Opened',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="text-green-600">{row.original.opened_count || 0}</span>
                </div>
            ),
        },
        {
            id: 'unopened_count',
            header: 'Unopened',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="text-red-600">{row.original.unopened_count || 0}</span>
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
                            handlePrintAllBarcodes(row);
                        }}
                        className="h-8 px-2"
                        title="Print all barcodes for this party and weight"
                    >
                        <Printer className="mr-1 h-3 w-3" />
                        Print All
                    </Button>
                </div>
            ),
        },
    ];

    // DataTable configurations for barcode-wise import bags
    const barcodeBagFilterableColumns = [
        { label: 'Barcode', key: 'barcode' },
        { label: 'Party', key: 'party.name' },
        { label: 'Weight', key: 'weight' },
        { label: 'Status', key: 'status' },
        { label: 'Created At', key: 'created_at' },
    ];

    const barcodeBagColumns = [
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
        ...(importData.type === 'container'
            ? [
                  {
                      id: 'party',
                      header: 'Party',
                      enableSorting: true,
                      cell: ({ row }: { row: any }) => (
                          <div className="flex items-center gap-2">
                              <span>{row.original.party?.name || '-'}</span>
                          </div>
                      ),
                  },
              ]
            : []),
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
            id: 'status',
            header: 'Status',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-1 text-xs ${
                            row.original.status === 'opened' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                        {row.original.status}
                    </span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(row.original.created_at, 'dd/MM/yyyy')}</span>
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
                        <Printer className="mr-1 h-3 w-3" />
                        Print
                    </Button>
                </div>
            ),
        },
    ];

    // DataTable configurations for graded items pools
    const gradedItemsFilterableColumns = [
        { label: 'Party', key: 'party.name' },
        { label: 'Item', key: 'item.name' },
        { label: 'Grade', key: 'grade.name' },
        { label: 'Weight', key: 'weight' },
        { label: 'Graded At', key: 'graded_at' },
    ];

    const gradedItemsColumns = [
        ...(importData.type === 'container'
            ? [
                  {
                      id: 'party',
                      header: 'Party',
                      enableSorting: true,
                      cell: ({ row }: { row: any }) => (
                          <div className="flex items-center gap-2">
                              <span>{row.original.party?.name || '-'}</span>
                          </div>
                      ),
                  },
              ]
            : []),
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
                    <span className="font-semibold">{row.original.weight} kg</span>
                </div>
            ),
        },
        {
            id: 'graded_at',
            header: 'Graded At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{format(new Date(row.original.graded_at), 'dd/MM/yyyy')}</span>
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
    ];

    // Import Bags with Barcodes Dialog

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Import Details - ${ importData.type == 'container' ? importData.container_no : importData.party?.name || 'N/A' }`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Import Details</CardTitle>
                        <Dialog open={isEditImportDialogOpen} onOpenChange={setIsEditImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Import</DialogTitle>
                                    <DialogDescription>Update import details.</DialogDescription>
                                </DialogHeader>
                                <EditImportForm
                                    import={importData}
                                    onSuccess={() => {
                                        setIsEditImportDialogOpen(false);
                                        window.location.reload();
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <h4 className="text-muted-foreground mb-2 text-sm font-semibold">Party Information</h4>
                                <p className="text-lg font-medium">{importData.party?.name || 'N/A'}</p>
                                <p className="text-muted-foreground text-sm">{importData.party?.type || 'N/A'}</p>
                            </div>

                            <div>
                                <h4 className="text-muted-foreground mb-2 text-sm font-semibold">
                                    {importData.type === 'container' ? 'Container Details' : 'Reference Details'}
                                </h4>
                                <p className="text-lg font-medium">{importData.container_no || 'N/A'}</p>
                                <p className="text-muted-foreground text-sm">
                                    {importData.movement_date ? format(importData.movement_date, 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-muted-foreground mb-2 text-sm font-semibold">Import Type</h4>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                        importData.type === 'container' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}
                                >
                                    {importData.type === 'container' ? 'Via Container' : 'Local Delivery'}
                                </span>
                            </div>

                            {/* Show BL/BE details only for container imports */}
                            {importData.type === 'container' && (
                                <>
                                    <div>
                                        <h4 className="text-muted-foreground mb-2 text-sm font-semibold">BL Details</h4>
                                        <p className="text-sm">No: {importData.bl_no || 'N/A'}</p>
                                        <p className="text-sm">
                                            Date: {importData.bl_date ? format(importData.bl_date, 'dd/MM/yyyy') : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-muted-foreground mb-2 text-sm font-semibold">BE Details</h4>
                                        <p className="text-sm">No: {importData.be_no || 'N/A'}</p>
                                        <p className="text-sm">
                                            Date: {importData.be_date ? format(importData.be_date, 'dd/MM/yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <h4 className="text-muted-foreground mb-2 text-sm font-semibold">Weights</h4>
                                {importData.type === 'container' && (
                                    <p className="text-sm">BL: {importData.bl_weight ? `${importData.bl_weight} kg` : 'N/A'}</p>
                                )}
                                <p className="text-sm">
                                    {importData.type === 'container' ? 'WB:' : 'Total:'}{' '}
                                    {importData.weigh_bridge_weight ? `${importData.weigh_bridge_weight} kg` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                {importStats && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Bags</p>
                                        <p className="text-2xl font-bold">{importStats.total_bags}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-green-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Opened Bags</p>
                                        <p className="text-2xl font-bold text-green-600">{importStats.opened_bags}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-red-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Unopened Bags</p>
                                        <p className="text-2xl font-bold text-red-600">{importStats.unopened_bags}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded bg-amber-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Opening Progress</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {importStats.total_bags > 0 ? Math.round((importStats.opened_bags / importStats.total_bags) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

               
                {/* Tabs Section */}
                <Tabs defaultValue="bags" className="w-full">
                    <TabsList>
                        <TabsTrigger value="bags">Import Bags</TabsTrigger>
                        <TabsTrigger value="barcode-bags">Barcode wise Bags</TabsTrigger>
                        <TabsTrigger value="grading">Graded Items Pool</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bags">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Import Bags</CardTitle>
                                <Dialog open={isAddBagDialogOpen} onOpenChange={setIsAddBagDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Bags
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Import Bags</DialogTitle>
                                            <DialogDescription>Add new bags to this import.</DialogDescription>
                                        </DialogHeader>
                                        <AddImportBagForm
                                            importData={importData}
                                            onSuccess={() => {
                                                setIsAddBagDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <DataTable<ImportBag>
                                    filterableColumns={importBagFilterableColumns}
                                    route={`/api/import-bags`}
                                    columns={importBagColumns}
                                    pageSize={20}
                                    params={{ import_id: importData.id }}
                                    onEdit={(row) => {
                                        console.log(row);
                                        setSelectedBagGroup({
                                            importId: importData.id,
                                            partyId: row.party_id,
                                            weightId: row.weight_id,
                                            partyName: row.party?.name || 'Unknown',
                                            weightValue: row.weight?.weight || 'Unknown',
                                        });
                                        setIsBarcodesDialogOpen(true);
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="barcode-bags">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Barcode wise Bags</CardTitle>
                                <Dialog open={isAddBarcodeBagDialogOpen} onOpenChange={setIsAddBarcodeBagDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Import Bags
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Import Bags</DialogTitle>
                                            <DialogDescription>Add new bags to this import.</DialogDescription>
                                        </DialogHeader>
                                        <AddImportBagForm
                                            importData={importData}
                                            onSuccess={() => {
                                                setIsAddBarcodeBagDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {/* Filter Section */}
                                <div className="bg-muted/50 mb-6 grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-3">
                                    {importData.type === 'container' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="party-filter">Filter by Party</Label>
                                            <AsyncSelectInput
                                                route="/api/parties/select"
                                                params={{ type: 'supplier' }}
                                                value={selectedPartyFilter}
                                                onChange={handlePartyFilterChange}
                                                placeholder="All parties"
                                                renderOption={(option) => option.name}
                                                renderSelected={(option) => option.name}
                                                isClearable={true}
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="weight-filter">Filter by Weight</Label>
                                        <Select value={barcodeBagParams.weight_id} onValueChange={handleWeightFilterChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All weights" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem>All weights</SelectItem>
                                                {weights.map((weight) => (
                                                    <SelectItem key={weight.id} value={weight.id.toString()}>
                                                        {weight.weight} kg
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <Button variant="outline" onClick={resetFilters} className="h-10">
                                            Reset Filters
                                        </Button>
                                    </div>
                                </div>

                                <DataTable<ImportBag>
                                    filterableColumns={barcodeBagFilterableColumns}
                                    route="/api/import-bags-with-barcodes"
                                    columns={barcodeBagColumns}
                                    pageSize={20}
                                    params={barcodeBagParams}
                                    key={`${barcodeBagParams.party_id}-${barcodeBagParams.weight_id}`}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="grading">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Graded Items Pool</CardTitle>
                                <Dialog open={isAddGradedBagDialogOpen} onOpenChange={setIsAddGradedBagDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Graded Item
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Add Graded Item Pool</DialogTitle>
                                            <DialogDescription>Add graded item to this import.</DialogDescription>
                                        </DialogHeader>
                                        <CreateGradedItemPoolForm
                                            importData={importData}
                                            onSuccess={() => {
                                                setIsAddGradedBagDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    filterableColumns={gradedItemsFilterableColumns}
                                    route="/api/graded-items-pools"
                                    columns={gradedItemsColumns}
                                    pageSize={20}
                                    params={{ import_id: importData.id }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Existing dialogs */}
                {selectedBagGroup && (
                    <ImportBagsWithBarcodesDialog
                        isOpen={isBarcodesDialogOpen}
                        onClose={() => {
                            setIsBarcodesDialogOpen(false);
                            setSelectedBagGroup(null);
                        }}
                        importId={selectedBagGroup.importId}
                        partyId={selectedBagGroup.partyId}
                        weightId={selectedBagGroup.weightId}
                        partyName={selectedBagGroup.partyName}
                        weightValue={selectedBagGroup.weightValue}
                    />
                )}
            </div>
        </AppLayout>
    );

}
