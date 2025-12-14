'use client'
import { DeleteOutlined, DownloadOutlined, EditOutlined, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Dialog, DialogContent, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { lazy, useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import priceListServices from './priceLists-services';
import PriceListPDF from './PriceListPDF';
import PDFContent from '../../pdf/PDFContent';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { PriceList } from './PriceListType';
import { MenuItemProps } from '@jumbo/types';

const PriceListForm = lazy(() => import('./form/PriceListForm'));

interface EditFormProps {
  priceList: PriceList;
  toggleOpen: (open: boolean) => void;
}

interface DocumentDialogProps {
  priceList: PriceList;
  authObject: ReturnType<typeof useJumboAuth>;
}

interface PriceListsItemActionProps {
  priceList: PriceList;
}

const EditForm: React.FC<EditFormProps> = ({ priceList, toggleOpen }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['priceList', { id: priceList.id }],
    queryFn: () => priceListServices.show(priceList.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return <PriceListForm priceList={data} toggleOpen={toggleOpen} />;
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({ priceList, authObject }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['priceList', { id: priceList.id }],
    queryFn: () => priceListServices.show(priceList.id),
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <DialogContent>
      {authObject.checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_READ) ? (
        <PDFContent
          fileName={`PriceList From ${readableDate(priceList.effective_date)}`}
          document={<PriceListPDF authObject={authObject as any} priceList={data} />}
        />
      ) : (
        <UnauthorizedAccess />
      )}
    </DialogContent>
  );
};

const PriceListsItemAction: React.FC<PriceListsItemActionProps> = ({ priceList }) => {
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState<boolean>(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const authObject = useJumboAuth();
  const { checkOrganizationPermission } = authObject;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deletePriceList } = useMutation({
    mutationFn: priceListServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    {
      icon: belowLargeScreen ? <DownloadOutlined /> : <VisibilityOutlined />,
      title: belowLargeScreen ? 'Download' : 'View',
      action: 'open'
    },
    checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_EDIT) ? {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit'
    } : null,
    checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_DELETE) ? {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete'
    } : null
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Price',
          content: 'Are you sure you want to delete this Price?',
          onYes: () => {
            hideDialog();
            deletePriceList(priceList.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      default:
        break;
    }
  };

  const handleCloseDialog = () => {
    setOpenDocumentDialog(false);
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={handleCloseDialog}
        maxWidth={openDocumentDialog ? "md" : "lg"}
      >
        {openEditDialog && (checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_EDIT) ? (
          <EditForm priceList={priceList} toggleOpen={setOpenEditDialog} />
        ) : (
          <UnauthorizedAccess />
        ))}

        {openDocumentDialog && <DocumentDialog priceList={priceList} authObject={authObject} />}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined fontSize="small" />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default PriceListsItemAction;