import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { Dialog, DialogActions, DialogContent, Zoom } from '@mui/material';
import CardHeader from '@mui/material/CardHeader';

const DialogBase = ({
  content,
  actions,
  title,
  subheader,
  contentProps,
  headerActions,
  onClose,
  TransitionComponent = Zoom,
  disableDefaultClose = false,
  ...restProps
}: any) => {
  const { open, hideDialog } = useJumboDialog();

  const handleClose = () => {
    hideDialog();
  };

  return (
    <Dialog
      open={open}
      {...restProps}
      onClose={handleClose}
      TransitionComponent={TransitionComponent}
    >
      {title && (
        <CardHeader
          title={title}
          subheader={subheader}
          sx={{ pb: 0 }}
          action={headerActions}
        />
      )}
      <DialogContent {...contentProps}>{content}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};

export default DialogBase;
