import { Div } from '@jumbo/shared';
import { Typography } from '@mui/material';

type PageHeaderPorps = {
  title: string;
  subheader: string;
};
const PageHeader = ({ title, subheader }: PageHeaderPorps) => {
  return (
    <Div
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 4,
      }}
    >
      <Typography variant={'h2'}>{title}</Typography>
      <Typography variant={'body1'} mb={2} color={'text.secondary'}>
        {subheader}
      </Typography>
    </Div>
  );
};

export { PageHeader };
