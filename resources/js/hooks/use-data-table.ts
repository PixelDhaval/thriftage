import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FilterState, PaginatedResponse, UseDataTableOptions, SortState } from '@/types/data-table';
import { debounce } from 'lodash';

export function useDataTable<TData>({ 
    route, 
    pageSize = 10, 
    params = {}, 
    isPaginated = true,
    data: initialData,
    onDataFetch
}: UseDataTableOptions) {
    const [data, setData] = useState<TData[]>(initialData || []);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterState>({
        column: 'all',
        value: ''
    });
    const [sort, setSort] = useState<SortState | null>(null);

    // Memoize the params and onDataFetch callback
    const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);
    const memoizedOnDataFetch = useMemo(() => onDataFetch, []);

    const fetchData = useCallback(async (
        page: number, 
        filterState: FilterState, 
        sortState: SortState | null, 
        params: any
    ) => {
        setLoading(true);
        try {
            if (!route && initialData) {
                setData(initialData as TData[]);
                setTotal(initialData.length);
                memoizedOnDataFetch?.(initialData);
                return;
            }

            const queryParams = isPaginated ? {
                page,
                per_page: pageSize,
                ...params,
                ...(filterState.value && {
                    search: filterState.value,
                    search_column: filterState.column === 'all' ? '' : filterState.column
                }),
                ...(sortState && {
                    sort_column: sortState.column,
                    sort_direction: sortState.direction
                })
            } : {
                ...params,
                ...(filterState.value && {
                    search: filterState.value,
                    search_column: filterState.column === 'all' ? '' : filterState.column
                }),
                ...(sortState && {
                    sort_column: sortState.column,
                    sort_direction: sortState.direction
                })
            };

            const queryString = Object.entries(queryParams)
                .filter(([_, value]) => value !== undefined && value !== '')
                .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
                .join('&');

            const response = await axios.get<PaginatedResponse<TData> | TData[]>(`${route}?${queryString}`);
            console.log('Response:', response.data);
            if (isPaginated) {
                const paginatedResponse = response.data as PaginatedResponse<TData>;
                setData(paginatedResponse.data);
                setTotal(paginatedResponse.total);
                setCurrentPage(paginatedResponse.current_page);
                memoizedOnDataFetch?.(paginatedResponse.data);
            } else {
                const arrayResponse = response.data as TData[];
                setData(arrayResponse);
                setTotal(arrayResponse.length);
                memoizedOnDataFetch?.(arrayResponse);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [route, pageSize, memoizedParams, isPaginated, initialData, memoizedOnDataFetch]);

    const debouncedFetch = useCallback(
        debounce((page: number, filterState: FilterState, sortState: SortState | null, params: any) => {
            fetchData(page, filterState, sortState, params);
        }, 300),
        [fetchData]
    );

    useEffect(() => {
        debouncedFetch(currentPage, filter, sort, memoizedParams);
        return () => {
            debouncedFetch.cancel();
        };
    }, [currentPage, filter, sort, debouncedFetch, memoizedParams]); // Remove params from dependency array

    const handleFilterChange = (type: keyof FilterState, value: string) => {
        setFilter((prev) => ({
            ...prev,
            [type]: value
        }));
        setCurrentPage(1);
    };

    const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
        setSort({ column, direction });
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > Math.ceil(total / pageSize)) return;
        setCurrentPage(page);
    };

    const refresh = useCallback(() => {
        debouncedFetch(currentPage, filter, sort, params);
    }, [currentPage, filter, sort, debouncedFetch, params]);

    return {
        data,
        total,
        currentPage,
        loading,
        filter,
        sort,
        handleFilterChange,
        handleSortChange,
        handlePageChange,
        pageSize,
        setCurrentPage,
        refresh
    };
}