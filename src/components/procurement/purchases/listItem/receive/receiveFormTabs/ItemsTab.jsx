import { Div } from '@jumbo/shared';
import { Divider, Grid, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

function ItemsTab() {
  const {purchase_order_items,errors,register,setValue,watch} = useFormContext();

  return (
    <>
      {purchase_order_items
        .filter((item) => item.unreceived_quantity !== 0)
        .map((item, index) => (
          <React.Fragment key={item.id}>
            <Grid
              container
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Grid size={12}>
                <Divider />
              </Grid>
              <Grid size={0.5}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
              </Grid>
              <Grid size={{xs: 11.5, md: 6}}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title='Product'>
                    <Typography>{item.product.name}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid textAlign={'center'} size={{xs: 6, md: 2}}>
                <Div sx={{ mt: 1.7, mb: 1.7 }}>
                  <Tooltip title='Quantity'>
                    <Typography>{`${item.measurement_unit.symbol} ${item.unreceived_quantity}`}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid size={{xs: 6, md: 3, lg: 2}}>
                <Div sx={{ mt: 0.7, mb: 0.5 }}>
                  <TextField
                    label='Receive'
                    fullWidth
                    size='small'
                    error={!!errors?.items && !!errors.items[index] && !!errors.items[index].quantity}
                    helperText={errors?.items && errors.items[index] && errors.items[index].quantity?.message}
                    value={watch(`items.${index}.quantity`) || ''}
                    onChange={(e) => {
                      setValue(`items.${index}.quantity`,  e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
            </Grid>
          </React.Fragment>
        ))}
      <Grid container>
        <Grid size={12}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <TextField
              label='Remarks'
              fullWidth
              multiline={true}
              minRows={2}
              error={!!errors?.remarks}
              helperText={errors?.remarks?.message}
              {...register('remarks')}
            />
          </Div>
        </Grid>
      </Grid>
    </>
  );
}

export default ItemsTab;
