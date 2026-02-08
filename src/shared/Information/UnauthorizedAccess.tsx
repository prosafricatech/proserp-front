import { useLanguage } from '@/app/[lang]/contexts/LanguageContext'
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { BlockOutlined } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'
import Link from 'next/link'
import React from 'react'

function UnauthorizedAccess() {
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
        <BlockOutlined color='error' sx={{ fontSize:'200px' }}/>
        <Typography variant='h3'>You do not have permission to access the requested page!</Typography>
        <Link href={`/${lang}/dashboard`}>
          <Button variant={'contained'}>Go to Dashboard</Button>
        </Link>
      </Box>
    </JumboCardQuick>
  )
}

export default UnauthorizedAccess