import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState, Dispatch, SetStateAction } from 'react';
import ProductVendor from './ProductVendor';
import { Vendor } from '../../RequisitionType';

interface ProductVendorRowProps {
  index: number;
  vendor: Vendor;
  vendors: Vendor[];
  setVendors: Dispatch<SetStateAction<Vendor[]>>;
  vendorIndex?: number;
  setRequisition_product_items: Dispatch<SetStateAction<any[]>>;
}

function ProductVendorRow({ 
  index, 
  vendor, 
  vendors = [], 
  setVendors,
  vendorIndex,
  setRequisition_product_items
}: ProductVendorRowProps) {
  const client = vendor.stakeholder;
  const [showForm, setShowForm] = useState(false);

  const handleRemoveVendor = () => {
    setVendors(currentVendors => {
      const newItems = [...currentVendors];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid
          container
          marginLeft={3}
          paddingRight={3}
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
          <Grid size={5}>
            <Tooltip title="Vendor">
              <Typography>{client?.name || vendor?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 5.5}}>
            <Tooltip title="Remarks">
              <Typography>{vendor.remarks}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
            <Tooltip title="Edit Vendor">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove Vendor">
              <IconButton size="small" onClick={handleRemoveVendor}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <ProductVendor
          isFromApproval={false}
          vendorIndex={vendorIndex}
          index={index}
          setShowForm={setShowForm}
          vendor={vendor}
          setRequisition_product_items={setRequisition_product_items}
          vendors={vendors}
          setVendors={setVendors}
        />
      )}
    </React.Fragment>
  );
}

export default ProductVendorRow;