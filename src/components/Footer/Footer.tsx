import { getDictionary } from '@/app/[lang]/dictionaries';
import { currentYear } from '@/utilities/constants/data';
import { Div } from '@jumbo/shared';
import { Typography } from '@mui/material';

const Footer = async ({ lang }: { lang: string }) => {
  const { branding } = await getDictionary(lang);

  return (
    <Div
      sx={{
        py: 2,
        px: { lg: 6, xs: 3 },
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Div
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: { xs: 'center', sm: 'left' },
          gap: 1,
        }}
      >
        <Typography
          variant="body1"
          color="text.primary"
          fontStyle="italic"
          sx={{
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {branding.tagline}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            whiteSpace: 'nowrap',
            fontStyle: 'italic',
          }}
        >
          {`ProsAfrica © ${currentYear}`}
        </Typography>
      </Div>
    </Div>
  );
};

export { Footer };