import BarcodeScannerDialog from '@/components/BarcodeScannerDialog';
import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import CreateGradedBagPoolForm from '@/pages/GradedBagsPools/CreateGradedBagPoolForm';
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
    const [isGradedBagsFormOpen, setIsGradedBagsFormOpen] = useState(false);

    // Global keyboard shortcut for barcode scanner
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Use KeyI for more reliable detection and check both ctrl and meta for Mac compatibility
            if ((event.ctrlKey || event.metaKey) && (event.key === 'i' || event.code === 'KeyI')) {
                // Check if user has permission to scan bags
                if (userPermissions.includes('import-bags-update') || userPermissions.includes('graded-bags-pools-update')) {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsGradedBagsFormOpen(false);
                    setIsScannerOpen(true);
                }
            } else if((event.ctrlKey || event.metaKey) && (event.key === 'o' || event.code === 'KeyO')){
                // Check if user has permission to create graded bags
                if (userPermissions.includes('graded-bags-pools-create')) {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsScannerOpen(false)
                    setIsGradedBagsFormOpen(true);
                }
            }
        };

        // Add event listener to document with capture phase to ensure it fires first
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [userPermissions]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster richColors invert theme="light" />
            {userPermissions.includes('import-bags-update') && (
                <BarcodeScannerDialog isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
            )}
            {userPermissions.includes('graded-bags-pools-create') && (
                <CreateGradedBagPoolForm 
                    isOpen={isGradedBagsFormOpen} 
                    onClose={() => setIsGradedBagsFormOpen(false)} 
                    onSuccess={() => {
                        setIsGradedBagsFormOpen(false);
                        window.refreshDataTable?.();
                    }}
                />
            )}
        </AppLayoutTemplate>
    );
};
