import React, { ReactNode } from 'react';
import ListItem from "@mui/material/ListItem";
import { ListItemIcon } from "@mui/material";
import useJumboList from "@jumbo/components/JumboList/hooks/useJumboList";
import JumboItemCheckbox from '../JumboItemCheckbox/JumboItemCheckbox';

interface JumboListItemProps {
    component?: React.ElementType;
    componentElement?: React.ElementType;
    children?: ReactNode;
    itemData: Record<string, any>;
    secondaryAction?: ReactNode;
}

interface JumboListHook {
    bulkActions?: boolean;
}

const JumboListItem: React.FC<JumboListItemProps> = ({
    component,
    componentElement,
    children,
    itemData,
    ...restProps
}) => {
    const { bulkActions } = useJumboList() as JumboListHook;

    const ListItemComponent = component || ListItem;
    const componentProps = componentElement ? { component: componentElement } : {};

    return (
        <ListItemComponent {...componentProps} {...restProps}>
            {bulkActions && (
                <ListItemIcon>
                    {itemData && <JumboItemCheckbox itemData={itemData} />}
                </ListItemIcon>
            )}
            {children}
        </ListItemComponent>
    );
};

export default JumboListItem;
