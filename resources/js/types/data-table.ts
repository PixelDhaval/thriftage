import { ColumnDef } from '@tanstack/react-table';

export interface DataTableProps<TData> {
    /**
     * Route to fetch data from
     */
    route?: string;

    /**
     * Columns configuration
     */
    columns: ColumnDef<TData>[];

    /**
     * Array of column ids that should be filterable
     */
    filterableColumns?: {
        label: string;
        key: string;
    }[];

    /**
     * Additional parameters to include in the route
     */
    params?: Record<string, any>;

    /**
     * Page size for pagination
     */
    pageSize?: number;

    /**
     * Function to handle edit action
     */
    onEdit?: (row: TData) => void;

    /**
     * Function to handle delete action
     */
    onDelete?: (row: TData) => void;

    /**
     * Function to call refresh
     */
    onRefresh?: () => void;

    isPaginated?: boolean;
    data?: TData[];
    onDataFetch?: (data: any[]) => void;
}

export interface PaginatedResponse<TData> {
    data: TData[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface FilterState {
    column: string;
    value: string;
}

export interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

export interface UseDataTableOptions {
    route?: string;
    pageSize?: number;
    params?: Record<string, any>;
    isPaginated?: boolean;
    data?: any[];
    onDataFetch?: (data: any) => void;
}