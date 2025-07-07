import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Grade, type Item, type Section, type Weight } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CreateGradeForm from './CreateGradeForm';
import CreateItemForm from './CreateItemForm';
import CreateSectionForm from './CreateSectionForm';
import CreateWeightForm from './CreateWeightForm';
import EditGradeForm from './EditGradeForm';
import EditItemForm from './EditItemForm';
import EditSectionForm from './EditSectionForm';
import EditWeightForm from './EditWeightForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Items Management',
        href: '/items',
    },
];

interface Props {
    items: Item[];
}

export default function Index({ items }: Props) {
    const auth = usePage().props.auth;
    const userPermissions = auth?.permissions || [];

    // Items state
    const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
    const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
    const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    // Sections state
    const [isCreateSectionDialogOpen, setIsCreateSectionDialogOpen] = useState(false);
    const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
    const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

    // Grades state
    const [isCreateGradeDialogOpen, setIsCreateGradeDialogOpen] = useState(false);
    const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false);
    const [isDeleteGradeDialogOpen, setIsDeleteGradeDialogOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);

    // Weights state
    const [isCreateWeightDialogOpen, setIsCreateWeightDialogOpen] = useState(false);
    const [isEditWeightDialogOpen, setIsEditWeightDialogOpen] = useState(false);
    const [isDeleteWeightDialogOpen, setIsDeleteWeightDialogOpen] = useState(false);
    const [selectedWeight, setSelectedWeight] = useState<Weight | null>(null);
    const [weightToDelete, setWeightToDelete] = useState<Weight | null>(null);

    // Current active tab
    const [activeTab, setActiveTab] = useState('items');

    // Item handlers
    const handleDeleteItemClick = (item: Item) => {
        setItemToDelete(item);
        setIsDeleteItemDialogOpen(true);
    };

    const handleDeleteItemConfirm = async () => {
        if (itemToDelete) {
            try {
                await axios.delete(`/items/${itemToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Item ${itemToDelete.name} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error('Failed to delete item. Please try again later.');
            }
        }
        setIsDeleteItemDialogOpen(false);
        setItemToDelete(null);
    };

    const handleEditItem = (item: Item) => {
        setSelectedItem(item);
        setIsEditItemDialogOpen(true);
    };

    // Section handlers
    const handleDeleteSectionClick = (section: Section) => {
        setSectionToDelete(section);
        setIsDeleteSectionDialogOpen(true);
    };

    const handleDeleteSectionConfirm = async () => {
        if (sectionToDelete) {
            try {
                await axios.delete(`/sections/${sectionToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Section ${sectionToDelete.name} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting section:', error);
                toast.error('Failed to delete section. Please try again later.');
            }
        }
        setIsDeleteSectionDialogOpen(false);
        setSectionToDelete(null);
    };

    const handleEditSection = (section: Section) => {
        setSelectedSection(section);
        setIsEditSectionDialogOpen(true);
    };

    // Grade handlers
    const handleDeleteGradeClick = (grade: Grade) => {
        setGradeToDelete(grade);
        setIsDeleteGradeDialogOpen(true);
    };

    const handleDeleteGradeConfirm = async () => {
        if (gradeToDelete) {
            try {
                await axios.delete(`/grades/${gradeToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Grade ${gradeToDelete.name} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting grade:', error);
                toast.error('Failed to delete grade. Please try again later.');
            }
        }
        setIsDeleteGradeDialogOpen(false);
        setGradeToDelete(null);
    };

    const handleEditGrade = (grade: Grade) => {
        setSelectedGrade(grade);
        setIsEditGradeDialogOpen(true);
    };

    // Weight handlers
    const handleDeleteWeightClick = (weight: Weight) => {
        setWeightToDelete(weight);
        setIsDeleteWeightDialogOpen(true);
    };

    const handleDeleteWeightConfirm = async () => {
        if (weightToDelete) {
            try {
                await axios.delete(`/weights/${weightToDelete.id}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                });

                toast.success(`Weight ${weightToDelete.weight} deleted successfully.`);
                window.refreshDataTable?.();
            } catch (error) {
                console.error('Error deleting weight:', error);
                toast.error('Failed to delete weight. Please try again later.');
            }
        }
        setIsDeleteWeightDialogOpen(false);
        setWeightToDelete(null);
    };

    const handleEditWeight = (weight: Weight) => {
        setSelectedWeight(weight);
        setIsEditWeightDialogOpen(true);
    };

    // DataTable configurations
    const itemFilterableColumns = [
        { label: 'Name', key: 'name' },
        { label: 'Section', key: 'section.name' },
        { label: 'Grade', key: 'grade.name' },
        { label: 'Description', key: 'description' },
    ];

    const itemColumns = [
        {
            id: 'name',
            header: 'Name',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            id: 'section',
            header: 'Section',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.section?.name || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                        ({row.original.section?.weight_type || 'kg'})
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
            id: 'default_weight',
            header: 'Default Weight',
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.default_weight?.weight || '-'}</span>
                    {row.original.default_weight && (
                        <span className="text-xs text-muted-foreground">
                            ({row.original.default_weight.weight_type})
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: 'description',
            header: 'Description',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.description || '-'}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
    ];

    const sectionFilterableColumns = [{ label: 'Name', key: 'name' }, { label: 'Weight Type', key: 'weight_type' }];

    const sectionColumns = [
        {
            id: 'name',
            header: 'Name',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            id: 'weight_type',
            header: 'Weight Type',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="capitalize">{row.original.weight_type || 'kg'}</span>
                    <span className="text-xs text-muted-foreground">
                        {row.original.weight_type === 'pair' ? 'Counts in pairs' : 'Measures in kg'}
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
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
    ];

    const gradeFilterableColumns = [{ label: 'Name', key: 'name' }];

    const gradeColumns = [
        {
            id: 'name',
            header: 'Name',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
    ];

    const weightFilterableColumns = [{ label: 'Weight', key: 'weight' }, { label: 'Weight Type', key: 'weight_type' }];

    const weightColumns = [
        {
            id: 'weight',
            header: 'Weight',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.weight}</span>
                </div>
            ),
        },
        {
            id: 'weight_type',
            header: 'Weight Type',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="capitalize">{row.original.weight_type || 'kg'}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Created At',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Items Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-flow-col">
                        { userPermissions.includes('items-read') && <TabsTrigger value="items">Items</TabsTrigger> }
                        { userPermissions.includes('sections-read') && <TabsTrigger value="sections">Sections</TabsTrigger> }
                        { userPermissions.includes('grades-read') && <TabsTrigger value="grades">Grades</TabsTrigger> }
                        { userPermissions.includes('weights-read') && <TabsTrigger value="weights">Bag Weights</TabsTrigger> }
                    </TabsList>

                    {/* Items Tab */}
                    <TabsContent value="items">
                        <div className="mb-4 py-4 flex justify-between">
                            <h1 className="text-2xl font-semibold">Items Management</h1>
                            {userPermissions.includes('items-update') && (
                                <Dialog open={isCreateItemDialogOpen} onOpenChange={setIsCreateItemDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Item
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Item</DialogTitle>
                                            <DialogDescription>Add a new item to the system.</DialogDescription>
                                        </DialogHeader>
                                        <CreateItemForm
                                            onSuccess={() => {
                                                setIsCreateItemDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <DataTable<Item>
                            filterableColumns={itemFilterableColumns}
                            route="/api/items"
                            columns={itemColumns}
                            pageSize={20}
                            {...(userPermissions.includes('items-update') && { onEdit: handleEditItem })}
                            {...(userPermissions.includes('items-update') && { onDelete: handleDeleteItemClick })}
                            params={{}}
                        />

                        <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Item</DialogTitle>
                                    <DialogDescription>Update item details.</DialogDescription>
                                </DialogHeader>
                                {selectedItem && (
                                    <EditItemForm
                                        item={selectedItem}
                                        onSuccess={() => {
                                            setIsEditItemDialogOpen(false);
                                            window.refreshDataTable?.();
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        <DeleteConfirmationDialog
                            isOpen={isDeleteItemDialogOpen}
                            onClose={() => {
                                setIsDeleteItemDialogOpen(false);
                                setItemToDelete(null);
                            }}
                            onConfirm={handleDeleteItemConfirm}
                            title="Delete Item"
                            description={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`}
                        />
                    </TabsContent>

                    {/* Sections Tab */}
                    <TabsContent value="sections">
                        <div className="mb-4 py-4 flex justify-between">
                            <h1 className="text-2xl font-semibold">Section Management</h1>
                            {userPermissions.includes('sections-update') && (
                                <Dialog open={isCreateSectionDialogOpen} onOpenChange={setIsCreateSectionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Section
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Section</DialogTitle>
                                            <DialogDescription>Add a new section to the system.</DialogDescription>
                                        </DialogHeader>
                                        <CreateSectionForm
                                            onSuccess={() => {
                                                setIsCreateSectionDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <DataTable<Section>
                            filterableColumns={sectionFilterableColumns}
                            route="/api/sections"
                            columns={sectionColumns}
                            pageSize={20}
                            {...(userPermissions.includes('sections-update') && { onEdit: handleEditSection })}
                            {...(userPermissions.includes('sections-update') && { onDelete: handleDeleteSectionClick })}
                            params={{}}
                        />

                        <Dialog open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Section</DialogTitle>
                                    <DialogDescription>Update section details.</DialogDescription>
                                </DialogHeader>
                                {selectedSection && (
                                    <EditSectionForm
                                        section={selectedSection}
                                        onSuccess={() => {
                                            setIsEditSectionDialogOpen(false);
                                            window.refreshDataTable?.();
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        <DeleteConfirmationDialog
                            isOpen={isDeleteSectionDialogOpen}
                            onClose={() => {
                                setIsDeleteSectionDialogOpen(false);
                                setSectionToDelete(null);
                            }}
                            onConfirm={handleDeleteSectionConfirm}
                            title="Delete Section"
                            description={`Are you sure you want to delete ${sectionToDelete?.name}? This action cannot be undone.`}
                        />
                    </TabsContent>

                    {/* Grades Tab */}
                    <TabsContent value="grades">
                        <div className="mb-4 py-4 flex justify-between">
                            <h1 className="text-2xl font-semibold">Grade Management</h1>
                            {userPermissions.includes('grades-update') && (
                                <Dialog open={isCreateGradeDialogOpen} onOpenChange={setIsCreateGradeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Grade
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Grade</DialogTitle>
                                            <DialogDescription>Add a new grade to the system.</DialogDescription>
                                        </DialogHeader>
                                        <CreateGradeForm
                                            onSuccess={() => {
                                                setIsCreateGradeDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <DataTable<Grade>
                            filterableColumns={gradeFilterableColumns}
                            route="/api/grades"
                            columns={gradeColumns}
                            pageSize={20}
                            {...(userPermissions.includes('grades-update') && { onEdit: handleEditGrade })}
                            {...(userPermissions.includes('grades-update') && { onDelete: handleDeleteGradeClick })}
                            params={{}}
                        />

                        <Dialog open={isEditGradeDialogOpen} onOpenChange={setIsEditGradeDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Grade</DialogTitle>
                                    <DialogDescription>Update grade details.</DialogDescription>
                                </DialogHeader>
                                {selectedGrade && (
                                    <EditGradeForm
                                        grade={selectedGrade}
                                        onSuccess={() => {
                                            setIsEditGradeDialogOpen(false);
                                            window.refreshDataTable?.();
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        <DeleteConfirmationDialog
                            isOpen={isDeleteGradeDialogOpen}
                            onClose={() => {
                                setIsDeleteGradeDialogOpen(false);
                                setGradeToDelete(null);
                            }}
                            onConfirm={handleDeleteGradeConfirm}
                            title="Delete Grade"
                            description={`Are you sure you want to delete ${gradeToDelete?.name}? This action cannot be undone.`}
                        />
                    </TabsContent>

                    {/* Weights Tab */}
                    <TabsContent value="weights">
                        <div className="mb-4 py-4 flex justify-between">
                            <h1 className="text-2xl  font-semibold">Bag Weight Management</h1>
                            {userPermissions.includes('weights-update') && (
                                <Dialog open={isCreateWeightDialogOpen} onOpenChange={setIsCreateWeightDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Weight
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Weight</DialogTitle>
                                            <DialogDescription>Add a new weight to the system.</DialogDescription>
                                        </DialogHeader>
                                        <CreateWeightForm
                                            onSuccess={() => {
                                                setIsCreateWeightDialogOpen(false);
                                                window.refreshDataTable?.();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <DataTable<Weight>
                            filterableColumns={weightFilterableColumns}
                            route="/api/weights"
                            columns={weightColumns}
                            pageSize={20}
                            {...(userPermissions.includes('weights-update') && { onEdit: handleEditWeight })}
                            {...(userPermissions.includes('weights-update') && { onDelete: handleDeleteWeightClick })}
                            params={{}}
                        />

                        <Dialog open={isEditWeightDialogOpen} onOpenChange={setIsEditWeightDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Weight</DialogTitle>
                                    <DialogDescription>Update weight details.</DialogDescription>
                                </DialogHeader>
                                {selectedWeight && (
                                    <EditWeightForm
                                        weight={selectedWeight}
                                        onSuccess={() => {
                                            setIsEditWeightDialogOpen(false);
                                            window.refreshDataTable?.();
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        <DeleteConfirmationDialog
                            isOpen={isDeleteWeightDialogOpen}
                            onClose={() => {
                                setIsDeleteWeightDialogOpen(false);
                                setWeightToDelete(null);
                            }}
                            onConfirm={handleDeleteWeightConfirm}
                            title="Delete Weight"
                            description={`Are you sure you want to delete weight ${weightToDelete?.weight}? This action cannot be undone.`}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
