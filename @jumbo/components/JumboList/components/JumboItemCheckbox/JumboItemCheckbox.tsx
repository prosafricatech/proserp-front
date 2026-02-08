import React from 'react';
import useJumboList from "../../hooks/useJumboList";
import Checkbox from "@mui/material/Checkbox";
import { getArrayElementFromKey } from '@jumbo/utilities/systemHelpers';

interface ItemData {
    [key: string]: any;
}

interface JumboListHook {
    primaryKey: string;
    selectedItems: ItemData[];
    setSelectedItems: React.Dispatch<React.SetStateAction<ItemData[]>>;
}

const JumboItemCheckbox: React.FC<{ itemData: ItemData }> = ({ itemData }) => {
    const { primaryKey, selectedItems, setSelectedItems } = useJumboList() as JumboListHook;
    const itemID = getArrayElementFromKey(itemData, primaryKey);

    const onSelectionChange = () => {
        const isSelected = selectedItems.findIndex(
            (item) => getArrayElementFromKey(item, primaryKey) === itemID
        ) >= 0;

        if (isSelected) {
            setSelectedItems(
                selectedItems.filter((item) => getArrayElementFromKey(item, primaryKey) !== itemID)
            );
        } else {
            setSelectedItems([...selectedItems, itemData]);
        }
    };

    return (
        <Checkbox
            color="primary"
            checked={selectedItems.findIndex(
                (item) => getArrayElementFromKey(item, primaryKey) === itemID
            ) >= 0}
            onChange={onSelectionChange}
        />
    );
};

export default JumboItemCheckbox;
