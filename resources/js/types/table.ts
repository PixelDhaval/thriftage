import { ColumnDef as TableColumnDef } from '@tanstack/react-table';

export interface ColumnMeta {
    defaultValue?: string | number | React.ReactNode;
    filterable?: boolean;
    filterType?: 'text' | 'select' | 'date';
    filterOptions?: { label: string; value: string | number }[];
}

export type ColumnDef<TData, TValue = unknown> = TableColumnDef<TData, TValue> & {
    meta?: ColumnMeta;
};