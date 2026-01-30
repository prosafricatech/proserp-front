'use client';

import { Star, StarBorder } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState, useContext } from 'react';
import { OrganizationListContext } from './OrganizationsList';
import axios from '@/lib/services/config';
import { Organization } from '@/types/auth-types';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

interface AutoLoadButtonProps {
  organization: Organization;
}

const defaultTranslations = {
  'en-US': {
    button: {
      tooltip: {
        activate: 'Activate auto-load',
        deactivate: 'Deactivate auto-load'
      }
    },
    dialog: {
      title: {
        activate: 'Activate {organizationName} auto-load?',
        deactivate: 'Deactivate {organizationName} auto-load?'
      },
      description: {
        activate: 'Confirming this will set {organizationName} to load automatically when you login',
        deactivate: 'Confirming this will prevent {organizationName} from being loaded automatically when you login'
      },
      buttons: {
        cancel: 'Cancel',
        confirm: 'Confirm'
      }
    },
    messages: {
      success: 'Auto-load setting updated successfully',
      error: 'An error occurred while updating auto-load setting'
    }
  },
  'sw-TZ': {
    button: {
      tooltip: {
        activate: 'Amilisha upakiaji otomatiki',
        deactivate: 'Zima upakiaji otomatiki'
      }
    },
    dialog: {
      title: {
        activate: 'Amilisha upakiaji otomatiki wa {organizationName}?',
        deactivate: 'Zima upakiaji otomatiki wa {organizationName}?'
      },
      description: {
        activate: 'Kuthibitisha hii itaweka {organizationName} kupakia otomatiki unapoingia',
        deactivate: 'Kuthibitisha hii itazuia {organizationName} kupakia otomatiki unapoingia'
      },
      buttons: {
        cancel: 'Ghairi',
        confirm: 'Thibitisha'
      }
    },
    messages: {
      success: 'Mpangilio wa upakiaji otomatiki umehakikiwa',
      error: 'Hitilafu imetokea wakati wa kusasisha mpangilio wa upakiaji otomatiki'
    }
  }
};

type SupportedLang = keyof typeof defaultTranslations;

const AutoLoadButton: React.FC<AutoLoadButtonProps> = ({ organization }) => {
  const dictionary = useDictionary();
  const lang = useLanguage();

  const langKey: SupportedLang = (['en-US', 'sw-TZ'].includes(lang) ? lang : 'en-US') as SupportedLang;

  const autoLoadDict = dictionary?.organizations?.list?.autoLoad ?? defaultTranslations[langKey];

  const autoLoad = organization?.autoload ?? false;
  const { refetchOrganizations } = useContext(OrganizationListContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const toggleAutoLoad = async (data: { autoload: boolean }) => {
    setLoading(true);
    try {
      await axios.get('/sanctum/csrf-cookie');
      const res = await axios.put(`/api/organizations/${organization.id}/autoload`, data);
      setOpen(false);
      if (res.status === 200) {
        refetchOrganizations();
        enqueueSnackbar(autoLoadDict.messages.success, { variant: 'success' });
      } else {
        enqueueSnackbar(res.data?.message || autoLoadDict.messages.error, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(autoLoadDict.messages.error, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle =
    (autoLoadDict.dialog?.title?.[autoLoad ? 'deactivate' : 'activate'] ??
      defaultTranslations['en-US'].dialog.title[autoLoad ? 'deactivate' : 'activate']
    ).replace('{organizationName}', organization.name);

  const dialogDescription =
    (autoLoadDict.dialog?.description?.[autoLoad ? 'deactivate' : 'activate'] ??
      defaultTranslations['en-US'].dialog.description[autoLoad ? 'deactivate' : 'activate']
    ).replace('{organizationName}', organization.name);

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{dialogDescription}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            {autoLoadDict.dialog?.buttons?.cancel || defaultTranslations['en-US'].dialog.buttons.cancel}
          </Button>
          <LoadingButton loading={loading} onClick={() => toggleAutoLoad({ autoload: !autoLoad })} autoFocus>
            {autoLoadDict.dialog?.buttons?.confirm || defaultTranslations['en-US'].dialog.buttons.confirm}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Tooltip
        title={
          autoLoadDict.button?.tooltip?.[autoLoad ? 'deactivate' : 'activate'] ||
          defaultTranslations['en-US'].button.tooltip[autoLoad ? 'deactivate' : 'activate']
        }
        disableInteractive
      >
        <IconButton onClick={() => setOpen(true)}>
          {autoLoad ? <Star fontSize="small" color="warning" /> : <StarBorder fontSize="small" />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export default AutoLoadButton;
