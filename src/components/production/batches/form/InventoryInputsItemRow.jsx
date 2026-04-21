import {
  Divider,
  Grid,
  IconButton,
  ListItemText,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box
} from '@mui/material';
import React, { useState } from 'react';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import InventoryInputsItemForm from './InventoryInputsItemForm';
import { useSnackbar } from 'notistack';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import inventoryConsumptionsServices from '@/components/procurement/inventoryConsumptions/inventoryConsumptionsServices';

function InventoryInputsItemRow({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  productionDates,
  inventoryInputs,
  setInventoryInputs,
  item,
  index,
  setIsConsumptionDeletedInside
}) {
  const product = item.product;
  const isInventory = product?.type === 'Inventory';
  const [showForm, setShowForm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const deleteInventoryConsumption = useMutation({
    mutationFn: inventoryConsumptionsServices.delete,
    onSuccess: (data) => {
      setIsConsumptionDeletedInside(true);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['showBatchDetails'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Consumption Item will be deleted',
      onYes: () => {
        hideDialog();
        deleteInventoryConsumption.mutate(item);
      },
      onNo: () => hideDialog(),
      variant: 'confirm'
    });
  };

  return (
    <React.Fragment>
      <Divider />
      {item?.id ? (
        <Accordion
          expanded={expanded}
          square
          sx={{
            borderRadius: 2,
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onChange={() => setExpanded((prevExpanded) => !prevExpanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <AccordionSummary
              expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
              sx={{
                flex: 1,
                flexDirection: 'row-reverse',
                '.MuiAccordionSummary-content': {
                  alignItems: 'center',
                  '&.Mui-expanded': {
                    margin: '10px 0',
                  },
                },
                '.MuiAccordionSummary-expandIconWrapper': {
                  borderRadius: 1,
                  border: 1,
                  color: 'text.secondary',
                  transform: 'none',
                  mr: 0.5,
                  '&.Mui-expanded': {
                    transform: 'none',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                  },
                  '& svg': {
                    fontSize: '0.9rem',
                  },
                },
              }}
            >
              <Grid
                paddingLeft={1}
                paddingRight={1}
                columnSpacing={1}
                alignItems={'center'}
                width={'100%'}
                container
              >
                <Grid size={0.5}>
                  {index + 1}.
                </Grid>
                <Grid size={{xs: 5.5, md: 2.5}}>
                  <Tooltip title="Consumption No">
                    <Typography>{item.consumptionNo}</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <Tooltip title="Consumption Date">
                    <Typography>{readableDate(item.consumption_date)}</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 5}}>
                  <Tooltip title="Store">
                    <Typography>{item.store?.name}</Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionSummary>

            <Tooltip title="Remove Item">
              <IconButton size="small" onClick={handleDelete}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Box>

          <AccordionDetails
            sx={{
              backgroundColor: 'background.paper',
              marginBottom: 3,
            }}
          >
            <Typography fontWeight="bold">Items</Typography>
            {item.items?.map((it, idx) => (
              <React.Fragment key={idx}>
                <Divider />
                <Grid
                  container
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    paddingLeft: { md: 3 },
                  }}
                >
                  <Grid size={1}>
                    {idx + 1}.
                  </Grid>
                  <Grid size={{xs: 9, md: 5}}>
                    <ListItemText
                      primary={
                        <Tooltip title={'Product'}>
                          <Typography
                            variant={'h5'}
                            fontSize={14}
                            lineHeight={1.25}
                            mb={0}
                            noWrap
                          >
                            {it.product?.name}
                          </Typography>
                        </Tooltip>
                      }
                    />
                  </Grid>
                  <Grid size={{xs: 2, md: 3}}>
                    <Tooltip title="Quantity">
                      <Typography>
                        {it?.quantity}{' '}
                        {it?.unit_symbol ||
                          it.measurement_unit?.symbol ||
                          it.product?.unit_symbol}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 6, md: 3}}>
                    <Tooltip title={'Remarks'}>
                      <Typography fontSize={14} lineHeight={1.25} mb={0}>
                        {it.description}
                      </Typography>
                    </Tooltip>
                  </Grid>
                </Grid>
              </React.Fragment>
            ))}
          </AccordionDetails>
        </Accordion>
      ) : (
        <>
          {!showForm ? (
            <Grid
              container
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Grid size={{xs: 1, md: 0.5}}>
                {index + 1}.
              </Grid>
              <Grid size={{xs: 4, md: 2}}>
                <Tooltip title="Consumption Date">
                  <Typography>{readableDate(item.consumption_date)}</Typography>
                </Tooltip>
              </Grid>
              <Grid size={{xs: 11, md: 3.5}}>
                <ListItemText
                  primary={
                    <Tooltip title={'Product'}>
                      <Typography
                        variant={'h5'}
                        fontSize={14}
                        lineHeight={1.25}
                        mb={0}
                        noWrap
                      >
                        {product?.name}
                      </Typography>
                    </Tooltip>
                  }
                  secondary={
                    <Tooltip title={'Remarks'}>
                      <Typography
                        variant={'span'}
                        fontSize={14}
                        lineHeight={1.25}
                        mb={0}
                      >
                        {item.remarks || item.description}
                      </Typography>
                    </Tooltip>
                  }
                />
              </Grid>
              <Grid size={{xs: 6, md: 3}}>
                <Tooltip title="Store">
                  <Typography>{item.store?.name}</Typography>
                </Tooltip>
              </Grid>
              <Grid
                size={{xs: isInventory ? 6 : 3, md: isInventory ? 2 : 1}}
                textAlign={'end'}
              >
                <Tooltip title="Quantity">
                  <Typography>
                    {item?.quantity}{' '}
                    {item?.unit_symbol ||
                      item.measurement_unit?.symbol ||
                      item.product?.unit_symbol}
                  </Typography>
                </Tooltip>
              </Grid>
              {!isInventory && (
                <Grid item xs={3} md={1}>
                  <Tooltip title="Rate">
                    <Typography>{item.rate?.toLocaleString()}</Typography>
                  </Tooltip>
                </Grid>
              )}
              <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
                {!item.id && (
                  <Tooltip title="Edit Item">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setShowForm(true);
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Remove Item">
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!item.id) {
                        setInventoryInputs((prevItems) => {
                          const newItems = [...prevItems];
                          newItems.splice(index, 1);
                          return newItems;
                        });
                      } else {
                        handleDelete();
                      }
                    }}
                  >
                    <DisabledByDefault fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          ) : (
            <InventoryInputsItemForm
              setClearFormKey={setClearFormKey}
              submitMainForm={submitMainForm}
              setSubmitItemForm={setSubmitItemForm}
              submitItemForm={submitItemForm}
              setIsDirty={setIsDirty}
              item={item}
              setShowForm={setShowForm}
              index={index}
              inventoryInputs={inventoryInputs}
              setInventoryInputs={setInventoryInputs}
              productionDates={productionDates}
            />
          )}
        </>
      )}
    </React.Fragment>
  );
}

export default InventoryInputsItemRow;
