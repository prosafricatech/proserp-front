'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { lazy, useState } from 'react';
import PDFContent from '../../pdf/PDFContent';
import PriceListPDF from './PriceListPDF';
import priceListServices from './priceLists-services';
import { PriceList } from './PriceListType';

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
  fuelPriceLists?: boolean;
  priceList: PriceList;
}

const EditForm: React.FC<EditFormProps & { fuelPriceLists?: boolean }> = ({
  fuelPriceLists,
  priceList,
  toggleOpen,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['priceList', { id: priceList.id }],
    queryFn: () => priceListServices.show(priceList.id),
  });

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <PriceListForm
      fuelPriceLists={fuelPriceLists}
      priceList={data}
      toggleOpen={toggleOpen}
    />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  priceList,
  authObject,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['priceList', { id: priceList.id }],
    queryFn: () => priceListServices.show(priceList.id),
  });

  if (isLoading) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <DialogContent>
      {authObject.checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_READ) ? (
        <PDFContent
          fileName={`PriceList From ${readableDate(priceList.effective_date)}`}
          document={
            <PriceListPDF authObject={authObject as any} priceList={data} />
          }
        />
      ) : (
        <UnauthorizedAccess />
      )}
    </DialogContent>
  );
};

const PriceListsItemAction: React.FC<PriceListsItemActionProps> = ({
  fuelPriceLists,
  priceList,
}) => {
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
      action: 'open',
    },
    checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_EDIT)
      ? {
          icon: <EditOutlined />,
          title: 'Edit',
          action: 'edit',
        }
      : null,
    checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_DELETE)
      ? {
          icon: <DeleteOutlined color='error' />,
          title: 'Delete',
          action: 'delete',
        }
      : null,
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
        maxWidth={openDocumentDialog || fuelPriceLists ? 'md' : 'lg'}
      >
        <DialogTitle>
          <Stack
            width={'100%'}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'end'}
            my={2}
            sx={{ backgroundColor: 'red' }}
          >
            {belowLargeScreen && (
              <Tooltip title='Close'>
                <IconButton
                  size='small'
                  sx={{ position: 'absolute', right: 20, top: 10 }}
                  onClick={() => setOpenDocumentDialog(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </DialogTitle>
        {openEditDialog &&
          (checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_EDIT) ? (
            <EditForm
              fuelPriceLists={fuelPriceLists}
              priceList={priceList}
              toggleOpen={setOpenEditDialog}
            />
          ) : (
            <UnauthorizedAccess />
          ))}

        {openDocumentDialog && (
          <DocumentDialog priceList={priceList} authObject={authObject} />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default PriceListsItemAction;
