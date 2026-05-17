import PhotoThumbnail from '@/components/productAndServices/products/PhotoCard';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { PriceListItem } from '../PriceListType';
import PriceListItemForm from './PriceListItemForm';

interface PriceListItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  items: PriceListItem[];
  setItems: React.Dispatch<React.SetStateAction<PriceListItem[]>>;
  item: PriceListItem;
  index: number;
}

const PriceListItemRow: React.FC<
  PriceListItemRowProps & { fuelPriceLists?: boolean }
> = ({
  fuelPriceLists,
  setClearFormKey,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  items,
  setItems,
  item,
  index,
}) => {
  const product = item.product;
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid
          container
          columnSpacing={1}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>{index + 1}.</Grid>
          <Grid size={{ xs: 10, md: fuelPriceLists ? 5 : 4 }}>
            <Tooltip title={'Product Name'}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <PhotoThumbnail
                  photo={product?.main_photo}
                  thumbnail={product?.thumbnail}
                  itemName={product?.name}
                />
                <Typography>{product.name}</Typography>
              </Stack>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 1, md: 1.5 }}>
            <Tooltip title={'Unit'}>
              <Typography>
                {item?.unit_symbol || item.measurement_unit?.symbol}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: fuelPriceLists ? 3 : 2.5 }}>
            <Tooltip title={'Price'}>
              <Typography>{item.price.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          {!fuelPriceLists && (
            <Grid
              size={{ xs: 6, md: 2.5 }}
              textAlign={{ xs: 'end', md: 'start' }}
            >
              <Tooltip title={'Bottom Cap'}>
                <Typography>{item.bottom_cap.toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
          )}
          <Grid
            textAlign={'end'}
            size={{ xs: fuelPriceLists ? 6 : 12, md: fuelPriceLists ? 2 : 1 }}
          >
            <Tooltip title='Edit Item'>
              <IconButton
                size='small'
                onClick={() => setShowForm(true)}
                aria-label='edit item'
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Item'>
              <IconButton
                size='small'
                onClick={() =>
                  setItems((prevItems) => {
                    const newItems = [...prevItems];
                    newItems.splice(index, 1);
                    return newItems;
                  })
                }
                aria-label='remove item'
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <PriceListItemForm
          setClearFormKey={setClearFormKey}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          item={item}
          setShowForm={setShowForm}
          index={index}
          items={items}
          setItems={setItems}
          fuelPriceLists={fuelPriceLists}
        />
      )}
    </React.Fragment>
  );
};

export default PriceListItemRow;
