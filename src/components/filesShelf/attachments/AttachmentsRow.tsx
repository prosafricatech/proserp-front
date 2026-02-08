import { Divider, Grid, Tooltip, Typography, Link } from '@mui/material';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilePdf,
  faFileImage,
  faFileVideo,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileAlt,
  faFileAudio
} from '@fortawesome/free-solid-svg-icons';
import AttachmentItemAction from './AttachmentItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Attachment } from './AttachmentsType';

// Define colors for different file types
const iconColors: Record<string, string> = {
  pdf: '#D32F2F',
  jpeg: '#1976D2',
  jpg: '#1976D2',
  png: '#1976D2',
  gif: '#1976D2',
  bmp: '#1976D2',
  svg: '#1976D2',
  webp: '#1976D2',
  mp4: '#F57C00',
  mov: '#F57C00',
  avi: '#F57C00',
  mkv: '#F57C00',
  wmv: '#F57C00',
  mp3: '#7B1FA2',
  doc: '#388E3C',
  docx: '#388E3C',
  xls: '#FBC02D',
  xlsx: '#FBC02D',
  ppt: '#C2185B',
  pptx: '#C2185B',
  default: '#757575',
};

// Map file types to FontAwesome icons
const fileTypeIcon: Record<string, any> = {
  pdf: faFilePdf,
  jpeg: faFileImage,
  jpg: faFileImage,
  png: faFileImage,
  gif: faFileImage,
  bmp: faFileImage,
  svg: faFileImage,
  webp: faFileImage,
  mp4: faFileVideo,
  mov: faFileVideo,
  avi: faFileVideo,
  mkv: faFileVideo,
  wmv: faFileVideo,
  mp3: faFileAudio,
  doc: faFileWord,
  docx: faFileWord,
  xls: faFileExcel,
  xlsx: faFileExcel,
  ppt: faFilePowerpoint,
  pptx: faFilePowerpoint,
  default: faFileAlt,
};

type AttachmentsRowProps = {
  attachment: Attachment;
  index: number;
};

const AttachmentsRow: React.FC<AttachmentsRowProps> = ({ attachment, index }) => {
  const fileType = attachment.type?.split('/').pop()?.toLowerCase() || 'default';
  const icon = fileTypeIcon[fileType] || fileTypeIcon.default;
  const iconColor = iconColors[fileType] || iconColors.default;

  return (
    <>
      <Divider />
      <Grid
        container
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Grid size={{xs: 1, md: 0.5}}>
          {index + 1}.
        </Grid>
        <Grid size={{xs: 11, md: 3}}>
          <Tooltip title="Attachment">
            <Typography>{attachment.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Tooltip title="Created At">
            <Typography>{readableDate(attachment.created_at, true)}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Tooltip title="Updated At">
            <Typography>{readableDate(attachment.updated_at, true)}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 1}}>
          <Tooltip title={`Open ${attachment.type} file`}>
            <Link href={attachment.full_path} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon size="lg" icon={icon} color={iconColor} />
            </Link>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 1.5}} textAlign="end">
          <AttachmentItemAction attachment={attachment} />
        </Grid>
      </Grid>
    </>
  );
};

export default AttachmentsRow;
