'use client'
import { AddOutlined, AddTaskOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Dialog, useMediaQuery, Menu, MenuItem, ListItemIcon } from '@mui/material';
import React, { lazy, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const PriceListForm = lazy(() => import("./form/PriceListForm"));
const PriceListsExcel = lazy(() => import("./excel/PriceListsExcel"));

const PriceListsActionTail = ({fuelPriceLists}: {fuelPriceLists?: boolean}) => {
    const { checkOrganizationPermission } = useJumboAuth();
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [openExcelDialog, setOpenExcelDialog] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <React.Fragment>
            <Dialog 
                fullWidth 
                fullScreen={belowLargeScreen} 
                scroll={belowLargeScreen ? 'body' : 'paper'} 
                maxWidth={(openExcelDialog || fuelPriceLists) ? "md" : "lg"} 
                open={openDialog || openExcelDialog}
            >
                {openExcelDialog && <PriceListsExcel setOpenExcelDialog={setOpenExcelDialog} />}
                {openDialog && <PriceListForm toggleOpen={setOpenDialog} fuelPriceLists={fuelPriceLists} />}
            </Dialog>

            <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
                {checkOrganizationPermission(PERMISSIONS.PRICE_LISTS_CREATE) && (
                    <React.Fragment>
                        <IconButton 
                            size="small" 
                            onClick={(event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                            sx={{ p: 0 }}
                        >
                            <AddOutlined />
                        </IconButton>
                        
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={() => {
                                setOpenDialog(true);
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <AddTaskOutlined fontSize="small" />
                                </ListItemIcon>
                                Add Price List
                            </MenuItem>
                            
                            <MenuItem onClick={() => {
                                setOpenExcelDialog(true);
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <FontAwesomeIcon icon={faFileExcel} fontSize="medium" />
                                </ListItemIcon>
                                Price List Excel
                            </MenuItem>
                        </Menu>
                    </React.Fragment>
                )}
            </ButtonGroup>
        </React.Fragment>
    );
};

export default PriceListsActionTail;