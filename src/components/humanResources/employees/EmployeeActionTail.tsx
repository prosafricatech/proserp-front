import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';

const EmployeeActionTail = () => {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <ButtonGroup
      variant='outlined'
      size='small'
      disableElevation
      sx={{ '& .MuiButton-root': { px: 1 } }}
    >
      <Tooltip title='Add Employee'>
        <IconButton onClick={() => router.push(`/${lang}/hr/employees/new`)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
    </ButtonGroup>
  );
};

export default EmployeeActionTail;
