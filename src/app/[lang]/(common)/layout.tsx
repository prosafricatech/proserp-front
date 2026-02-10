import { defaultLayoutConfig } from '@/config/layouts';
import { getMenus } from '@/services';
import { JumboLayout } from '@jumbo/components';
import { getDictionary } from '@/app/[lang]/dictionaries';
import React from 'react';
import JumboLayoutProvider from '@jumbo/components/JumboLayout/components/JumboLayoutProvider/JumboLayoutProvider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Sidebar } from '@/components/sidebar';

interface CommonLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function CommonLayout({ children, params }: CommonLayoutProps) {
  const { lang } = await params;
  const menus = await getMenus(lang);
  const dictionary = await getDictionary(lang);

  return (
    <JumboLayoutProvider layoutConfig={defaultLayoutConfig}>
      <JumboLayout
        header={<Header dictionary={dictionary} />}
        footer={<Footer lang={lang} />}
        sidebar={<Sidebar menus={menus} />}
      >
        {children}
      </JumboLayout>
    </JumboLayoutProvider>
  );
}