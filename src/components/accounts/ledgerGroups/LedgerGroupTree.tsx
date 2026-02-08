import React from "react";
import { ChevronRightOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Button, LinearProgress } from "@mui/material";
import JumboCardQuick from "@jumbo/components/JumboCardQuick";
import TreeItemLabel from "./TreeItemLabel";
import { useLedgerGroup } from "./LedgerGroupProvider";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { Div } from "@jumbo/shared";

export interface TreeNode {
  id: number;
  name: string;
  is_editable: number;
  children?: TreeNode[];
  ledger_group_id?: number | null;
  code?: string | null;
  alias?: string | null;
  description?: string;
  nature_id?: number;
  original_name?: string;
}

export default function LedgerGroupTree() {
  const { ledgerGroups, isLoading, ledgerGroupOptionIds } = useLedgerGroup();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleItemToggle = (event: React.SyntheticEvent<Element, Event> | null, itemIds: string[]) => {
    setExpandedItems(itemIds);
  };

  const handleExpandClick = () => {
    setExpandedItems((prev) => (prev.length === 0 ? ledgerGroupOptionIds : []));
  };

  const renderTree = (nodes: TreeNode[] = []) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id.toString()}
        itemId={node.id.toString()}
        label={<TreeItemLabel node={node} />}
        sx={{
          '& .MuiTreeItem-content': {
            paddingLeft: (theme) => theme.spacing(2), // Base indentation
            '&.Mui-expanded > .MuiTreeItem-content': {
              paddingLeft: (theme) => theme.spacing(4), // Increased for expanded children
            },
          },
        }}
      >
        {node.children && node.children.length > 0 ? renderTree(node.children) : null}
      </TreeItem>
    ));
  };

  return (
    <JumboCardQuick sx={{ borderRadius: 2 }}>
      {isLoading ? (
        <LinearProgress />
      ) : (
        <>
          <Div sx={{ mb: 1 }}>
            <Button onClick={handleExpandClick}>
              {expandedItems.length === 0 ? "Expand all" : "Collapse all"}
            </Button>
          </Div>
          <SimpleTreeView
            aria-label="Ledger Group Tree"
            slots={{
              expandIcon: ChevronRightOutlined,
              collapseIcon: ExpandMoreOutlined,
            }}
            expandedItems={expandedItems}
            onExpandedItemsChange={handleItemToggle}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              minHeight: 230,
              '& .MuiTreeItem-root': {
                marginLeft: (theme) => theme.spacing(1),
                '& .MuiTreeItem-root': {
                  marginLeft: (theme) => theme.spacing(2),
                },
              },
              '& .MuiTreeItem-content': {
                padding: "4px 8px",
              },
            }}
          >
            {renderTree(ledgerGroups || [])}
          </SimpleTreeView>
        </>
      )}
    </JumboCardQuick>
  );
}