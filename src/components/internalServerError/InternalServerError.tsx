'use client';
import { Div, Link } from '@jumbo/shared';
import { Button, Typography } from '@mui/material';
export const InternalServerError = () => {
  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: (theme) => theme.spacing(4),
      }}
    >
      <Typography
        variant={'h1'}
        fontWeight='500'
        sx={{
          fontSize: 150,
          textShadow: '1rem 0.6rem 1rem rgba(0, 0, 0, 0.35)',
          mb: 1,
        }}
      >
        500
      </Typography>
      <Typography
        component={'h2'}
        variant={'h1'}
        color={'text.secondary'}
        mb={4}
      >
        Sorry, server goes wrong{' '}
      </Typography>
      <Link href={'/'}>
        <Button variant='contained'>Go to home</Button>
      </Link>
    </Div>
  );
};
