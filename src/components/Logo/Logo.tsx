import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Div } from '@jumbo/shared';
import { SxProps, Theme } from '@mui/material';
import Link from '@mui/material/Link';
import Image from 'next/image';

type LogoProps = {
  mini?: boolean;
  mode: 'light' | 'semi-dark' | 'dark';
  sx?: SxProps<Theme>;
};
const Logo = ({ mini = false, mode = 'light', sx }: LogoProps) => {
  const lang = useLanguage();

  return (
    <Div sx={{ display: 'inline-flex', ...sx }}>
      <Link href={`/${lang}/dashboard`}>
        {!mini ? (
          <Image
            src={
              mode === 'light'
                ? `/assets/images/logos/logo.png`
                : `/assets/images/logos/proserp-white.png`
            }
            alt='Jumbo React'
            width={110}
            height={35}
            style={{ verticalAlign: 'middle' }}
          />
        ) : (
          <Image
            src={
              mode === 'light'
                ? `/assets/images/logo-short.png`
                : `/assets/images/logo-short-white.png`
            }
            alt='Jumbo React'
            width={35}
            height={35}
            style={{ verticalAlign: 'middle' }}
          />
        )}
      </Link>
    </Div>
  );
};

export { Logo };
