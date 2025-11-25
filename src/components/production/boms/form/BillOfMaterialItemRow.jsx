import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  Box,
  ListItemText,
  Grid,
} from '@mui/material';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AlternativesForm from './alternatives/AlternativesForm';
import AlternativesRow from './alternatives/AlternativesRow';
import BillOfMaterialItemForm from './BillOfMaterialItemForm';

function BillOfMaterialItemRow({
  setSubmitItemForm,
  submitMainForm,
  setClearFormKey,
  setIsDirty,
  items,
  setItems,
  item,
  index,
}) {
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [alternatives, setAlternatives] = useState(
    item?.alternatives
      ? item.alternatives.map((alternative) => ({
          ...alternative,
          product_id: alternative.product_id
            ? alternative.product_id
            : alternative.id,
        }))
      : []
  );

  const handleChange = (currentIndex) => {
    setExpanded((prevExpanded) =>
      prevExpanded === currentIndex ? null : currentIndex
    );
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
        component="div" 
        expandIcon={expanded === index ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '12px 0' },
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
            '& svg': { fontSize: '1.25rem' },
          },
        }}
      >
        <Divider />
        {!showForm ? (
          <Grid
            container
            width="100%"
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Grid size={{ xs: 12, md: 7 }}>
              <ListItemText
                primary={
                  <Tooltip title="Product">
                    <Typography
                      variant="h5"
                      fontSize={14}
                      lineHeight={1.25}
                      mb={0}
                      noWrap
                    >
                      {item.product.name}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Tooltip title="Quantity">
                <Typography>
                  {item.quantity.toLocaleString()}{' '}
                  {item?.unit_symbol
                    ? item.unit_symbol
                    : item.measurement_unit?.symbol
                    ? item.measurement_unit?.symbol
                    : item.product.unit_symbol}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }} textAlign="end">
              <Tooltip title="Edit Item">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowForm(true);
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Item">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItems((items) => {
                      const newItems = [...items];
                      newItems.splice(index, 1);
                      return newItems;
                    });
                  }}
                >
                  <DisabledByDefault fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ width: '100%' }}>
            <BillOfMaterialItemForm
              submitMainForm={submitMainForm}
              setClearFormKey={setClearFormKey}
              setSubmitItemForm={setSubmitItemForm}
              setIsDirty={setIsDirty}
              item={item}
              setShowForm={setShowForm}
              index={index}
              items={items}
              setItems={setItems}
            />
          </Box>
        )}
      </AccordionSummary>

      <AccordionDetails>
        <Typography variant="h4">Alternative Input Products</Typography>

        <AlternativesForm
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          alternativeIndex={index}
          setClearFormKey={setClearFormKey}
          setIsDirty={setIsDirty}
          setAlternatives={setAlternatives}
          item={item}
          alternatives={alternatives}
          setItems={setItems}
        />

        {alternatives.map((alternative, altIndex) => (
          <AlternativesRow
            key={altIndex}
            submitMainForm={submitMainForm}
            setClearFormKey={setClearFormKey}
            setIsDirty={setIsDirty}
            setSubmitItemForm={setSubmitItemForm}
            index={altIndex}
            alternative={alternative}
            alternatives={alternatives}
            setAlternatives={setAlternatives}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default BillOfMaterialItemRow;
