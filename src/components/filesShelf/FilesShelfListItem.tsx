import {
  Divider,
  Grid,
  Tooltip,
  Typography,
  Link,
  ListItemText,
} from '@mui/material';
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
  faFileAudio,
} from '@fortawesome/free-solid-svg-icons';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Attachment } from './attachments/AttachmentsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

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

interface Props {
  attachment: Attachment;
}

const FilesShelfListItem: React.FC<Props> = ({ attachment }) => {
  const fileType = attachment.file_type?.toLowerCase();
  const icon = fileTypeIcon[fileType] || fileTypeIcon.default;
  const iconColor = iconColors[fileType] || iconColors.default;
  const dictionary = useDictionary();

  return (
    <>
      <Divider />
      <Grid
        container
        columnSpacing={2}
        alignItems={'center'}
        sx={{
          cursor: 'pointer',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          paddingTop: 2,
          paddingLeft: 3,
          paddingRight: 2,
        }}
      >
        <Grid size={{xs: 3, md: 0.5}}>
          <Tooltip title={`Open ${attachment.attachmentable_type} file`}>
            <Link
              href={attachment.full_path}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon size="lg" icon={icon} color={iconColor} />
            </Link>
          </Tooltip>
        </Grid>

        <Grid size={{xs: 9, md: 4}}>
          <Tooltip title={attachment.name}>
            <Link
              href={attachment.full_path}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Typography noWrap>{attachment.name}</Typography>
            </Link>
          </Tooltip>
        </Grid>

        <Grid size={{xs: 12, md: 2.5}}>
          <ListItemText
            primary={
              <Tooltip title={dictionary.filesShelf.list.labels.relatableType}>
                <Typography variant="body2" noWrap>
                  {attachment.attachmentable_type}
                </Typography>
              </Tooltip>
            }
            secondary={
              <Tooltip title={dictionary.filesShelf.list.labels.relatableNo}>
                <Typography variant="caption" noWrap>
                  {attachment.attachmentableNo}
                </Typography>
              </Tooltip>
            }
          />
        </Grid>

        <Grid size={{xs: 6, md: 2.5}}>
          <ListItemText
            primary={
              <Tooltip title={dictionary.filesShelf.list.labels.created}>
                <Typography variant="body2" noWrap>
                  {readableDate(attachment.created_at, true)}
                </Typography>
              </Tooltip>
            }
          />
        </Grid>

        <Grid size={{xs: 6, md: 2.5}}>
          <ListItemText
            primary={
              <Tooltip title={dictionary.filesShelf.list.labels.modified}>
                <Typography variant="body2" noWrap>
                  {readableDate(attachment.updated_at, true)}
                </Typography>
              </Tooltip>
            }
          />
        </Grid>
      </Grid>
    </>
  );
};

export default FilesShelfListItem;
