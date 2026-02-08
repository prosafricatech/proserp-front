import React, { useState } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Input,
  InputLabel,
  FormHelperText,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import AttachmentsRow from './AttachmentsRow';
import attachmentsServices from './attachmentsServices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Attachment } from './AttachmentsType';

type AttachmentFormProps = {
  hideFeatures?: boolean;
  setAttachDialog?: (open: boolean) => void;
  attachmentable_id: number;
  attachmentable_type: string;
  attachment_name?: string;
  attachment_sourceNo?: string;
};

const validationSchema = yup.object({
  name: yup
    .string()
    .required('File Name is required'),

  file: yup
    .mixed()
    .required('File is required')
  .test('fileType', 'Unsupported File Format', (value: unknown) => {
    const fileList = value as FileList;
    if (!fileList || fileList.length === 0) return false;
    const file = fileList[0];
    const allowedFormats = [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-ms-wmv',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'audio/mpeg'
    ];
    return allowedFormats.includes(file?.type);
  })
});

function AttachmentForm({
  hideFeatures,
  setAttachDialog,
  attachmentable_id,
  attachmentable_type,
  attachment_name = '',
  attachment_sourceNo = ''
}: AttachmentFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<{ name: string, file: FileList}>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: '',
    }
  });

  const addAttachment = useMutation({
      mutationFn: attachmentsServices.addAttachment,
      onSuccess: (data) => {
        enqueueSnackbar(data?.message || 'Attachment uploaded', { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['attachments'] });
        reset({ name: '', file: undefined as unknown as FileList });
      },
      onError: (error: any) => {
        enqueueSnackbar(error?.response?.data?.message || 'Upload failed', { variant: 'error' });
      }
  });

  const fetchAttachments = async () => {
    setIsFetching(true);
    const response = await attachmentsServices.attachments({
      attachmentable_id,
      attachmentable_type
    });
    setIsFetching(false);
    return response;
  };

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', Number(attachmentable_id), attachmentable_type],
    queryFn: fetchAttachments
  });

  const onSubmit = (data:{ name: string, file: FileList}) => {
    const formData = {
      ...data,
      attachmentable_id,
      attachmentable_type
    };
    addAttachment.mutate(formData);
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      {!hideFeatures && (
        <DialogTitle sx={{ textAlign: 'center' }}>
          {`Attachments For ${attachment_sourceNo}`}
        </DialogTitle>
      )}

      <DialogContent>
        <Grid container spacing={2} pt={2}>
          <Grid size={{xs: 12, md: 6}}>
            <TextField
              fullWidth
              label="Name"
              size='small'
              error={!!errors?.name}
              helperText={errors?.name?.message}
              {...register('name')}
            />
          </Grid>

          <Grid size={{xs: 12, md: 6}}>
            <Input
              type="file"
              id="file"
              error={!!errors?.file}
              inputProps={{ ...register("file") }}
            />
            {!errors?.file ? (
              <InputLabel htmlFor="file-input">File Attachment</InputLabel>
            ) : (
              <FormHelperText error>{errors?.file?.message}</FormHelperText>
            )}
          </Grid>

          <Grid size={12} textAlign="right">
            <LoadingButton
              size="small"
              variant="contained"
              color="success"
              type="submit"
              loading={addAttachment.isPending}
            >
              Upload
            </LoadingButton>
          </Grid>

          <Grid size={12}>
            {isFetching ? (
              <LinearProgress />
            ) : attachments?.length > 0 ? (
              attachments.map((attachment: Attachment, index: number) => (
                <AttachmentsRow key={index} attachment={attachment} index={index} />
              ))
            ) : (
              <Alert variant="outlined" severity="info">
                {`No attachments for this ${attachment_name}`}
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      {!hideFeatures && (
        <DialogActions>
          <Grid container justifyContent="flex-end">
            <Button variant="outlined" size="small" onClick={() => setAttachDialog?.(false)}>
              Cancel
            </Button>
          </Grid>
        </DialogActions>
      )}
    </form>
  );
}

export default AttachmentForm;
