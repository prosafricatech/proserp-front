import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EditAttachment from './EditAttachment';
import attachmentsServices from './attachmentsServices';
import { Attachment } from './AttachmentsType';
interface Props {
  attachment: Attachment;
}

const AttachmentItemAction: React.FC<Props> = ({ attachment }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const deleteAttachment = useMutation({
    mutationFn: attachmentsServices.deleteAttachment,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete attachment', {
        variant: 'error',
      });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Attachment will be deleted',
      onYes: () => {
        hideDialog();
        deleteAttachment.mutate(attachment.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleEdit = () => {
    showDialog({
      title: `Edit ${attachment.name}`,
      content: <EditAttachment attachment={attachment} toggleOpen={hideDialog} />,
      onClose: () => hideDialog(),
      maxWidth: 'sm',
    });
  };

  return (
    <>
      <Tooltip title={`Edit ${attachment.name}`}>
        <IconButton size="small" onClick={handleEdit}>
          <EditOutlined />
        </IconButton>
      </Tooltip>

      <Tooltip title={`Delete ${attachment.name}`}>
        <IconButton size="small" onClick={handleDelete}>
          <DeleteOutlined color="error" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default AttachmentItemAction;
