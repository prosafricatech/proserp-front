"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, Grid, Stack, Typography } from "@mui/material";
import JumboListToolbar from "@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar";
import JumboRqList from "@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList";
import JumboSearch from "@jumbo/components/JumboSearch/JumboSearch";
import prosAfricansServices from "../prosAfricans/prosAfricansServices";
import SubscriptionActionTail from "./SubscriptionActionTail";
import SubscriptionsStatusSelector from "./SubscriptionsStatusSelector";
import { useParams } from "next/navigation";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import SubscriptionItem from "@/components/organizations/profile/subscriptions/SubscriptionItem";
import { PROS_CONTROL_PERMISSIONS } from "@/utilities/constants/prosControlPermissions";
import UnauthorizedAccess from "@/shared/Information/UnauthorizedAccess";
import { Subscription } from "@/components/organizations/profile/subscriptions/SubscriptionTypes";

interface QueryOptions {
  queryKey: string;
  queryParams: {
    id: string;
    status: string;
    keyword: string;
  };
  countKey: string;
  dataKey: string;
}

const Subscriptions: React.FC = () => {
  const params = useParams();
  const listRef = useRef<any>(null);
  const { checkPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  // Ensure id is always a string
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: "subscriptions",
    queryParams: {
      id,
      status: "active",
      keyword: "",
    },
    countKey: "total",
    dataKey: "data",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id },
    }));
  }, [id]);

  const renderSubscription = useCallback(
    (subscription: Subscription) => (
      <SubscriptionItem
        subscription={subscription}
        isFromProsAfricanSubscriptions={true}
      />
    ),
    []
  );

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword },
    }));
  }, []);

  const handleOnStatusChange = useCallback((status: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, status },
    }));
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (
    !checkPermission([
      PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_READ,
      PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    ])
  ) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant="h4" mb={2}>
        Subscriptions
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={prosAfricansServices.getSubscriptionsList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20, 50, 100, 150, 200]}
        renderItem={renderSubscription}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Grid container columnSpacing={1} rowSpacing={1}>
                <Grid size={{ xs: 12, lg: 4 }} alignItems="center">
                  <SubscriptionsStatusSelector
                    value={queryOptions.queryParams.status}
                    onChange={handleOnStatusChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Stack direction="row">
                    <JumboSearch
                      onChange={handleOnChange}
                      value={queryOptions.queryParams.keyword}
                    />
                    <SubscriptionActionTail />
                  </Stack>
                </Grid>
              </Grid>
            }
          />
        }
      />
    </>
  );
};

export default Subscriptions;
