import { getDictionary } from '@/app/[lang]/dictionaries';
import { currentYear } from '@/utilities/constants/data';
import { Div } from '@jumbo/shared';
import { Typography } from '@mui/material';

const Footer = async ({ lang }: { lang: string }) => {
  const { branding } = await getDictionary(lang);

  return (
    <Div
      sx={{
        py: 1.5,
        px: { lg: 6, xs: 3 },
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Div
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
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
          textAlign="center"
          fontStyle="italic"
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          {`ProsAfrica © ${currentYear}`}
        </Typography>
      </Div>
    </Div>
  );
};

export { Footer };