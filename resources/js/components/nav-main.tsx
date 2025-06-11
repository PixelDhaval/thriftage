import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const getBaseUrl = (url: string) => {
        return '/' + url.split('/')[1];
    };

    // Set initially active menu based on current URL
    useEffect(() => {
        const activeParent = items.find(item => 
            item.items?.some(subItem => getBaseUrl(subItem.href) === getBaseUrl(page.url))
        );
        if (activeParent) {
            setOpenMenus(prev => ({
                ...prev,
                [activeParent.title]: true
            }));
        }
    }, [page.url, items]);

    const toggleMenu = (title: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const isItemActive = (item: NavItem): boolean => {
        if (item.href && getBaseUrl(item.href) === getBaseUrl(page.url)) return true;
        if (item.items?.some(subItem => getBaseUrl(subItem.href) === getBaseUrl(page.url))) return true;
        return false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.items ? (
                            <>
                                <SidebarMenuButton
                                    onClick={() => toggleMenu(item.title)}
                                    isActive={isItemActive(item)}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronDown 
                                        className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                                            openMenus[item.title] ? 'rotate-180' : ''
                                        }`}
                                    />
                                </SidebarMenuButton>
                                {openMenus[item.title] && (
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={getBaseUrl(subItem.href) === getBaseUrl(page.url)}
                                                >
                                                    <Link href={subItem.href} prefetch>
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                )}
                            </>
                        ) : (
                            <SidebarMenuButton  
                                asChild 
                                isActive={isItemActive(item)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href!} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
