import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";

interface PageProps {
  errors: Record<string, string>;
  flash: {
    error?: string;
    success?: string;
    message?: string;
    status?: string;
  };
}

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title: string; description: string }) {
    // Access errors and flash messages from Inertia shared data
    const { errors, flash } = usePage<PageProps>().props;

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

    // Log validation errors to console (optional)
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('Validation errors:', errors);
        }
    }, [errors]);

    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
            <Toaster richColors invert theme='light' />
        </AuthLayoutTemplate>
    );
}
