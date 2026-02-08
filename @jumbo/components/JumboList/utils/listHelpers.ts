import { getArrayElementFromKey } from "@jumbo/utilities/systemHelpers";

export const getUpdatedSelectedItems = <T extends Record<string, any>>(
  currentItems: T[],
  newItem: T | T[],
  primaryKey: keyof T
): T[] => {
  if (Array.isArray(newItem)) {
    return newItem;
  }

  const newList = currentItems.filter(item => item[primaryKey] !== newItem[primaryKey]);

  if (newList.length === currentItems.length) {
    newList.push(newItem);
  }

  return newList;
};

export const selectAllItems = <T extends Record<string, any>>(
  data: T[],
  primaryKey: keyof T
): (string | number | undefined)[] => {
  const selectedKeys: (string | number | undefined)[] = [];

  data.forEach(item => {
    const itemID = getArrayElementFromKey(item, primaryKey);
    selectedKeys.push(itemID);
  });

  return selectedKeys;
};
