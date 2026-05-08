'use client';

import JumboListToolbar from "@jumbo/components/JumboList/components/JumboListToolbar";
import JumboRqList from "@jumbo/components/JumboReactQuery/JumboRqList";
import JumboSearch from "@jumbo/components/JumboSearch";
import { Card, Grid } from "@mui/material";
import { useRef, useEffect, useCallback, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import LedgerSelectProvider from "../ledgers/forms/LedgerSelectProvider";
import BudgetsListItemInMaters from "./BudgetsListItemInMaters";
import budgetsServices from "./budgets-services";
import BudgetsActionTail from "@/components/projectManagement/projects/profile/budgets/BudgetsActionTail";
import CurrencySelectProvider from "@/components/masters/Currencies/CurrencySelectProvider";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import CostCenterSelector from "@/components/masters/costCenters/CostCenterSelector";
import { CostCenter } from "@/components/masters/costCenters/CostCenterType";
import ProductsSelectProvider from "@/components/productAndServices/products/ProductsSelectProvider";

type BudgetId = number | string;

interface BudgetItem {
    id: BudgetId;
    name: string;
    start_date: string;
    end_date: string;
}

interface QueryParams {
  id?: string;
  keyword: string;
  cost_center_ids: number[] | 'all';
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

interface JumboRqListRef {
  refresh: () => Promise<void>;
}

const Budgets = () => {
  const params = useParams<{ id?: string; keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<JumboRqListRef>(null);
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[]>([]);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'budgets-list',
    queryParams: {
      id: params?.id,
      cost_center_ids:'all',
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        id: params?.id,
        cost_center_ids: checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
                        ? 'all'
                        : authOrganization?.costCenters?.map((cost_center: any) => cost_center.id) || [],
        keyword: searchParams?.get('search') || '',
      },
    }));
  }, [params, searchParams]);

  useEffect(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        cost_center_ids: selectedCostCenter.length
          ? selectedCostCenter.map((costCenter: CostCenter) => costCenter.id)
          : authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id) || [],
      },
    }));
  }, [selectedCostCenter, authOrganization?.costCenters]);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword,
      },
    }));
  }, []);

  const renderBudgetItem = useCallback((budgetItem: BudgetItem) => {
    return <BudgetsListItemInMaters budgetItem={budgetItem} />;
  }, []);

  const multiCostCenters = (authOrganization?.costCenters?.length || 0) > 1;

  return (
    <LedgerSelectProvider>
      <CurrencySelectProvider>
        <ProductsSelectProvider>
          <JumboRqList
            ref={listRef}
            wrapperComponent={Card}
            queryOptions={queryOptions}
            primaryKey="id"
            service={budgetsServices.getBudgets}
            renderItem={renderBudgetItem}
            itemsPerPage={10}
            itemsPerPageOptions={[10, 15, 30, 60]}
            componentElement="div"
            wrapperSx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
            toolbar={
              <JumboListToolbar
                hideItemsPerPage
                action={
                  <Grid container columnSpacing={1} rowSpacing={1} direction="row" alignItems="center">
                    {multiCostCenters && (
                      <Grid size={{xs: 12, md: 5, lg: 7}}>
                        <CostCenterSelector
                          label="Cost Centers"
                          allowSameType={true}
                          defaultValue={selectedCostCenter}
                          onChange={(newValue: CostCenter | CostCenter[] | null) => {
                            if (newValue === null) {
                              setSelectedCostCenter([]);
                            } else {
                              setSelectedCostCenter(Array.isArray(newValue) ? newValue : [newValue]);
                            }
                          }}
                        />
                      </Grid>
                    )}
                    <Grid size={{xs: 10.5, md: multiCostCenters ? 6 : 5.5, lg: multiCostCenters ? 4 : 10.5}}>
                      <JumboSearch
                        onChange={handleOnChange}
                        value={queryOptions.queryParams.keyword}
                      />
                    </Grid>
                    <Grid size={{xs: 1.5, md: 1, lg: 1}}>
                      <BudgetsActionTail isProjectBudget={false}/>
                    </Grid>
                  </Grid>
                }
              />
            }
          />
        </ProductsSelectProvider>
      </CurrencySelectProvider>
    </LedgerSelectProvider>
  );
};

export default Budgets;
