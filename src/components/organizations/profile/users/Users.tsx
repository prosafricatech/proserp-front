'use client'

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import React from 'react'
import { UsersList } from './UsersList';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const Users = () => {
    const {theme} = useJumboTheme();
    const layoutOptions = React.useMemo(() => ({
        sidebar: {
            sx: {
                [theme.breakpoints.up('lg')]: {
                    position: 'sticky',
                    zIndex: 5,
                    top: 96,
                    minHeight: 'auto',
                },
                [theme.breakpoints.down('lg')]: {
                    display: 'none',
                },
            }
        },
        wrapper: {
            sx: {
                alignItems: 'flex-start',
            }
        },
    }), [theme]);

    return (
        <JumboContentLayout layoutOptions={layoutOptions}>
            <UsersList />
        </JumboContentLayout>
    );
}

export default Users
