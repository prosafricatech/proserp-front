import { DeleteOutlined } from '@mui/icons-material'
import { IconButton, Stack, Tooltip } from '@mui/material'
import React from 'react'

const ProductListBulkActions = () => {
  return (
    <Stack direction={"row"} sx={{ backgroundColor: 'transparent', ml: -2}}>
        <Tooltip title={"Delete"}>
            <IconButton color="error">
                <DeleteOutlined />
            </IconButton>
        </Tooltip>
    </Stack>
  )
}

export default ProductListBulkActions