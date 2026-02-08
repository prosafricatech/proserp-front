import { EmailOutlined, LanguageOutlined, PhoneOutlined, PinDropOutlined } from '@mui/icons-material'
import { Box, Divider, Grid, ListItemText, Stack, Tooltip, Typography } from '@mui/material'
import React from 'react'
import StakeholderItemAction from './StakeholderItemAction'
import { Stakeholder } from './StakeholderType'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext'

function StakeholderListItem({ stakeholder }:{stakeholder: Stakeholder}) {
  const dictionary = useDictionary();
  return (
    <React.Fragment>
      <Grid 
        container 
        columnSpacing={1}
        paddingRight={2}
        paddingLeft={2}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <ListItemText
              primary={
                <Tooltip title={dictionary.stakeholders.form.labels.name}>
                  <Typography component={'span'}>{stakeholder.name}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={dictionary.stakeholders.form.labels.type}>
                  <Typography component={'span'}>{stakeholder.type}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <ListItemText
              primary={
                stakeholder.phone &&
                  <Stack direction={'row'} spacing={1}>
                    <PhoneOutlined fontSize='small' />
                    <Tooltip title={dictionary.stakeholders.form.labels.phone}>
                      <Typography component={'span'}>{stakeholder.phone}</Typography>
                    </Tooltip>
                  </Stack>
              }
              secondary={
                stakeholder.email &&
                  <Box component="span" display="inline-flex" flexDirection="row" alignItems="center">
                    <EmailOutlined fontSize='small'/>
                    <Tooltip title='Email'>
                      <Typography component={'span'}>&nbsp;{stakeholder.email}</Typography>
                    </Tooltip>
                  </Box>
              }
            />
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <ListItemText
              primary={
                stakeholder.tin &&
                  <Stack direction={'row'} spacing={1}>
                    <Tooltip title={dictionary.stakeholders.form.labels.tin}>
                      <Typography component={'span'}>TIN: {stakeholder.tin}</Typography>
                    </Tooltip>
                  </Stack>
              }
              secondary={
                stakeholder.vrn &&
                <Tooltip title='VRN'>
                  <Typography component={'span'}>VRN: {stakeholder.vrn}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 12, md: 3, lg: 3}}>
            <ListItemText
              primary={
                stakeholder.website &&
                  <Tooltip title='Website'>
                    <Stack direction={'row'} spacing={1}>
                      <LanguageOutlined fontSize='small' />
                      <Typography component={'span'}>{stakeholder.website}</Typography>
                    </Stack>
                  </Tooltip>
              }
            />
          </Grid>
          <Grid size={11.7}>
            <ListItemText
              primary={
                stakeholder.address &&
                  <Tooltip title={dictionary.stakeholders.form.labels.address}>
                    <Stack direction={'row'} spacing={1}>
                      <PinDropOutlined fontSize='small' />
                      <Typography component={'span'}>{stakeholder.address}</Typography>
                    </Stack>
                  </Tooltip>
              }
            />
          </Grid>
          <Grid size={0.3} textAlign={'end'} justifyContent={'flex-end'}>
            <Box display={'flex'} flexDirection={'row'}> 
              <StakeholderItemAction stakeholder={stakeholder} />
            </Box>
        </Grid>
      </Grid>
      <Divider/>
    </React.Fragment>
  )
}

export default StakeholderListItem