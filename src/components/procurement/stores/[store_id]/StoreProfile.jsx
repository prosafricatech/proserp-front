'use client'

import JumboContentLayout from '@jumbo/components/JumboContentLayout'
import { Card, useMediaQuery } from '@mui/material';
import React from 'react'
import StoreProfileContent from './StoreProfileContent';
import StoreProfileHeader from './StoreProfileHeader'
import StoreProfileProvider from './StoreProfileProvider';
import StoreProfileSidebar from './StoreProfileSidebar';
import StoreSelectionForMobile from './StoreSelectionForMobile';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import JumboContentLayoutProvider from '@jumbo/components/JumboContentLayout/JumboContentLayoutProvider';

function StoreProfile() {
    const { theme } = useJumboTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
       setMounted(true);
    }, []);
    
    const layoutOptions = React.useMemo(() => ({
        sidebar: {
            sx: {
                [theme.breakpoints.up('lg')]: {
                    zIndex: 5,
                    top: 96,
                    minHeight: 'auto',
                },
                [theme.breakpoints.down('lg')]: {
                    display: 'none',
                }
            }
        },
        wrapper: {
            component: Card,
            sx: {
                alignItems: 'flex-start',
            }
        },
    }), [theme]);

    if (!mounted) return null;

    return (
        <StoreProfileProvider>
            <JumboContentLayoutProvider>
                <JumboContentLayout
                    header={<StoreProfileHeader />}
                    sidebar={<StoreProfileSidebar />}
                    layoutOptions={layoutOptions}
                >
                    {smallScreen && <StoreSelectionForMobile />}
                    <StoreProfileContent />
                </JumboContentLayout>
            </JumboContentLayoutProvider>
        </StoreProfileProvider>
    );
}

export default StoreProfile;