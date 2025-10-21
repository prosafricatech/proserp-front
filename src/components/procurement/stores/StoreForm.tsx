import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Button, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import storeServices from './store-services';
import UsersSelector from '../../sharedComponents/UsersSelector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Store, StoreOption, StoreFormData } from './storeTypes';
import type {User} from '@/components/prosControl/userManagement/UserManagementType';

interface StoreFormProps {
  store?: Store | null;
  parentOptions?: StoreOption[] | null;
  setOpenDialog: (open: boolean) => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store = null, parentOptions = null, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();

  const addStore = useMutation({
    mutationFn: storeServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(dictionary.stores.form.messages.createSuccess, { variant: 'success' });
      setOpenDialog(false);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['showStore'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.stores.form.errors.messages.createResponse, { variant: 'error' });
    },
  });

  const updateStore = useMutation({
    mutationFn: storeServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(dictionary.stores.form.messages.updateSuccess, { variant: 'success' });
      setOpenDialog(false);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['showStore'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.stores.form.errors.messages.updateResponse, { variant: 'error' });
    },
  });

  const {
    error: addError,
    isPending: isAdding,
  } = addStore;

  const {
    error: updateError,
    isPending: isUpdating,
  } = updateStore;

  const saveMutation = React.useMemo(() => {
    return store?.id ? updateStore.mutate : addStore.mutate;
  }, [store, updateStore, addStore]);

  const validationObject: Record<string, any> = {
    name: yup.string().required(dictionary.stores.form.errors.validation.storeName.required),
  };

  if (Array.isArray(parentOptions)) {
    validationObject.parent_id = yup
      .number()
      .required('Parent Store is required')
      .positive('Parent Store is required');
  }

  const validationSchema = yup.object(validationObject);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: {
      name: store?.id ? store.name : '',
      alias: store?.id ? store.alias : '',
      description: store?.id ? store.description : '',
      user_ids: store?.users ? store.users.map(user => user.id) : [],
      parent_id: store?.parent_id && Array.isArray(parentOptions) ? store.parent_id : null,
    },
  });

  useEffect(() => {
    if (store?.id) {
      setValue('id', store.id);
    }
  }, [store, setValue]);

  const onSubmit: SubmitHandler<StoreFormData> = (data) => {
    saveMutation(data);
  };

  const getValidationMessage = (field: string) =>
    errors[field as keyof StoreFormData]?.message ||
    addError?.response?.data?.validation_errors?.[field] ||
    updateError?.response?.data?.validation_errors?.[field];

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign="center">
          {!store ? (parentOptions ? 'Add Sub-store' : dictionary.stores.form.title ) : dictionary.stores.form.pageTitle.replace('{storeName}' ,store.name)}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Grid container columnSpacing={1}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.stores.form.labels.storeName}
                  size="small"
                  fullWidth
                  error={!!getValidationMessage('name')}
                  helperText={getValidationMessage('name')}
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.stores.form.labels.storeAlias}
                  size="small"
                  fullWidth
                  error={!!getValidationMessage('alias')}
                  helperText={getValidationMessage('alias')}
                  {...register('alias')}
                />
              </Div>
            </Grid>
            {Array.isArray(parentOptions) && (
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    options={parentOptions}
                    getOptionLabel={(option: StoreOption) => option.name}
                    isOptionEqualToValue={(option: StoreOption, value: StoreOption) => option.id === value.id}
                    defaultValue={parentOptions.find((parent: StoreOption) => parent.id === store?.parent_id) || null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        label="Under"
                        error={!!errors?.parent_id}
                        helperText={errors?.parent_id?.message}
                      />
                    )}
                    onChange={(event, newValue: StoreOption | null) => {
                      if (store && store?.id === newValue?.id) {
                        setValue('parent_id', 0);
                        setError('parent_id', { message: 'Cannot be a parent of its own' });
                      } else {
                        setValue('parent_id', newValue ? newValue.id : 0, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </Div>
              </Grid>
            )}
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <UsersSelector
                  label={dictionary.stores.form.labels.storeUsers}
                  multiple={true}
                  defaultValue={store?.users}
                  frontError={errors && errors.user_ids}
                  onChange={(newValue) => {
                    setValue(
                      'user_ids',
                      newValue ? newValue.map((user:User) => user.id) : [],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.stores.form.labels.description}
                  size="small"
                  multiline={true}
                  minRows={2}
                  fullWidth
                  {...register('description')}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <DialogActions>
                <Button size="small" onClick={() => setOpenDialog(false)}>
                 {dictionary.stores.form.buttons.cancel}
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="small"
                  sx={{ display: 'flex' }}
                  loading={isAdding || isUpdating}
                >
                 {dictionary.stores.form.buttons.submit}
                </LoadingButton>
              </DialogActions>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </>
  );
};

export default StoreForm;