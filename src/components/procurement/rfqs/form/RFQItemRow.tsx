'use client';

import React, { useState } from 'react';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import RFQItemForm from './RFQItemForm';
import { RFQItem } from '../rfq-types';

interface RFQItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  items: RFQItem[];
  setItems: React.Dispatch<React.SetStateAction<RFQItem[]>>;
  item: RFQItem;
  index: number;
}

const RFQItemRow: React.FC<RFQItemRowProps> = ({
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
          <Grid size={{ xs: 5, md: 3.5 }}>
            <Tooltip title={'Product Name'}>
              <Typography>{product?.name || 'N/A'}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 3, md: 2 }}>
            <Tooltip title={'Quantity'}>
              <Typography>{item.quantity?.toLocaleString() || 0}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 2, md: 2 }}>
            <Tooltip title={'Unit'}>
              <Typography>
                {item?.unit_symbol || item?.measurement_unit?.symbol || ''}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <Tooltip title={'Remarks'}>
              <Typography variant='body2' noWrap>
                {item?.remarks || '-'}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            textAlign={'end'}
            size={{ xs: 6, md: 1.5 }}
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
                <DeleteOutlined fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <RFQItemForm
          setClearFormKey={setClearFormKey}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          item={item}
          setShowForm={setShowForm}
          index={index}
          items={items}
          setItems={setItems}
        />
      )}
    </React.Fragment>
  );
};

export default RFQItemRow;