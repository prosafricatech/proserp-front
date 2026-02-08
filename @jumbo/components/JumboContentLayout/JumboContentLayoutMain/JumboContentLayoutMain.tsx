import useJumboContentLayout from '@jumbo/hooks/useJumboContentLayout';
import { Div } from '@jumbo/shared';
import { ContentLayoutContext } from '@jumbo/types/JumboContentLayout';
import React, { ReactNode } from 'react';

interface JumboContentLayoutMainProps {
    children: ReactNode;
}

const JumboContentLayoutMain = ({ children }: JumboContentLayoutMainProps) => {
    const contentLayout = useJumboContentLayout() as ContentLayoutContext;
    
    return (
        <Div
            sx={{
                display: 'flex',
                flex: 1,
                minWidth: 0,
                flexDirection: 'column',
                minHeight: '100%',
                ...contentLayout?.main?.sx
            }}
            className="CmtLayout-main"
        >
            {children}
        </Div>
    );
};

export default JumboContentLayoutMain;