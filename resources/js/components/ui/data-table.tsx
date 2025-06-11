import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, ChevronsUpDown, Trash2 } from 'lucide-react';
import { type DataTableProps } from '@/types/data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';

export function DataTable<TData>({
    route,
    columns,
    filterableColumns = [],
    params = {},
    pageSize = 10,
    onEdit,
    onDelete,
    isPaginated = true,
    data: initialData,
    onDataFetch
}: DataTableProps<TData>) {
    const {
        data,
        total,
        currentPage,
        loading,
        filter,
        sort,
        handleFilterChange,
        handleSortChange,
        handlePageChange,
        pageSize: currentPageSize,
        refresh
    } = useDataTable<TData>({
        route,
        pageSize,
        params,
        isPaginated,
        data: initialData,
        onDataFetch
    });

    // Make refresh function available globally
    (window as any).refreshDataTable = refresh;

    // Apply custom renderers to columns with sorting
    const enhancedColumns = columns.map(col => ({
        ...col,
        header: (context) => {
            const enableSorting = (col as any).enableSorting;
            if (!enableSorting) {
                return flexRender(col.header, context);
            }

            const isSorted = sort?.column === (col.id ?? '');
            const direction = sort?.direction;

            return (
                <div
                    className={cn(
                        "flex items-center gap-1",
                        enableSorting && "cursor-pointer select-none"
                    )}
                    onClick={() => {
                        if (!enableSorting) return;
                        const nextDirection = !isSorted || direction === 'desc' ? 'asc' : 'desc';
                        handleSortChange(col.id ?? '', nextDirection);
                    }}
                >
                    <span>{flexRender(col.header, context)}</span>
                    {enableSorting && (
                        <div className="w-4 h-4">
                            {isSorted ? (
                                direction === 'asc' ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )
                            ) : (
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            )}
                        </div>
                    )}
                </div>
            );
        }
    })) as ColumnDef<TData>[];

    const table = useReactTable({
        data,
        columns: enhancedColumns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: Math.ceil(total / currentPageSize),
    });

    const filterableColumnOptions = [
        { key: 'all', label: 'All Columns' },
        ...filterableColumns
    ];

    const totalPages = Math.ceil(total / currentPageSize);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Select
                    value={filter.column}
                    onValueChange={(value) => handleFilterChange('column', value)}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterableColumnOptions.map((column) => (
                            <SelectItem key={column.key} value={column.key}>
                                {column.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Search..."
                    value={filter.value}
                    onChange={(e) => handleFilterChange('value', e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
{(onDelete) && (
                                    <TableHead className="text-right">Actions</TableHead>
                                )}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center"
                                >
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center"
                                >
                                    No results found
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow 
                                    key={row.id}
                                    onClick={() => onEdit && onEdit(row.original)}
                                    className={onEdit ? "cursor-pointer hover:bg-muted" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                    {(onDelete) && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                
                                                {onDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(row.original);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {isPaginated && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {data.length ? (currentPage - 1) * currentPageSize + 1 : 0} to{' '}
                        {Math.min(currentPage * currentPageSize, total)} of {total} results
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}