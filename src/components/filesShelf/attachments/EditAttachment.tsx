import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import attachmentsServices from './attachmentsServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Attachment } from './AttachmentsType';

interface EditAttachmentProps {
  attachment: Attachment;
  toggleOpen: () => void;
}

interface FormValues {
  name: string;
}

const EditAttachment: React.FC<EditAttachmentProps> = ({ attachment, toggleOpen }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: attachment.name,
    },
  });

  const updateAttachment = useMutation({
    mutationFn: attachmentsServices.updateAttachment,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toggleOpen();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update', {
        variant: 'error',
      });
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    updateAttachment.mutate({ id: attachment.id, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogContent>
        <TextField
          fullWidth
          label="Name"
          size="small"
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={toggleOpen}>Cancel</Button>
        <LoadingButton
          loading={updateAttachment.isPending}
          type="submit"
          variant="contained"
          color="primary"
        >
          Save
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default EditAttachment;
