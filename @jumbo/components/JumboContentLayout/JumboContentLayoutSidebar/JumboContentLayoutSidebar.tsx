import useJumboContentLayout from '@jumbo/hooks/useJumboContentLayout';
import { Div } from '@jumbo/shared';
import { ContentLayoutContext } from '@jumbo/types/JumboContentLayout';
import React, { ReactNode } from 'react';

interface JumboContentLayoutSidebarProps {
    children: ReactNode;
}

const JumboContentLayoutSidebar = ({ children }: JumboContentLayoutSidebarProps) => {
    const contentLayout = useJumboContentLayout() as ContentLayoutContext;
    
    return (
        <Div
            sx={{
                display: 'flex',
                minWidth: 0,
                flexDirection: 'column',
                width: 200,
                mr: 3,
                flexShrink: 0,
                minHeight: '100%',
                ...contentLayout?.sidebar?.sx
            }}
            className="CmtLayout-sidebar"
        >
            {children}
        </Div>
    );
};

export default JumboContentLayoutSidebar;