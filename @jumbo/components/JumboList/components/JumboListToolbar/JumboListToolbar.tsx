'use client'

import React, { useEffect } from 'react';
import { ListItem, ListItemText, Stack, Zoom } from "@mui/material";
import ToolbarAction from "@jumbo/components/JumboList/components/JumboListToolbar/ToolbarAction";
import useJumboList, { JumboListContextType } from '../../hooks/useJumboList';
import { Div } from '@jumbo/shared';
import MultiSelectControl from './MultiSelectControl';
import { JumboListToolbarProps } from '@jumbo/types/JumboListToolbarProps';

const JumboListToolbar: React.FC<JumboListToolbarProps> = ({
    children,
    bulkActions,
    hidePagination = false,
    action,
    actionTail
}) => {
    
    const {
        selectedItems,
        data,
        setBulkActions,
    } = useJumboList() as JumboListContextType;

    useEffect(() => {
        const actions = bulkActions
            ? Array.isArray(bulkActions) 
                ? bulkActions 
                : [bulkActions]
            : [];
        setBulkActions?.(actions);
    }, [bulkActions, setBulkActions]);

    const hasNoVisibleElements =
        !children &&
        hidePagination &&
        !action &&
        !actionTail &&
        (!bulkActions || React.Children.count(bulkActions) === 0);

    if (hasNoVisibleElements) {
        return null;
    }

    return (
        <ListItem component="div">
            <ListItemText
                primary={
                    <Stack direction="row" spacing={2} alignItems="center">
                        {
                            bulkActions && data?.length > 0 && (
                                <Div>
                                    <MultiSelectControl />
                                </Div>
                            )
                        }
                        {
                            bulkActions && selectedItems.length > 0 && (
                                <Zoom in={selectedItems.length > 0}>
                                    <Div>
                                        {bulkActions}
                                    </Div>
                                </Zoom>
                            )
                        }
                        {children && (
                            <Div>
                                {children}
                            </Div>
                        )}
                    </Stack>
                }
            />
            <ToolbarAction 
                actionTail={actionTail} 
                action={action} 
            />
        </ListItem>
    );
};

export default JumboListToolbar;
