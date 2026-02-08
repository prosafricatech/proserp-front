import { AddOutlined, ChevronRightOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import StoreForm from '../StoreForm';
import { useStoreProfile } from './StoreProfileProvider';
import SubStoreTreeItemLabel from './SubStoreTreeItemLabel';
import { Div } from '@jumbo/shared';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';

function StoreProfileSidebar() {
  const { mainStore, storeArrays: { storeIds, selectOptions } } = useStoreProfile();
  const storeTree = [mainStore];
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState([String(mainStore?.id)]);

  const handleToggle = (event, ids) => {
    setExpanded(ids);
  };

  const handleExpandClick = () => {
    setExpanded(prev => (prev.length === 0 ? storeIds : []));
  };

  const renderTree = (nodes) =>
    nodes.map((node) => (
      <TreeItem
        key={String(node.id)}
        itemId={String(node.id)}
        label={<SubStoreTreeItemLabel store={node} />}
      >
        {Array.isArray(node.children) ? renderTree(node.children) : null}
      </TreeItem>
    ));

  return (
        <Div sx={{ p: 1.8, width: 240 }}>
            <Div sx={{ mb: 1 }}>
                <Button onClick={handleExpandClick}>
                   {expanded.length === 0 ? 'Expand all' : 'Collapse all'}
                </Button>
            </Div>
                <SimpleTreeView
                    aria-label="Sub-store Tree"
                    expandedItems={expanded}
                    onExpandedItemsChange={handleToggle}
                    sx={{ flexGrow: 1, overflowY: 'scroll', height: 350 }}
                >
                    {renderTree(storeTree)}
                </SimpleTreeView>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    mt: 2,
                }}
            >
                <Dialog maxWidth="xs" open={openDialog} onClose={() => setOpenDialog(false)}>
                    <StoreForm setOpenDialog={setOpenDialog} parentOptions={selectOptions} />
                </Dialog>
                <Tooltip title="Add Sub-store">
                    <Button
                        variant="outlined"
                        size="small"
                        disableElevation
                        sx={{ px: 1 }}
                        onClick={() => setOpenDialog(true)}
                    >
                        <AddOutlined fontSize="small" /> Sub-store
                    </Button>
                </Tooltip>
            </Box>
        </Div>
  );
}

export default StoreProfileSidebar;
