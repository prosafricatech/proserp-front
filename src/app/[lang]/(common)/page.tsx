import { Box, Button, SxProps, Theme } from '@mui/material';
const sxProps: SxProps<Theme> = {
  width: 500,
  bgcolor: 'red',
};
export default function Home() {
  return (
    <main>
      <Box sx={{ ...sxProps }}>Hi</Box>
      <Button variant='contained'>Welcome back jumbo!</Button>
    </main>
  );
}
