'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { DepartmentsProvider } from '@/components/humanResources/departments/DepartmentsProvider';
import EmployeeForm from '@/components/humanResources/employees/EmployeeForm';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { Typography } from '@mui/material';

export default function NewEmployeePage() {
  const router = useRouter();
  const lang = useLanguage();

  const handleClose = () => {
    router.push(`/${lang}/hr/employees`);
  };

  return (
    <JumboContentLayout
      header={<Typography variant='h4'>New Employee</Typography>}
    >
      <DepartmentsProvider>
        <EmployeeForm setOpenDialog={handleClose} />
      </DepartmentsProvider>
    </JumboContentLayout>
  );
}
