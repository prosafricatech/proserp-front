import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import ApprovalChainsItemForm from './ApprovalChainsItemForm';
import { SubmitHandler } from 'react-hook-form';
import { ApprovalChainItem } from '../ApprovalChainType';

interface ApprovalChainsItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: SubmitHandler<any>;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  items: ApprovalChainItem[];
  setItems: React.Dispatch<React.SetStateAction<ApprovalChainItem[]>>;
  item: ApprovalChainItem;
  index: number;
}

const ApprovalChainsItemRow: React.FC<ApprovalChainsItemRowProps> = ({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  items,
  setItems,
  item,
  index
}) => {
  const role = item.role;
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Divider />
      {!showForm ? (
        <Grid
          container
          columnSpacing={1}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{xs: 1, md: 0.5}}>
            {index + 1}.
          </Grid>
          <Grid size={{xs: 4, md: 3}}>
            <Tooltip title={'Label'}>
              <Typography>{item.label}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 7, md: 4}}>
            <Tooltip title={'Role'}>
              <Typography>{role?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
            <Tooltip title={'Remarks'}>
              <Typography>{item.remarks}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 1.5}} textAlign={'end'}>
            <Tooltip title='Edit Item'>
              <IconButton size='small' onClick={() => setShowForm(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Item'>
              <IconButton
                size='small'
                onClick={() =>
                  setItems((items) => {
                    const newItems = [...items];
                    newItems.splice(index, 1);
                    return newItems;
                  })
                }
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <ApprovalChainsItemForm 
          setClearFormKey={setClearFormKey} 
          submitMainForm={submitMainForm} 
          setSubmitItemForm={setSubmitItemForm} 
          submitItemForm={submitItemForm} 
          setIsDirty={setIsDirty} 
          item={item} 
          setShowForm={setShowForm} 
          index={index} 
          items={items} 
          setItems={setItems} 
        />
      )}
    </>
  );
};

export default ApprovalChainsItemRow;