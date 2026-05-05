// Utility to flatten menu structure into a flat list of { label, uri } for global search
// Usage: flattenMenuItems(await getMenus(locale))

export type FlatMenuItem = {
  label: string;
  uri: string;
  icon?: string;
};

function flattenMenuItems(menuItems: any[]): FlatMenuItem[] {
  const flat: FlatMenuItem[] = [];

  function recurse(items: any[]) {
    for (const item of items) {
      if (item.type === 'nav-item' && item.uri && item.label) {
        flat.push({ label: item.label, uri: item.uri, icon: item.icon });
      }
      if (item.children && Array.isArray(item.children)) {
        recurse(item.children);
      }
    }
  }

  recurse(menuItems);
  return flat;
}

export { flattenMenuItems };
