import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays } from 'date-fns';
import { 
    ArrowUpRight, Package, PackageOpen, Scale, ArrowRight, 
    PieChart as PieChartIcon, BarChart as BarChartIcon, 
    Layers, FileStack, FileBarChart 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Custom color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalBags: 0,
        openedBags: 0,
        unopenedBags: 0,
        gradedBags: 0,
        gradedItems: 0,
        totalWeight: 0,
        importStats: {
            total: 0,
            container: 0,
            local: 0
        }
    });
    const [bagDistribution, setBagDistribution] = useState<any[]>([]);
    const [itemsBySection, setItemsBySection] = useState<any[]>([]);
    const [gradedBySection, setGradedBySection] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/dashboard');
                
                // Update state with response data
                setStats(response.data.stats);
                setBagDistribution(response.data.bagDistribution);
                setItemsBySection(response.data.itemsBySection);
                setGradedBySection(response.data.gradedBySection);
                setRecentActivity(response.data.recentActivity);
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Calculate stats percentages
    const openedPercentage = stats.totalBags > 0 ? Math.round((stats.openedBags / stats.totalBags) * 100) : 0;
    
    // Sample daily activity data (replace with actual data in production)
    const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
            date: format(date, 'MM/dd'),
            openedBags: Math.floor(Math.random() * 50) + 10,
            gradedItems: Math.floor(Math.random() * 30) + 5,
            gradedBags: Math.floor(Math.random() * 40) + 8,
        };
    }).reverse();

    // Quick action links
    const quickActions = [
        { name: "Add Import", icon: Package, href: "/imports", color: "bg-blue-100 text-blue-700" },
        { name: "Open Bags", icon: PackageOpen, href: "/bags-opening", color: "bg-green-100 text-green-700" },
        { name: "Create Graded Bags", icon: Scale, href: "/graded-bags-pools", color: "bg-purple-100 text-purple-700" },
        { name: "View Reports", icon: FileBarChart, href: "/reports", color: "bg-indigo-100 text-indigo-700" },
    ];
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome to TexWool WareViz - Your warehouse visualization system</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {quickActions.map((action, i) => (
                            <Link href={action.href} key={i}>
                                <Button variant="outline" className="h-10 gap-2">
                                    <action.icon className="h-4 w-4" />
                                    {action.name}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Key Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="flex flex-row items-center justify-between p-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Import Bags</p>
                                <h3 className="mt-2 text-3xl font-bold">{stats.totalBags.toLocaleString()}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    <span className={`font-medium ${openedPercentage >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {openedPercentage}% opened
                                    </span>
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3">
                                <Package className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="flex flex-row items-center justify-between p-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Opened Bags</p>
                                <h3 className="mt-2 text-3xl font-bold">{stats.openedBags.toLocaleString()}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Ready for processing</p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3">
                                <PackageOpen className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="flex flex-row items-center justify-between p-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Graded Items</p>
                                <h3 className="mt-2 text-3xl font-bold">{stats.gradedItems.toLocaleString()}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Total weight: {stats.totalWeight.toLocaleString()} kg</p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3">
                                <Layers className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="flex flex-row items-center justify-between p-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Graded Bags</p>
                                <h3 className="mt-2 text-3xl font-bold">{stats.gradedBags.toLocaleString()}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Ready for export</p>
                            </div>
                            <div className="rounded-full bg-amber-100 p-3">
                                <Scale className="h-8 w-8 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Bag Status Distribution */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium">Import Bag Status Distribution</CardTitle>
                            <CardDescription>Overview of opened vs unopened bags in the system</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Opened', value: stats.openedBags },
                                                { name: 'Unopened', value: stats.unopenedBags }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill="#4ade80" /> {/* Green for opened */}
                                            <Cell fill="#f87171" /> {/* Red for unopened */}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} bags`, '']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items by Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium">Items by Section</CardTitle>
                            <CardDescription>Distribution of items across different sections</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={itemsBySection.length ? itemsBySection : [
                                            { name: 'Section A', count: 65 },
                                            { name: 'Section B', count: 40 },
                                            { name: 'Section C', count: 25 },
                                            { name: 'Section D', count: 15 },
                                        ]}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" name="Number of Items" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    
                
                    {/* Graded Items by Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-medium">Graded Weight by Section</CardTitle>
                                    <CardDescription>Total graded weight distribution across sections</CardDescription>
                                </div>
                                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gradedBySection.length ? gradedBySection : [
                                                { name: 'Section A', value: 650 },
                                                { name: 'Section B', value: 400 },
                                                { name: 'Section C', value: 250 },
                                                { name: 'Section D', value: 150 },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {(gradedBySection.length ? gradedBySection : [
                                                { name: 'Section A', value: 650 },
                                                { name: 'Section B', value: 400 },
                                                { name: 'Section C', value: 250 },
                                                { name: 'Section D', value: 150 },
                                            ]).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} kg`, '']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Import Types Distribution */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-medium">Import Types Distribution</CardTitle>
                                    <CardDescription>Container vs local imports</CardDescription>
                                </div>
                                <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={[
                                            { name: 'Container', value: stats.importStats.container },
                                            { name: 'Local', value: stats.importStats.local },
                                        ]}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Number of Imports" fill="#0088FE" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Recent Activity and Shortcuts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Activity */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest actions across the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.length ? (
                                    recentActivity.map((activity, i) => (
                                        <div key={i} className="flex items-start gap-4 rounded-lg border p-3">
                                            <div className={`${activity.iconBg} rounded-full p-2`}>
                                                {activity.icon === 'package' && <Package className="h-5 w-5" />}
                                                {activity.icon === 'packageOpen' && <PackageOpen className="h-5 w-5" />}
                                                {activity.icon === 'layers' && <Layers className="h-5 w-5" />}
                                                {activity.icon === 'scale' && <Scale className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{activity.title}</p>
                                                <p className="text-muted-foreground text-sm">{activity.description}</p>
                                            </div>
                                            <div className="text-muted-foreground text-sm">
                                                {activity.timestamp}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Demo data when no real data is loaded
                                    [
                                        {
                                            icon: 'package',
                                            iconBg: 'bg-blue-100 text-blue-700',
                                            title: 'New Import Added',
                                            description: 'Container #CN12345 with 240 bags was imported',
                                            timestamp: '2 hours ago'
                                        },
                                        {
                                            icon: 'packageOpen',
                                            iconBg: 'bg-green-100 text-green-700',
                                            title: '120 Bags Opened',
                                            description: 'Bags from Container #CN12345 were opened',
                                            timestamp: '1 hour ago'
                                        },
                                        {
                                            icon: 'layers',
                                            iconBg: 'bg-purple-100 text-purple-700',
                                            title: 'Graded Items Created',
                                            description: '580 kg of items were graded from Section A',
                                            timestamp: '45 minutes ago'
                                        },
                                        {
                                            icon: 'scale',
                                            iconBg: 'bg-amber-100 text-amber-700',
                                            title: 'Graded Bags Created',
                                            description: '35 graded bags were created for export',
                                            timestamp: '30 minutes ago'
                                        }
                                    ].map((activity, i) => (
                                        <div key={i} className="flex items-start gap-4 rounded-lg border p-3">
                                            <div className={`${activity.iconBg} rounded-full p-2`}>
                                                {activity.icon === 'package' && <Package className="h-5 w-5" />}
                                                {activity.icon === 'packageOpen' && <PackageOpen className="h-5 w-5" />}
                                                {activity.icon === 'layers' && <Layers className="h-5 w-5" />}
                                                {activity.icon === 'scale' && <Scale className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{activity.title}</p>
                                                <p className="text-muted-foreground text-sm">{activity.description}</p>
                                            </div>
                                            <div className="text-muted-foreground text-sm">
                                                {activity.timestamp}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-center">
                                <Button variant="outline" className="w-full">
                                    View All Activity
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shortcuts and Info Card */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Access</CardTitle>
                                <CardDescription>Common tasks and shortcuts</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                {quickActions.map((action, i) => (
                                    <Link href={action.href} key={i} className="no-underline">
                                        <div className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <div className={`${action.color} rounded-full p-2`}>
                                                    <action.icon className="h-5 w-5" />
                                                </div>
                                                <span>{action.name}</span>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock Summary</CardTitle>
                                <CardDescription>Current stock status</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm">Import Stock</span>
                                    <span className="font-semibold">{stats.unopenedBags} bags</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm">In Process Stock</span>
                                    <span className="font-semibold">{stats.openedBags} bags</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm">Graded Stock</span>
                                    <span className="font-semibold">{stats.totalWeight.toLocaleString()} kg</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Export Stock</span>
                                    <span className="font-semibold">{stats.gradedBags} bags</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
