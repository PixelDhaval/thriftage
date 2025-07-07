import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ProductionReport from './Reports/ProductionReport';
import GradingReport from './Reports/GradingReport';

// Define available reports with their required permissions
const ALL_REPORTS = [
    { id: 'production', name: 'Production Report - Graded Bags Summary', permission: 'report-production-read' },
    { id: 'grading', name: 'Grading Report - Section-wise', permission: 'report-grading-read' },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    }
];

export default function Index() {
    const [selectedReport, setSelectedReport] = useState<string>('');
    const [availableReports, setAvailableReports] = useState<typeof ALL_REPORTS>([]);
    const userPermissions = usePage().props.auth?.permissions || [];
    
    // Check if user has general reports permission
    const hasGeneralReportPermission = userPermissions.includes('reports-read');

    // Filter reports based on user permissions
    useEffect(() => {
        const filteredReports = ALL_REPORTS.filter(report => 
            userPermissions.includes(report.permission)
        );
        
        setAvailableReports(filteredReports);
        
        // Select the first available report by default
        if (filteredReports.length > 0 && !selectedReport) {
            setSelectedReport(filteredReports[0].id);
        }
    }, [userPermissions]);

    const renderReport = () => {
        if (!hasGeneralReportPermission) {
            return (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-center text-red-500">
                            You don't have permission to view reports.
                        </p>
                    </CardContent>
                </Card>
            );
        }
        
        if (availableReports.length === 0) {
            return (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-center text-amber-600">
                            You don't have permission to access any specific reports.
                        </p>
                    </CardContent>
                </Card>
            );
        }
        
        switch (selectedReport) {
            case 'production':
                return userPermissions.includes('report-production-read') 
                    ? <ProductionReport /> 
                    : <NoPermissionCard report="Production Report" />;
            case 'grading':
                return userPermissions.includes('report-grading-read') 
                    ? <GradingReport /> 
                    : <NoPermissionCard report="Grading Report" />;
            default:
                return (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-center">Please select a report to view.</p>
                        </CardContent>
                    </Card>
                );
        }
    };

    // Helper component for no permission message
    const NoPermissionCard = ({ report }: { report: string }) => (
        <Card>
            <CardContent className="p-6">
                <p className="text-center text-red-500">
                    You don't have permission to view the {report}.
                </p>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold">Reports</h1>
                    <p className="text-muted-foreground">
                        View various reports to analyze your business data
                    </p>
                </div>

                {/* Report Selection */}
                {hasGeneralReportPermission && availableReports.length > 0 && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Select Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="report-select">Report Type</Label>
                                    <Select
                                        value={selectedReport}
                                        onValueChange={setSelectedReport}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a report" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableReports.map((report) => (
                                                <SelectItem key={report.id} value={report.id}>
                                                    {report.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Render selected report */}
                {renderReport()}
            </div>
        </AppLayout>
    );
}
