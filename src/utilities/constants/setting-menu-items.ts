import { getDictionary } from '@/app/[lang]/dictionaries';

export async function getSettingMenus(locale: string) {
  const dictionary = await getDictionary(locale);
  const { settingSidebar } = dictionary;
  return [
    {
      label: settingSidebar.menu.account,
      children: [
        {
          path: `/${locale}/user/settings/public-profile`,
          label: settingSidebar.menuItem.publicProfile,
          icon: 'public-profile',
        },
        {
          path: `/${locale}/user/settings/team`,
          label: settingSidebar.menuItem.team,
          icon: 'team',
        },
        {
          path: `/${locale}/user/settings/login-devices`,
          label: settingSidebar.menuItem.loginDevices,
          icon: 'active-login',
        },
        {
          path: `/${locale}/user/settings/organizations`,
          label: settingSidebar.menuItem.organizations,
          icon: 'organizations',
        },
      ],
    },
    {
      label: settingSidebar.menu.access,
      children: [
        {
          path: `/${locale}/user/settings/emails`,
          label: settingSidebar.menuItem.emails,
          icon: 'email',
        },
        {
          path: `/${locale}/user/settings/reset-password`,
          label: settingSidebar.menuItem.resetPassword,
          icon: 'reset-password',
        },
        {
          path: `/${locale}/user/settings/2-factor-auth`,
          label: settingSidebar.menuItem.twoFactorAuth,
          icon: '2-factor-auth',
        },
      ],
    },
    {
      label: settingSidebar.menu.financials,
      children: [
        {
          path: `/${locale}/user/settings/membership-plans`,
          label: settingSidebar.menuItem.membershipPlans,
          icon: 'memberships-plan',
        },
        {
          path: `/${locale}/user/settings/payment-methods`,
          label: settingSidebar.menuItem.paymentMethods,
          icon: 'payment-methods',
        },
        {
          path: `/${locale}/user/settings/invoices`,
          label: settingSidebar.menuItem.invoices,
          icon: 'invoices',
        },
        {
          path: `/${locale}/user/settings/statements`,
          label: settingSidebar.menuItem.statements,
          icon: 'statements',
        },
      ],
    },
    {
      label: settingSidebar.menu.preferences,
      children: [
        {
          path: `/${locale}/user/settings/advertising`,
          label: settingSidebar.menuItem.advertising,
          icon: 'advertising',
        },
        {
          path: `/${locale}/user/settings/notifications`,
          label: settingSidebar.menuItem.notifications,
          icon: 'notifications',
        },
      ],
    },
  ];
}
