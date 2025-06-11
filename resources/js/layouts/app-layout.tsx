import BarcodeScannerDialog from '@/components/BarcodeScannerDialog';
import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    flash: {
        error?: string;
        success?: string;
        message?: string;
        status?: string;
    };
}

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    // Access flash messages from Inertia shared data
    const { flash } = usePage<PageProps>().props;

    const userPermissions = usePage().props.auth?.permissions || [];

    // Display toast messages when flash data is available
    useEffect(() => {
        // Show error flash messages
        if (flash.error) {
            toast.error(flash.error);
        }

        // Show success flash messages
        if (flash.success) {
            toast.success(flash.success);
        }

        // Show general flash messages
        if (flash.message) {
            toast.info(flash.message);
        }

        // Handle status messages (often from Laravel's default redirect responses)
        if (flash.status) {
            toast.info(flash.status);
        }
    }, [flash]);

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Global keyboard shortcut for barcode scanner
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Use KeyI for more reliable detection and check both ctrl and meta for Mac compatibility
            if ((event.ctrlKey || event.metaKey) && (event.key === 'i' || event.code === 'KeyI')) {
                event.preventDefault();
                event.stopPropagation();
                setIsScannerOpen(true);
            }
        };

        // Add event listener to document with capture phase to ensure it fires first
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster richColors invert theme="light" />
            <BarcodeScannerDialog isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
        </AppLayoutTemplate>
    );
};
