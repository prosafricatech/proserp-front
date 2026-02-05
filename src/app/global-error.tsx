'use client';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { getAssetPath } from '@/utilities/helpers';
import { Div, Link } from '@jumbo/shared';
import { Typography } from '@mui/material';
import Image from 'next/image';

export default function GlobalError() {
  const lang = useLanguage();

  window.location.href = `${lang}/dashboard`;

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
      <Div sx={{ display: 'inline-flex', mb: 3 }}>
        <Image
          src={getAssetPath(
            `${ASSET_IMAGES}/apps/undraw_page_not_found.svg`,
            '380x206'
          )}
          height={206}
          alt='404'
          width={380}
        />
      </Div>
      <Typography
        align={'center'}
        component={'h2'}
        variant={'h1'}
        color={'text.secondary'}
        mb={3}
      >
        Oops, an error has occurred!
      </Typography>
      <Link href={`${lang}/dashboard`}>
        {/* <Button variant='contained'>Go Signin page</Button> */}
        Go to Dashboard
      </Link>
    </Div>
  );
}
