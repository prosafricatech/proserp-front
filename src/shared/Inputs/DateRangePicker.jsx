import { Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import React from 'react'

function DateRange({onFromChange, onToChange}) {
  return (
    <Stack direction={'row'} spacing={2}>
        <DatePicker
            label={'From'}
            slotProps={{
                textField : {
                    size: 'small',
                    sx: {
                        width: '180px'
                    },
                    readOnly: true,
                }
            }}
            onChange={(value) => onFromChange(value)}
        />
        <DatePicker
            label={'To'}
            slotProps={{
                textField : {
                    size: 'small',
                    sx: {
                        width: '180px'
                    },
                    readOnly: true,
                }
            }}
            onChange={(value) => {onToChange(value)}}
        />
    </Stack>
  )
}

export default DateRange