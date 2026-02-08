import { Div } from '@jumbo/shared';
import React, { ReactNode } from 'react';

type JumboContentLayoutFooterProps = {
    children: ReactNode;
};

const JumboContentLayoutFooter = ({ children }: JumboContentLayoutFooterProps) => {
    return (
        <Div
            sx={{
                padding: (theme) => theme.spacing(2, 3),
                backgroundColor: (theme) => theme.palette.error.main,
            }}
            className="CmtLayout-footer"
        >
            {children}
        </Div>
    );
};

export default JumboContentLayoutFooter;