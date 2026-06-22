import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Divider, Tooltip } from '@mui/material';

export const FileExportGrid = ({
  exportExcel,
  exportPdf,
  handlExcelExport,
  handlePdf,
  exportData,
  exportingExcel,
}: {
  exportExcel?: boolean;
  exportPdf?: boolean;
  handlExcelExport?: (value: any) => Promise<void> | undefined;
  handlePdf?: () => void | undefined;
  exportData?: any;
  exportingExcel?: boolean;
}) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: 0,
        color: 'text.secondary',
        '& svg': {
          m: 1,
        },
      }}
    >
      {exportExcel && (
        <Tooltip title='Export Excel'>
          <LoadingButton
            onClick={() => {
              handlExcelExport && handlExcelExport(exportData);
            }}
            loading={exportingExcel}
            sx={{
              width: 'fit-content',
              fontSize: 15,
            }}
          >
            <FontAwesomeIcon color='green' size='lg' icon={faFileExcel} />
          </LoadingButton>
        </Tooltip>
      )}
      {exportExcel && exportPdf && (
        <Divider orientation='vertical' variant='middle' flexItem />
      )}

      {exportPdf && (
        <Tooltip title='Toggle PDF Preview'>
          <Button
            onClick={() => {
              handlePdf && handlePdf();
            }}
            sx={{
              width: 'fit-content',
              fontSize: 15,
            }}
          >
            <FontAwesomeIcon color='red' size='lg' icon={faFilePdf} />
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};
