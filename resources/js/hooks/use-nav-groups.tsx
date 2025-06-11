import { Users, Shield, Key, LayoutDashboard, Settings, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { type NavGroup } from '@/types';

export function useNavGroups() {
    return useMemo<NavGroup[]>(
        () => [
            {
                title: 'Platform',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/',
                        icon: LayoutDashboard,
                    },
                    {
                        title: 'User Management',
                        icon: Users,
                        items: [
                            {
                                title: 'Users',
                                href: '/users',
                            },
                            {
                                title: 'Roles',
                                href: '/roles',
                            },
                            {
                                title: 'Permissions',
                                href: '/permissions',
                            },
                        ],
                    },
                    {
                        title: 'Settings',
                        href: '/settings',
                        icon: Settings,
                    },
                ],
            },
        ],
        []
    );
}