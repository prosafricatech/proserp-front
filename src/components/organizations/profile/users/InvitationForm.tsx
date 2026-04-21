'use client';

import * as yup from "yup";
import React, { useState } from 'react';
import { Grid, LinearProgress, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { InvitationQueue } from './InvitationQueue';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "@/lib/services/config";
import { Organization } from "@/types/auth-types";
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import organizationServices from "../../organizationServices";

interface FormValues {
  email: string;
}

interface InvitationFormProps {
  organization: Organization;
}

interface Invitee {
  id: string | number;
  email: string;
  name: string;
  roles?: Array<{ id: string | number; name: string }>;
  selectedRoles: (string | number)[];
}

export const InvitationForm: React.FC<InvitationFormProps> = ({ organization }) => {
  const dictionary = useDictionary();
  const formDict = dictionary.organizations.profile.usersTab.actionTail.inviteDialog.form;

  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const validationSchema = yup.object({
    email: yup.string()
      .required(formDict.validation.required)
      .matches(
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
        { message: formDict.validation.invalid },
      ),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: { email: '' },
  });

  const { data: organizationRoles, isPending: isRolesLoading } = useQuery({
    queryKey: [`organizationRoles_${organization?.id}`],
    queryFn: async () => {
      const response = await axios.get(`/api/organizations/${organization.id}/roles`);
      return response.data;
    },
    enabled: !!organization?.id,
  });

  const { mutate: addInvitee, isPending: isAddingInvitee } = useMutation({
    mutationFn: async ({ email }: FormValues) => {
      const response = await organizationServices.addInvitee(organization.id, email);
      return response.user;
    },
    onSuccess: (user) => {
      const newInvitee: Invitee = {
        ...user,
        id: user.id || Date.now(),
        roles: organizationRoles || [],
        selectedRoles: [],
      };

      if (invitees.some(invitee => invitee.email === newInvitee.email)) {
        enqueueSnackbar(formDict.messages.alreadyQueued, { variant: 'error' });
      } else {
        setInvitees(prev => [...prev, newInvitee]);
        enqueueSnackbar(formDict.messages.success, { variant: 'success' });
        reset();
      }
    },
    onError: (error: any, variables) => {
      if (error?.response?.status === 404) {
        const fallbackUser: Invitee = {
          id: Date.now(),
          name: 'Not Registered',
          email: variables.email,
          selectedRoles: [],
        };

        if (invitees.some(invitee => invitee.email === fallbackUser.email)) {
          enqueueSnackbar(formDict.messages.alreadyQueued, { variant: 'error' });
          reset();
        } else {
          enqueueSnackbar(formDict.messages.notFound, { variant: 'info' });
          setInvitees(prev => [...prev, fallbackUser]);
          reset();
        }
      } else if (error?.response?.status === 400) {
        enqueueSnackbar(formDict.messages.alreadyMember, { variant: 'error' });
        reset();
      } else {
        enqueueSnackbar(
          formDict.messages.error, 
          { variant: 'error' }
        );
        reset();
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    addInvitee(data);
  };

  if (isRolesLoading) {
    return <LinearProgress />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container columnSpacing={1} paddingRight={1} alignItems="center">
        <Grid size={10}>
          <TextField
            label={formDict.emailLabel}
            placeholder={formDict.emailPlaceholder}
            fullWidth
            size="small"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
        </Grid>
        <Grid size={2}>
          <LoadingButton 
            size="small"
            variant="contained"
            type="submit"
            loading={isAddingInvitee}
            fullWidth
          >
            {formDict.addButton}
          </LoadingButton>
        </Grid>
      </Grid>

      <InvitationQueue 
        invitees={invitees}
        setInvitees={setInvitees}
        organization={organization}
      />
    </form>
  );
};