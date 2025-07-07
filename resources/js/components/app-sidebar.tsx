import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, KeyRound, Shield, Settings, Settings2, ArrowLeftRight, Box, FileBarChart } from 'lucide-react';
import AppLogo from './app-logo';
import { useMemo } from 'react';

// Define base navigation items with required permissions
const baseNavItems: (NavItem & { requiredPermissions?: string[] })[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        // Dashboard typically available to all authenticated users
    },
    {
        title: 'Imports',
        href: '/imports',
        icon: Folder,
        requiredPermissions: ['imports-read'],
    },
    {
        title: 'Bags Opening',
        href: '/bags-opening',
        icon: ArrowLeftRight,
        requiredPermissions: ['bags-opening-read'],
    },
    {
        title: 'Graded Bags',
        href: '/graded-bags-pools',
        icon: Box,
        requiredPermissions: ['graded-bags-pools-read'],
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: FileBarChart,
        requiredPermissions: ['report-production-read', 'report-grading-read'],
    },
    {
        title: 'Master',
        href: '#',
        icon: BookOpen,
        requiredPermissions: ['items-read', 'sections-read', 'grades-read', 'weights-read', 'parties-read'],
        items: [
            {
                title: 'Items',
                href: '/items',
                requiredPermissions: ['items-read', 'sections-read', 'grades-read', 'weights-read']
            },
            {
                title: 'Parties',
                href: '/parties',
                requiredPermissions: ['parties-read']
            }
        ]
    },
    {
        title: 'User Management',
        href: '#',
        icon: Users,
        requiredPermissions: ['users-read', 'roles-read', 'permissions-read'],
        items: [
            {
                title: 'Users',
                href: '/users',
                requiredPermissions: ['users-read']
            },
            {
                title: 'Roles',
                href: '/roles',
                requiredPermissions: ['roles-read']
            },
            {
                title: 'Permissions',
                href: '/permissions',
                requiredPermissions: ['permissions-read']
            }
        ]
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.permissions || [];

    // Filter menu items based on user permissions
    const mainNavItems = useMemo(() => {
        // Helper function to check if user has required permissions
        const hasRequiredPermissions = (item: any): boolean => {
            // If no permissions specified, allow access
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
                return true;
            }
            
            // Check if user has ANY of the required permissions
            return item.requiredPermissions.some((permission: string) => 
                userPermissions.includes(permission)
            );
        };

        // Filter main navigation items
        return baseNavItems
            .filter(hasRequiredPermissions)
            .map(item => {
                // If item has sub-items, filter those too
                if (item.items) {
                    const filteredItems = item.items.filter(hasRequiredPermissions);
                    
                    // Only include parent item if it has at least one visible sub-item
                    if (filteredItems.length === 0) {
                        return null;
                    }
                    
                    // Return parent with filtered sub-items
                    return {
                        ...item,
                        items: filteredItems,
                    };
                }
                
                // Return item without sub-items
                return item;
            })
            .filter(Boolean) as NavItem[]; // Filter out null items and cast to NavItem[]
    }, [userPermissions]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
                <div className="text-muted-foreground py-2 text-xs text-center">Powered by <a href="https://adsvizion.net" className="underline">ADS Vizion</a></div>
            </SidebarFooter>
        </Sidebar>
    );
}
