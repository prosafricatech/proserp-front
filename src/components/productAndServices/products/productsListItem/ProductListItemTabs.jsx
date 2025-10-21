import { Dialog, Divider, Grid, IconButton, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import { AddOutlined } from '@mui/icons-material'
import SecondaryUnitForm from './secondaryUnits/SecondaryUnitForm'
import SecondaryUnits from './secondaryUnits/SecondaryUnits'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext'

function ProductListItemTabs ({ product, expanded}) {
  const [activeTab, setActiveTab] = useState(0);
  const {authOrganization : {organization},checkOrganizationPermission} = useJumboAuth();
  const [openSecondaryUnit, setOpenSecondaryUnit] = useState(false);
  const canCreateOrEdit = checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE,PERMISSIONS.PRODUCTS_EDIT]);
  const dictionary = useDictionary();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return(
    <React.Fragment>
      <Grid size={12}>
        <Divider/>
        <Tabs
          value={activeTab}
          onChange={(e,newValue) =>setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons='auto'
          allowScrollButtonsMobile
        >
          <Tab label={dictionary.products.list.secondaryForm.labels.secondaryTitle}/>
        </Tabs>
      </Grid>

      {activeTab === 0 && 
        <Grid container sx={{width: '100%'}}>
          <Grid size={12} textAlign={'end'}>
            {
              canCreateOrEdit &&
              <Tooltip  title={dictionary.products.list.secondaryForm.labels.newCreateLabel}>
                <IconButton onClick={()=> setOpenSecondaryUnit(true)}>
                  <AddOutlined/>
                </IconButton>
              </Tooltip>
            }
          </Grid> 
          <Grid size={12}>
            <SecondaryUnits product={product} expanded={expanded} activeTab={activeTab}/>
          </Grid>
          {
            canCreateOrEdit &&
            <Dialog
              open={openSecondaryUnit}
              maxWidth={'md'}
              fullScreen={belowLargeScreen}
              scroll={belowLargeScreen ? 'body' : 'paper'}
              fullWidth
            >
              <SecondaryUnitForm setOpenDialog={setOpenSecondaryUnit} organization={organization} product={product} />
            </Dialog>
          }
        </Grid>
      }
    </React.Fragment>
  )
  }

export default ProductListItemTabs