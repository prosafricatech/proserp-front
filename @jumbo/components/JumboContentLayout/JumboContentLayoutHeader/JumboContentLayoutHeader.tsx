import useJumboContentLayout from '@jumbo/hooks/useJumboContentLayout';
import { Div } from '@jumbo/shared';
import { ContentLayoutContext } from '@jumbo/types/JumboContentLayout';
import React, { ReactNode } from 'react';

interface JumboContentLayoutHeaderProps {
    children: ReactNode;
}

const JumboContentLayoutHeader = ({ children }: JumboContentLayoutHeaderProps) => {
    const contentLayout = useJumboContentLayout() as ContentLayoutContext;
    
    return (
        <Div
            sx={{
                ...contentLayout?.header?.sx
            }}
            className="CmtLayout-header"
        >
            {children}
        </Div>
    );
};

export default JumboContentLayoutHeader;