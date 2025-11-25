import { Checkbox, Divider, Grid, Switch, Typography } from '@mui/material';
import React, { useEffect, useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useVFD } from "@/components/vfd/VFDProvider";
import { debounce } from 'lodash';

function ProductsSaleSummary() {
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);

  const {
    items,
    sale,
    checkedForSuggestPrice,
    setCheckedForSuggestPrice,
    vat_percentage,
    organization,
    checkedForInstantSale,
    setCheckedForInstantSale,
    setValue,
    watch
  } = useFormContext();

  const majorInfoOnly = watch('major_info_only');
  const { displayTotal, connected } = useVFD();
  const vatAmount = (vatableAmount * vat_percentage) / 100;
  const currencyCode = watch('currency')?.code;

  useEffect(() => {
    let total = 0;
    let vatable = 0;

    async function loopItems() {
      await setValue(`items`, null);
      await items.forEach((item, index) => {
        total += item.rate * item.quantity;

        setValue(`items.${index}.product_id`, item?.product?.id ? item.product.id : item.product_id);
        setValue(`items.${index}.quantity`, item.quantity);
        setValue(`items.${index}.rate`, item.rate);
        setValue(`items.${index}.store_id`, item.store_id);
      });

      setTotalAmount(total);
    }

    async function loopItemsForVAT() {
      await setValue(`items`, null);

      await items
        .filter(item => item.product.vat_exempted !== 1)
        .forEach(item => {
          vatable += item.rate * item.quantity;
        });

      setVatableAmount(vatable);
    }

    loopItems();
    loopItemsForVAT();
  }, [items]);

  const grandTotal = totalAmount + vatAmount;

// Live update with currency
  useEffect(() => {
    displayTotal(grandTotal, currencyCode);
  }, [grandTotal, currencyCode, connected, displayTotal]);

  // On unmount (dialog close) → show 0.00 with currency
  useEffect(() => {
    return () => {
      displayTotal(0, currencyCode);
    };
  }, [displayTotal, currencyCode]);

  return (
    <Grid container columnSpacing={1}>
      <Grid size={12}>
        <Typography align="center" variant="h3">
          Summary
        </Typography>
        <Divider />
      </Grid>

      {/* Total */}
      <Grid size={6}>
        <Typography align="left" variant="body2">
          Total:
        </Typography>
      </Grid>
      <Grid size={6}>
        <Typography align="right" variant="h5">
          {totalAmount.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}
        </Typography>
      </Grid>

      {/* VAT Section */}
      {watch('vat_registered') && (
        <React.Fragment>
          <Grid size={6}>
            <Typography align="left" variant="body2">
              VAT:
              <Checkbox
                size="small"
                disabled={majorInfoOnly}
                checked={!!vat_percentage}
                onChange={e => {
                  const checked = e.target.checked;
                  setValue('vat_percentage', checked ? organization.settings.vat_percentage : 0, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
              />
            </Typography>
          </Grid>

          <Grid size={6} display="flex" alignItems="center" justifyContent="end">
            <Typography align="right" variant="h5">
              {vatAmount.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </Typography>
          </Grid>

            <Grid size={6}>
                <Typography align="left" variant="body2">
                    Grand Total ({currencyCode}):
                </Typography>
            </Grid>
            <Grid size={6}>
                <Typography align="right" variant="h5">
                    {(totalAmount + vatAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </Typography>
            </Grid>
        </React.Fragment>
      )}

      {/* Instant Sale & Suggest Price */}
      {watch(`stakeholder_id`) !== null && !majorInfoOnly && (
        <>
          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={7} marginTop={2} marginBottom={2}>
            <Typography align="left" variant="body2">
              Instant Sale:
            </Typography>
          </Grid>

          <Grid size={5} display="flex" alignItems="end" justifyContent="end" marginTop={1} marginBottom={2}>
            <Switch
              checked={checkedForInstantSale}
              size="small"
              disabled={!!sale && !sale?.is_instant_sale ? true : false}
              onChange={e => {
                setCheckedForInstantSale(e.target.checked);
                setValue('instant_sale', e.target.checked, {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }}
            />
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={7} marginTop={1} marginBottom={2}>
            <Typography align="left" variant="body2">
              Suggest Recent Price:
            </Typography>
          </Grid>

          <Grid size={5} display="flex" alignItems="end" justifyContent="end" marginTop={1} marginBottom={2}>
            <Switch
              checked={checkedForSuggestPrice}
              size="small"
              onChange={e => setCheckedForSuggestPrice(e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default ProductsSaleSummary;