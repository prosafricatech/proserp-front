import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import userManagementServices from './user-management-services';
import { AxiosError } from 'axios';
import { User } from './UserManagementType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

  interface VerifyUserFormValues {
    email: string;
  }

  interface VerifyUserResponse {
    message: string;
  }

  interface ApiErrorResponse {
    message?: string;
  }

  type VerifyUserFormDialogProps = {
    open: boolean;
    setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
    user?: User;
  };

  const VerifyUserFormDialog: React.FC<VerifyUserFormDialogProps> = ({
    open,
    setOpenDialog,
  }) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

console.log(dictionary.userManagement.form)
  const validationSchema = yup.object({
     email: yup.string().required(dictionary.userManagement.form.errors.validation.email.required).email(dictionary.userManagement.form.errors.validation.valid),
   });

    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
      setValue,
    } = useForm<VerifyUserFormValues>({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        email: '',
      },
    });

  const { mutate: verifyUser, isPending: isVerifying } = useMutation<
    VerifyUserResponse,
    AxiosError<ApiErrorResponse>,
    VerifyUserFormValues
  >({
    mutationFn: (data) => userManagementServices.verify(data),
    onSuccess: (data) => {
      enqueueSnackbar(dictionary.userManagement.form.errors.messages.verifySuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['userManagement'] });
      handleClose();
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || error.message;
      enqueueSnackbar(dictionary.userManagement.form.errors.messages.response, { variant: 'error' });
    },
  });

  const handleClose = () => {
    reset();
    setOpenDialog(false);
  };

  const onSubmit = (data: VerifyUserFormValues) => {
    verifyUser(data);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="xs"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ textAlign: 'center' }}>
          {dictionary.userManagement.form.title}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label={dictionary.userManagement.form.labels.email}
                size="small"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                autoFocus
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} 
            size="small" 
            disabled={isVerifying}
          >
            {dictionary.userManagement.form.buttons.cancel}
          </Button>
          <LoadingButton 
            type="submit" 
            variant="contained" 
            size="small" 
            loading={isVerifying}
          >
            {dictionary.userManagement.form.buttons.verify}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VerifyUserFormDialog;