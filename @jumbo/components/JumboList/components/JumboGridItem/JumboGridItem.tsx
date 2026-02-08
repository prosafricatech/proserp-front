import { Grid } from '@mui/material';
import React from 'react';

interface JumboGridItemProps {
    children: React.ReactNode;
    component?: React.ElementType;
    componentProps?: React.ComponentProps<any>;
    [key: string]: any;
}

const JumboGridItem: React.FC<JumboGridItemProps> = ({
    children, 
    component, 
    componentProps, 
    ...props
}) => {
    const ItemComponent = React.useMemo(() => component, [component]);

    return (
        <Grid {...props}>
            {
                !ItemComponent && children
            }
            {
                ItemComponent &&
                <ItemComponent {...componentProps}>
                    {children}
                </ItemComponent>
            }
        </Grid>
    );
};

export default JumboGridItem;
