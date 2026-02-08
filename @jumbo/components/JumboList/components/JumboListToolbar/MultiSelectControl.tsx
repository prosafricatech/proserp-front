import React from 'react';
import useJumboList from "@jumbo/components/JumboList/hooks/useJumboList";
import Checkbox from "@mui/material/Checkbox";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { getArrayElementFromKey } from '@jumbo/utilities/systemHelpers';

 interface MultiSelectOption<T = any> {
    label: string;
    selectionLogic: (data: T[], primaryKey: keyof T | string) => T[];
  }
  
  interface UseJumboListResult<T = any> {
    selectedItems: T[];
    setSelectedItems: (items: T[]) => void;
    multiSelectOptions?: MultiSelectOption<T>[];
    data: T[];
    primaryKey: keyof T | string;
  }

const MultiSelectControl: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const {
    selectedItems,
    setSelectedItems,
    multiSelectOptions,
    data,
    primaryKey,
  } = useJumboList() as UseJumboListResult;

  const open = Boolean(anchorEl);

  const selectedCountOnActivePage = React.useMemo(() => {
    const selectedOnPage = data.filter((dataItem) => {
      const itemInSelected = selectedItems.filter(
        (item) =>
          getArrayElementFromKey(item, primaryKey as string) ===
          getArrayElementFromKey(dataItem, primaryKey as string)
      );
      return itemInSelected.length > 0;
    });

    return selectedOnPage.length;
  }, [data, selectedItems, primaryKey]);

  const dataCount = React.useMemo(() => data.length, [data]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectAllClick = () => {
    const selectedData: any[] = [];

    if (selectedItems.length < data.length && selectedItems.length === 0)
      selectedData.push(...data);

    setSelectedItems(selectedData);
  };

  const onMultiSelection = (logicFunc: (data: any[], primaryKey: string) => any[]) => {
    setSelectedItems(logicFunc(data, primaryKey as string));
  };

  return (
    <>
      <Checkbox
        color="primary"
        indeterminate={selectedCountOnActivePage > 0 && selectedCountOnActivePage < dataCount}
        checked={dataCount > 0 && selectedCountOnActivePage === dataCount}
        onChange={handleSelectAllClick}
      />
      {multiSelectOptions && multiSelectOptions.length > 0 && (
        <>
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? 'long-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleClick}
          >
            <ArrowDropDownIcon />
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {multiSelectOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  onMultiSelection(option.selectionLogic);
                  handleClose();
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </>
  );
};

export default MultiSelectControl;
