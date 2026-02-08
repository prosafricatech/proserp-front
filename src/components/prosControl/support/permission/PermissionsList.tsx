"use client";

import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { Stack } from "@mui/material";
import { useParams } from "next/navigation";
import JumboListToolbar from "@jumbo/components/JumboList/components/JumboListToolbar";
import JumboRqList from "@jumbo/components/JumboReactQuery/JumboRqList";
import JumboSearch from "@jumbo/components/JumboSearch";
import { Div } from "@jumbo/shared";
import supportServices from "../support-services";
import PermissionsActionTail from "./PermissionsActionTail";
import PermissionsListItem from "./PermissionsListItem";
import { SelectedTab } from "../troubleshooting/Troubleshooting";

// ---- Types ----
interface QueryOptions {
  queryKey: string;
  queryParams: {
    id: string | string[] | undefined;
    keyword: string;
  };
  countKey: string;
  dataKey: string;
}

interface Module {
  id: string | number;
  name: string;
}

export interface Permission {
  id: string | number;
  name: string;
  description: string;
  is_core: boolean;
  modules: Module[];
}

const PermissionsList: React.FC = () => {
  const params = useParams();
  const listRef = useRef<any>(null);
  const { activeTab } = useContext(SelectedTab);
  const isOrganizationPermission = activeTab === 1;
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: isOrganizationPermission
      ? "organizationPermissions"
      : "prosPermissions",
    queryParams: { id: params?.id, keyword: "" },
    countKey: "total",
    dataKey: "data",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params?.id },
    }));
  }, [params]);

  const renderPermission = useCallback(
    (permission: Permission) => <PermissionsListItem permission={permission} />,
    []
  );

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword,
      },
    }));
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  return (
    <React.Fragment>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Div}
        service={
          isOrganizationPermission
            ? supportServices.permissionsList
            : supportServices.prosPermissionList
        }
        primaryKey={"id"}
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[8, 10, 15, 20, 30, 50, 100]}
        renderItem={renderPermission}
        componentElement={"div"}
        wrapperSx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Stack direction="row">
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                <PermissionsActionTail />
              </Stack>
            }
          />
        }
      />
    </React.Fragment>
  );
};

export default PermissionsList;
