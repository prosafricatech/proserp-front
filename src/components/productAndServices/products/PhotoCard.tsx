import { Avatar } from '@mui/material';
import { ProductPhoto } from './ProductType';

interface PhotoThumbnailProps {
  photo?: ProductPhoto | undefined | null;
  thumbnail?: string | null;
  itemName: string | undefined;
}

export default function PhotoThumbnail({
  photo,
  thumbnail,
  itemName,
}: PhotoThumbnailProps) {
  return (
    <Avatar
      src={photo?.full_path || thumbnail || undefined}
      variant='rounded'
      sx={{
        width: 36,
        height: 36,
        mr: 1.5,
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {itemName?.charAt(0)?.toUpperCase()}
    </Avatar>
  );
}
