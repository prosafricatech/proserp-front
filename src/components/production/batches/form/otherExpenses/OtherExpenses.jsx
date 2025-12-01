import { Alert, Checkbox, FormControlLabel, Grid, LinearProgress, ListItemText, Stack, Switch, Tooltip, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react'
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import productionBatchesServices from '../../productionBatchesServices';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LoadingButton } from '@mui/lab';
import OtherExpensesItemForm from './OtherExpensesItemForm';
import { ProductionBatchesContext } from '../../ProductionBatchesList';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function OtherExpenses({productionDates, setClearFormKey, clearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, otherExpenses, setOtherExpenses}) {
  const [switchToAddItems, setSwitchToAddItems] = useState(false);
  const [expensesManifest, setExpensesManifest] = useState(null);
  const [isFetching, setisFetching] = useState(false);
  const [isFetchedAtLeastOnce, setisFetchedAtLeastOnce] = useState(false);
  const { activeWorkCenter } = useContext(ProductionBatchesContext);

  dayjs.extend(isSameOrAfter);
  dayjs.extend(isSameOrBefore);

  const validationSchema = yup.object({
    from: yup
      .string()
      .required('From date is required')
      .typeError('From date is required')
      .test(
        'is-after-start',
        'From date cannot be before production start date',
        function(value) {
          if (!productionDates?.start_date || !value) return true;
          return dayjs(value).isSameOrAfter(dayjs(productionDates.start_date));
        }
      ),
    to: yup
      .string()
      .test(
        'is-before-end',
        'To date cannot be after production end date',
        function(value) {
          if (!productionDates?.end_date || !value) return true;
          return dayjs(value).isSameOrBefore(dayjs(productionDates.end_date));
        }
      )
      .test(
        'is-after-from',
        'To date cannot be before From date',
        function(value) {
          if (!this.parent.from || !value) return true;
          return dayjs(value).isSameOrAfter(dayjs(this.parent.from));
        }
      ),
  });

  const { setValue, watch, formState: {errors}, handleSubmit} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: { 
      from: productionDates?.start_date ? dayjs(productionDates.start_date).toISOString() : '',
      to: productionDates?.end_date ? dayjs(productionDates.end_date).toISOString() : '',
      cost_center_ids: [activeWorkCenter?.cost_center.id],
      journalable_types: [`payment`, `journal_voucher`],
    },
  });

  useEffect(() => {
    if (productionDates?.start_date && dayjs(productionDates.start_date).isValid()) {
      setValue(`from`, dayjs(productionDates.start_date).toISOString());
    }
    if (productionDates?.end_date && dayjs(productionDates.end_date).isValid()) {
      setValue(`to`, dayjs(productionDates.end_date).toISOString());
    }
  }, [productionDates]);

  const retrieveReport = async (filters) => {
    setisFetching(true);
    const report = await productionBatchesServices.expensesManifest(filters);
    setisFetchedAtLeastOnce(true)
    setExpensesManifest(report);
    setisFetching(false);
  };

  const handleCheckboxChange = (expense) => {
    const isAlreadyAdded = otherExpenses.some((item) => item.original_journal_id === expense.id);

    let updatedExpenses;
    if (isAlreadyAdded) {
      updatedExpenses = otherExpenses.filter((item) => item.original_journal_id !== expense.id);
    } else {
      updatedExpenses = [...otherExpenses, {
        original_journal_id: expense.id,
        ledger_id: expense.debit_ledger.id,
        ledger: expense.debit_ledger,
        quantity: 1,
        rate: expense.amount,
        remarks: expense.description,
        currency_id: expense.currency.id,
        currency: expense.currency,
        exchange_rate: expense.exchange_rate,
        isFetched: true
      }];
    }

    setOtherExpenses(updatedExpenses);
  };

  const handleCheckAll = () => {
    const allSelected = expensesManifest.every((expense) => 
      otherExpenses.some((item) => item.original_journal_id === expense.id)
    );
  
    if (allSelected) {
      // Uncheck all: Remove all expenses from otherExpenses that are in expensesManifest
      const updatedExpenses = otherExpenses.filter(
        (item) => !expensesManifest.some((expense) => expense.id === item.original_journal_id)
      );
      setOtherExpenses(updatedExpenses);
    } else {
      // Check all: Add all expensesManifest items that are not already in otherExpenses
      const newExpenses = expensesManifest
        .filter(
          (expense) => !otherExpenses.some((item) => item.original_journal_id === expense.id)
        )
        .map((expense) => ({
          original_journal_id: expense.id,
          ledger_id: expense.debit_ledger.id,
          ledger: expense.debit_ledger,
          quantity: 1,
          rate: expense.amount,
          remarks: expense.description,
          currency_id: expense.currency.id,
          currency: expense.currency,
          exchange_rate: expense.exchange_rate,
          isFetched: true,
        }));
      
      setOtherExpenses([...otherExpenses, ...newExpenses]);
    }
  };
  
  return (
    <>
      <Stack spacing={1} direction={'row'} p={1}>
        <Typography variant="h5">Manually Add Expenses</Typography>
        <Switch
          onClick={() => setSwitchToAddItems(!switchToAddItems)}
          size='small'
        />
      </Stack>
      {
        switchToAddItems ? (
          <OtherExpensesItemForm
            setClearFormKey={setClearFormKey} 
            submitMainForm={submitMainForm} 
            submitItemForm={submitItemForm} 
            setIsDirty={setIsDirty} 
            setSubmitItemForm={setSubmitItemForm} 
            key={clearFormKey} 
            setOtherExpenses={setOtherExpenses} 
            otherExpenses={otherExpenses}
          />
        ) : (
          <>
            <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
              <Grid
                container
                columnSpacing={1}
                rowSpacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{marginBottom: 1}}
              >
                <Grid size={{xs: 12, md: 5.5}}>
                  <DateTimePicker
                    label="From (MM/DD/YYYY)"
                    key={productionDates?.start_date}
                    fullWidth
                    minDateTime={productionDates?.start_date && dayjs(productionDates.start_date).isValid() ? dayjs(productionDates.start_date) : null}
                    defaultValue={productionDates?.start_date && dayjs(productionDates.start_date).isValid() ? dayjs(productionDates.start_date) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.from,
                        helperText: errors.from?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('from', newValue && dayjs(newValue).isValid() ? newValue.toISOString() : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 5.5}}>
                  <DateTimePicker
                    label="To (MM/DD/YYYY)"
                    key={productionDates?.end_date}
                    fullWidth
                    defaultValue={productionDates?.end_date ? dayjs(productionDates.end_date) : null}
                    minDateTime={watch('from') ? dayjs(watch('from')) : null}
                    maxDateTime={productionDates?.end_date ? dayjs(productionDates.end_date) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!errors.to,
                        helperText: errors.to?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 1}} textAlign="right">
                  <LoadingButton loading={isFetching} type="submit" size="small" variant="contained">
                    Fetch
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>

            {!isFetching ? 
              expensesManifest?.length > 0 ? (
                <>
                  <Grid container>
                    <Grid size={12}>
                      <Typography variant="h5" sx={{marginTop: 1}} >Select Expense to Add</Typography>
                    </Grid>
                    <Grid size={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={expensesManifest?.length > 0 && expensesManifest.every((expense) => 
                              otherExpenses?.some((item) => item.original_journal_id === expense.id)
                            )}
                            indeterminate={
                              otherExpenses?.some((item) =>
                                expensesManifest?.some((expense) => item.original_journal_id === expense.id)
                              ) && !expensesManifest?.every((expense) =>
                                otherExpenses?.some((item) => item.original_journal_id === expense.id)
                              )
                            }
                            onChange={handleCheckAll}
                            color="primary"
                          />
                        }
                        label={
                          expensesManifest?.every((expense) => 
                            otherExpenses?.some((item) => item.original_journal_id === expense.id)
                          ) ? 'Uncheck All' : 'Check All'
                        }
                      />
                    </Grid>
                  </Grid>
                  {expensesManifest.map((expensemanifest, index) => {
                      const isChecked = otherExpenses.some((item) => item.original_journal_id === expensemanifest.id);

                      return (
                          <Grid 
                            key={index}
                            container 
                            columnSpacing={1}
                            sx={{
                              cursor: 'pointer',
                              borderTop: 1,
                              borderColor: 'divider',
                              '&:hover': {
                                  bgcolor: 'action.hover',
                              },
                              paddingLeft: 2
                            }}
                            alignItems={'center'}
                          >
                              <Grid size={{xs: 6, md: 0.5}}>
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleCheckboxChange(expensemanifest)}
                                  size="small"
                                />
                              </Grid>
                              <Grid size={{xs: 6, md: 1.5}}>
                                <ListItemText
                                  primary={
                                    <Stack direction={'row'}>
                                      <Tooltip title={'Voucher Number'}>
                                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                          {expensemanifest.journalable.voucherNo}
                                        </Typography>
                                      </Tooltip>
                                    </Stack>
                                  }
                                />
                              </Grid>
                              <Grid size={{xs: 12, md: 5}}>
                                  <ListItemText
                                      primary={
                                          <Tooltip title={'Expense Name'}>
                                              <Typography variant="span" lineHeight={1.25} mb={0}>
                                                  {expensemanifest.debit_ledger.name}
                                              </Typography>
                                          </Tooltip>
                                      }
                                      secondary={
                                          <Tooltip title={'Description'}>
                                              <Typography variant="span" lineHeight={1.25} mb={0} noWrap>
                                                  {expensemanifest.description}
                                              </Typography>
                                          </Tooltip>
                                      }
                                  />
                              </Grid>
                              <Grid size={{xs: 6, md: 3}}>
                                  <ListItemText
                                      primary={
                                          <Tooltip title={'Transaction Date'}>
                                              <Typography variant="span" lineHeight={1.25} mb={0} noWrap>
                                                  {readableDate(expensemanifest.journal_date)}
                                              </Typography>
                                          </Tooltip>
                                      }
                                  />
                              </Grid>
                              <Grid size={{xs: 6, md: 2}} textAlign={{xs:'end', md:'start'}}>
                                  <Tooltip title={'Amount'}>
                                      <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                          {expensemanifest.amount.toLocaleString("en-US", { 
                                              style: "currency", 
                                              currency: expensemanifest.journalable.currency?.code 
                                          })}
                                      </Typography>
                                  </Tooltip>
                              </Grid>
                          </Grid>
                      );
                  })}
                </>
              ) : (
                isFetchedAtLeastOnce && <Alert sx={{marginTop: 1, marginBottom: 1}} variant='outlined' severity='info'>No Expense to Add</Alert>
              )
              :
              <LinearProgress sx={{marginTop: 2}}/>
            }
          </>
        )
      }
    </>
  );
}

export default OtherExpenses