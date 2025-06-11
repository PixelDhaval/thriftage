import * as React from 'react';

interface PortalProviderProps {
    children: React.ReactNode;
}

export function PortalProvider({ children }: PortalProviderProps) {
    const [portalRoot] = React.useState(() => {
        const root = document.createElement('div');
        root.style.position = 'fixed';
        root.style.left = '0';
        root.style.top = '0';
        root.style.width = '100%';
        root.style.height = '100%';
        root.style.pointerEvents = 'none';
        root.style.zIndex = '9999';
        return root;
    });

    React.useEffect(() => {
        document.body.appendChild(portalRoot);
        return () => {
            document.body.removeChild(portalRoot);
        };
    }, [portalRoot]);

    return children;
}