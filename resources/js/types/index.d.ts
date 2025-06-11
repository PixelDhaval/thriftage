import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href?: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: SubNavItem[];
    requiredPermissions?: string[];
}

export interface SubNavItem {
    title: string;
    href: string;
    isActive?: boolean;
    requiredPermissions?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: Permission[];
    [key: string]: unknown; // This allows for additional properties...
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Section {
    id: string;
    name: string;
    created_by: User;
    updated_by: User;
}

export interface Item {
    id: string;
    name: string;
    section_id: string;
    description?: string;
    section?: Section;
    created_by: User;
    updated_by: User;
}

export interface Grade {
    id: string;
    name: string;
    created_by: User;
    updated_by: User;
}

export interface Weight {
    id: string;
    weight: number;
    created_by: User;
    updated_by: User;
}

export interface Party {
    id: string;
    name: string;
    type?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
    gst?: string;
    created_by: User;
    updated_by: User;
}

export interface Import {
    id: string;
    party_id: string;
    container_no: string;
    movement_date: string;
    bl_no: string;
    bl_date: string;
    be_no: string;
    be_date: string;
    bl_weight: number;
    weigh_bridge_weight: number;
    type: string;
    created_by: User;
    updated_by: User;
    party?: Party;
    bags?: ImportItem[];
    
}