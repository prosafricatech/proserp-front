'use client'

import React, { useEffect } from 'react';
import useJumboContentLayout from "@jumbo/hooks/useJumboContentLayout";
import JumboContentLayoutHeader from "./JumboContentLayoutHeader";
import JumboContentLayoutSidebar from "./JumboContentLayoutSidebar";
import JumboContentLayoutMain from "./JumboContentLayoutMain";
import JumboContentLayoutFooter from "./JumboContentLayoutFooter";
import { Box } from "@mui/material";
import { Div } from '@jumbo/shared';
import { ContentLayoutContext, JumboContentLayoutProps } from '@jumbo/types/JumboContentLayout';

const JumboContentLayout = ({ header, footer, sidebar, children, layoutOptions }: JumboContentLayoutProps) => {
    const { setContentLayout, ...contentLayout } = useJumboContentLayout() as ContentLayoutContext;

    useEffect(() => {
        if (layoutOptions && setContentLayout) {
            setContentLayout(layoutOptions);
        }
    }, [layoutOptions, setContentLayout]);

    return (
        <Div
            sx={{
                display: 'flex',
                flex: 1,
                minWidth: 0,
                minHeight: '100%',
                flexDirection: 'column',
                ...contentLayout?.root?.sx,
            }}
            className="CmtLayout-root"
        >
            {header && contentLayout.header?.spreadOut && (
                <JumboContentLayoutHeader>
                    {header}
                </JumboContentLayoutHeader>
            )}
            
            <Box
                component={layoutOptions?.wrapper?.component ?? Div}
                sx={{
                    display: 'flex',
                    flex: 1,
                    minWidth: 0,
                    zIndex: 2,
                    position: 'relative',
                    ...(layoutOptions?.wrapper?.sx ?? {})
                }}
                className="CmtLayout-wrapper"
            >
                {sidebar && (
                    <JumboContentLayoutSidebar>
                        {sidebar}
                    </JumboContentLayoutSidebar>
                )}
                
                <JumboContentLayoutMain>
                    {header && !contentLayout.header?.spreadOut && (
                        <JumboContentLayoutHeader>
                            {header}
                        </JumboContentLayoutHeader>
                    )}
                    
                    <Div
                        sx={{
                            display: 'flex',
                            minWidth: 0,
                            flex: 1,
                            flexDirection: 'column',
                            ...contentLayout?.content?.sx
                        }}
                        className="CmtLayout-content"
                    >
                        {children}
                    </Div>
                    
                    {footer && !contentLayout.footer?.spreadOut && (
                        <JumboContentLayoutFooter>
                            {footer}
                        </JumboContentLayoutFooter>
                    )}
                </JumboContentLayoutMain>
            </Box>
            
            {footer && contentLayout.footer?.spreadOut && (
                <JumboContentLayoutFooter>
                    {footer}
                </JumboContentLayoutFooter>
            )}
        </Div>
    );
};

export default JumboContentLayout;