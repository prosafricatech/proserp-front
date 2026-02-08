import React, { useState } from 'react'
import { Alert, Box, Grid, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import SecondaryUnitsItemAction from './SecondaryUnitsItemAction';
import productServices from '../../productServices';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function SecondaryUnits({expanded, product}) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [openUnitDeleteDialog, setOpenUnitDeleteDialog] = useState(false);
  const [openUnitEditDialog, setOpenUnitEditDialog] = useState(false);
  const dictionary = useDictionary();

  const { data: secondaryUnits, isLoading } = useQuery({
    queryKey: ['secondaryUnits', product.id],
    queryFn: () => productServices.secondaryUnits(product.id),
    enabled: !!expanded,
  });

  return (
    <>
      {
        isLoading && <LinearProgress/>
      }
      {
        secondaryUnits?.length > 0 ? secondaryUnits.map((secondaryUnit) => (
        <Grid
          key={secondaryUnit.id}
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              paddingX: 1,
          }}
          columnSpacing={2}
          alignItems={'center'}
          mb={1}
          container
        >
          <Grid size={{xs: 6, md: 4, lg: 4}}>
            <Tooltip title={dictionary.products.list.secondaryForm.labels.unitName}>
              <Typography>{secondaryUnit?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
            <Tooltip title={dictionary.products.list.secondaryForm.labels.symbol}>
              <Typography variant='caption'>{secondaryUnit?.unit_symbol}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
            <Tooltip title={dictionary.products.list.secondaryForm.labels.conversionFactor}>
              <Typography>{secondaryUnit?.conversion_factor}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 2, lg: 2}}>
            <Box
              display={'flex'}
              flexDirection={'row'}
              justifyContent={'flex-end'}
            >
              <Tooltip  title={dictionary.products.list.secondaryForm.actionsTitle.edit.replace('{unitName}',secondaryUnit.name)}>
                <IconButton 
                  onClick={() => {
                    setSelectedUnit(secondaryUnit);
                    setOpenUnitEditDialog(true);
                  }}
                >
                  <EditOutlined fontSize={'small'} />
                </IconButton>
              </Tooltip>
              <Tooltip title={dictionary.products.list.secondaryForm.actionsTitle.delete.replace('{unitName}',secondaryUnit.name)}>
                <IconButton
                  onClick={() => {
                    setSelectedUnit(secondaryUnit);
                    setOpenUnitDeleteDialog(true);
                  }}
                >
                  <DeleteOutlined color="error"  fontSize={'small'} />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        ))
        :
        !isLoading && <Alert variant='outlined' severity='info'>{dictionary.products.list.alert.info}</Alert> 
      }

      {/* ItemAction*/}
      <SecondaryUnitsItemAction
        openUnitEditDialog={openUnitEditDialog}
        setOpenUnitEditDialog={setOpenUnitEditDialog}
        openUnitDeleteDialog={openUnitDeleteDialog}
        setOpenUnitDeleteDialog={setOpenUnitDeleteDialog} 
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        product={product}
      />
    </>      
  )
}

export default SecondaryUnits