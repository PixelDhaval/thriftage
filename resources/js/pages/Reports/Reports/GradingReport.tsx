import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AsyncSelectInput } from '@/components/ui/async-select';
import axios from 'axios';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function GradingReport() {
    const [sections, setSections] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [selectedGrade, setSelectedGrade] = useState<any>(null);
    const [dateParams, setDateParams] = useState({
        from_date: format(new Date(), 'yyyy-MM-dd'),
        to_date: format(new Date(), 'yyyy-MM-dd'),
    });
    const [summary, setSummary] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch sections and grades on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sectionsResponse, gradesResponse] = await Promise.all([
                    axios.get('/api/sections'),
                    axios.get('/api/grades')
                ]);
                setSections(sectionsResponse.data);
                setGrades(gradesResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data for report filters.');
            }
        };

        fetchData();
    }, []);

    // Handle date range changes
    const handleDateRangeChange = (field: string, value: string) => {
        setDateParams(prev => ({ ...prev, [field]: value }));
    };

    // Reset date range to today
    const resetDateRange = () => {
        setDateParams({
            from_date: format(new Date(), 'yyyy-MM-dd'),
            to_date: format(new Date(), 'yyyy-MM-dd'),
        });
    };

    // Handle section change
    const handleSectionChange = (selected: any) => {
        setSelectedSection(selected);
    };

    // Handle grade change
    const handleGradeChange = (selected: any) => {
        setSelectedGrade(selected);
    };

    // Reset filters
    const resetFilters = () => {
        resetDateRange();
        setSelectedSection(null);
        setSelectedGrade(null);
    };

    // Export report to Excel
    const exportToExcel = async () => {
        try {
            setIsExporting(true);
            
            const params = {
                ...dateParams,
                section_id: selectedSection?.id,
                grade_id: selectedGrade?.id,
                export: 'excel'
            };
            
            // Use a direct browser download approach
            const url = new URL('/api/reports/grading', window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value) url.searchParams.append(key, String(value));
            });

            // Open in a new tab to download
            window.open(url.toString(), '_blank');
            
            toast.success('Excel export initiated. Your download should begin shortly.');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export Excel report.');
        } finally {
            setIsExporting(false);
        }
    };

    // DataTable configuration
    const filterableColumns = [
        { label: 'Section', key: 'section.name' },
        { label: 'Grade', key: 'grade.name' }
    ];

    const columns = [
        {
            id: 'section',
            header: 'Section',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span>{row.original.section?.name || '-'}</span>
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
            id: 'total_weight',
            header: 'Total Weight',
            enableSorting: true,
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">
                        {parseFloat(row.original.total_weight).toFixed(2)} kg
                    </span>
                </div>
            ),
        },
        {
            id: 'total_pairs',
            header: 'Total Pairs',
            enableSorting: true,
            cell: ({ row }: { row: any }) => {
                return row.original.total_pairs > 0 ? (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            {parseInt(row.original.total_pairs).toLocaleString()}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            id: 'weight_type',
            header: 'Weight Type',
            enableSorting: false,
            cell: ({ row }: { row: any }) => {
                const section = row.original.section;
                const weightType = section?.weight_type || 'kg';
                return (
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                            {weightType.toUpperCase()}
                        </span>
                    </div>
                );
            },
        }
    ];

    // Update summary when data table is loaded
    const handleDataLoaded = (data: any) => {
        if (data && data.summary) {
            setSummary(data.summary);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Grading Report (Section-wise)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted/50 mb-6 grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-3 lg:grid-cols-4">
                        <div className="grid gap-2">
                            <Label htmlFor="from-date">From Date</Label>
                            <Input
                                id="from-date"
                                type="date"
                                value={dateParams.from_date}
                                onChange={(e) => handleDateRangeChange('from_date', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="to-date">To Date</Label>
                            <Input
                                id="to-date"
                                type="date"
                                value={dateParams.to_date}
                                onChange={(e) => handleDateRangeChange('to_date', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="section">Section</Label>
                            <AsyncSelectInput
                                route="/api/sections/select"
                                value={selectedSection}
                                onChange={handleSectionChange}
                                placeholder="All sections"
                                renderOption={(option) => option.name}
                                renderSelected={(option) => option.name}
                                isClearable={true}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Select 
                                value={selectedGrade?.id?.toString()} 
                                onValueChange={(value) => {
                                    const selected = grades.find(g => g.id.toString() === value);
                                    setSelectedGrade(selected || null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All grades" />
                                </SelectTrigger>
                                <SelectContent>
                                    {grades.map((grade) => (
                                        <SelectItem key={grade.id} value={grade.id.toString()}>
                                            {grade.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button variant="outline" onClick={resetFilters} className="h-10">
                                Reset Filters
                            </Button>
                            <Button variant="outline" onClick={exportToExcel} className="h-10 gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Export Excel'}
                            </Button>
                        </div>

                        <div className="flex items-end justify-end">
                            <div className="text-sm text-muted-foreground">
                                Showing data from {format(new Date(dateParams.from_date), 'dd/MM/yyyy')} to {format(new Date(dateParams.to_date), 'dd/MM/yyyy')}
                            </div>
                        </div>
                    </div>

                    {summary && (
                        <div className="mb-6 grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{summary.total_records}</div>
                                    <p className="text-sm text-muted-foreground">Total Records</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{parseFloat(summary.total_weight).toFixed(2)} kg</div>
                                    <p className="text-sm text-muted-foreground">Total Weight</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">
                                        {summary.total_pairs > 0 ? parseInt(summary.total_pairs).toLocaleString() : 'N/A'}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Total Pairs</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DataTable
                        filterableColumns={filterableColumns}
                        route="/api/reports/grading"
                        columns={columns}
                        pageSize={20}
                        params={{
                            ...dateParams,
                            section_id: selectedSection?.id,
                            grade_id: selectedGrade?.id,
                        }}
                        key={`${dateParams.from_date}-${dateParams.to_date}-${selectedSection?.id}-${selectedGrade?.id}`}
                        onDataLoaded={handleDataLoaded}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
