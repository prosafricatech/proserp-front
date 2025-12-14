import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Box,
  ListItemText
} from '@mui/material';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RequisitionProductItemForm, { RequisitionProductItem } from './RequisitionProductItemForm';
import ProductVendor from './productVendor/ProductVendor';
import ProductVendorRow from './productVendor/ProductVendorRow';
import { Currency } from '@/utilities/constants/countries';
import { Vendor } from '../RequisitionType';

interface RequisitionProductItemRowProps {
  setClearFormKey: (value: React.SetStateAction<number>) => void;
  setIsDirty: (value: React.SetStateAction<boolean>) => void;
  currencyDetails?: Currency;
  requisition_product_items: RequisitionProductItem[];
  setRequisition_product_items: (items: React.SetStateAction<RequisitionProductItem[]>) => void;
  product_item: RequisitionProductItem;
  index: number;
}

function RequisitionProductItemRow({
  setClearFormKey,
  setIsDirty,
  currencyDetails,
  requisition_product_items,
  setRequisition_product_items,
  product_item,
  index
}: RequisitionProductItemRowProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState(
    product_item?.vendors 
      ? product_item.vendors.map((vendor: Vendor) => ({
          ...vendor,
          stakeholder_id: vendor.stakeholder_id ?? vendor.id
        })) 
      : []
  );

  const handleChange = (currentIndex: number) => {
    setExpanded(prevExpanded => (prevExpanded === currentIndex ? null : currentIndex));
  };

  const vat_factor = (product_item.vat_percentage ?? 0) * 0.01;
  const lineVat = product_item.product_item_vat ?? (product_item.rate ?? 0) * vat_factor;
  const linetotalAmount = product_item.amount ?? (product_item.rate ?? 0) * (product_item.quantity ?? 0) * (1 + vat_factor);

  const handleRemoveItem = () => {
    setRequisition_product_items(items => {
      const newItems = [...items];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowForm(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRemoveItem();
  };

  return (
    <Accordion
      key={index}
      expanded={expanded === index}
      onChange={() => handleChange(index)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        '& > .MuiAccordionDetails-root:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded === index ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <Divider />
        {!showForm ? (
          <Grid container 
            width={'100%'}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <Grid size={{xs: 12, md: 3.5}}>
              <ListItemText
                primary={
                  <Tooltip title={'Product'}>
                    <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                      {product_item.product?.name}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title={'Remarks'}>
                    <Typography component="span" fontSize={14} lineHeight={1.25} mb={0}>
                      {product_item.remarks}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid textAlign={{md: 'end'}} size={{xs: 6, md: 2}}>
              <Tooltip title="Quantity">
                <Typography>
                  {product_item.quantity?.toLocaleString() ?? '0'} 
                  {product_item?.unit_symbol ?? 
                   product_item.measurement_unit?.symbol ?? 
                   product_item.product?.unit_symbol}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={'end'} size={{xs: 6, md: 2}}>
              <Tooltip title="Rate">
                <Typography>{product_item.rate?.toLocaleString() ?? '0'}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={{md: 'end'}} size={{xs: 6, md: 1.5}}>
              <Tooltip title="VAT">
                <Typography>{lineVat.toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={'end'} size={{xs: 6, md: 2}}>
              {product_item.rate && product_item.quantity && (
                <Tooltip title="Amount">
                  <Typography>
                    {linetotalAmount?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: currencyDetails?.code,
                    })}
                  </Typography>
                </Tooltip>
              )}
            </Grid>
            <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
              <Tooltip title='Edit Item'>
                <Box 
                  component="span" 
                  onClick={handleEditClick}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    ml: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  <EditOutlined fontSize='small'/>
                </Box>
              </Tooltip>
              <Tooltip title='Remove Item'>
                <Box 
                  component="span" 
                  onClick={handleRemoveClick}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    ml: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  <DisabledByDefault fontSize='small'/>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ width: '100%' }}>
            <RequisitionProductItemForm 
              setClearFormKey={setClearFormKey} 
              setIsDirty={setIsDirty} 
              product_item={product_item} 
              setShowForm={setShowForm} 
              index={index} 
              requisition_product_items={requisition_product_items} 
              setRequisition_product_items={setRequisition_product_items}
              submitItemForm={false}
              setSubmitItemForm={() => {}}
              submitMainForm={() => {}}
            />
          </Box>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <ProductVendor 
          vendorIndex={index} 
          setRequisition_product_items={setRequisition_product_items} 
          vendors={vendors} 
          setVendors={setVendors}
        />
        
        {vendors.map((vendor: Vendor, vendorIndex: number) => (
          <ProductVendorRow 
            key={vendorIndex} 
            index={vendorIndex} 
            vendor={vendor} 
            vendors={vendors} 
            setVendors={setVendors}
            vendorIndex={index}
            setRequisition_product_items={setRequisition_product_items}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default RequisitionProductItemRow;