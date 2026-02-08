import { getSettingMenus as getSettingMenuItems } from '@/utilities/constants/setting-menu-items';
async function getSettingMenus(locale: string) {
  // const res = await fetch('/api/menus/' + locale);
  // // The return value is *not* serialized
  // // You can return Date, Map, Set, etc.
  // if (!res.ok) {
  //   // This will activate the closest `error.js` Error Boundary
  //   throw new Error('Failed to fetch data');
  // }

  // return res.json();
  return getSettingMenuItems(locale);
}

export { getSettingMenus };
