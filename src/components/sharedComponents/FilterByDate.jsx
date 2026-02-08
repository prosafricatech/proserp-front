import useJumboAuth from '@jumbo/hooks/useJumboAuth';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, Grid } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useState } from 'react'

function FilterByDate({openDateFilter, setOpenDateFilter, handleOnDateFilter}) {
    const {authOrganization} = useJumboAuth();
    const [filterDate, setFilterDate] = useState({
        from : dayjs().startOf('month').toISOString(),
        to: dayjs().endOf('day').toISOString(),
    })

  return (
    <Dialog
        open={openDateFilter}
        maxWidth='sm'
        onClose={() => {
            setOpenDateFilter(false);
        }}
    >
        <DialogContent>
            <Grid container justifyContent={'center'} spacing={1}>
                <Grid item xs={12} md={6}>
                    <DateTimePicker
                        label="From"
                        defaultValue={dayjs(filterDate.from)}
                        minDate={dayjs(authOrganization.organization.recording_start_date)}
                        slotProps={{
                            textField : {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value) => {
                            setFilterDate((filters) => { return {...filters,from: value.toISOString()}; });
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <DateTimePicker
                        label="To"
                        defaultValue={dayjs(filterDate.to)}
                        minDate={dayjs(filterDate.from)}
                        slotProps={{
                            textField : {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value) => {
                            setFilterDate((filters) => { return {...filters,to: value.toISOString()}; });
                        }}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button size='small' onClick={() => setOpenDateFilter(false)}>
                Cancel
            </Button>
            <LoadingButton
                size='small'
                type='submit'
                variant='contained'
                onClick={() =>{ handleOnDateFilter(filterDate); setOpenDateFilter(false);}}
            >
                Filter
            </LoadingButton>
        </DialogActions>
    </Dialog>
  )
}

export default FilterByDate