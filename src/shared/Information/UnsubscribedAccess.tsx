import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { CardMembershipOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';

interface UnsubscribedAccessProps {
  modules?: string | null;
}

const UnsubscribedAccess: React.FC<UnsubscribedAccessProps> = ({ modules = null }) => {
  const lang = useLanguage();
  
  return (
    <JumboCardQuick
      sx={{ 
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      <Box textAlign={'center'}>
        <CardMembershipOutlined color='error' sx={{ fontSize: '200px' }} />
        <Typography variant='h3'>
          {`Your organization has not subscribed to ${modules ? modules : 'this module'}`}
        </Typography>
        <Link href={`/${lang}/dashboard`} passHref>
          <Button variant={'contained'} component="a">
            Go to Dashboard
          </Button>
        </Link>
      </Box>
    </JumboCardQuick>
  );
};

export default UnsubscribedAccess;