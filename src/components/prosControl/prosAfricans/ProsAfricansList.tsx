import JumboListToolbar from "@jumbo/components/JumboList/components/JumboListToolbar";
import JumboRqList from "@jumbo/components/JumboReactQuery/JumboRqList";
import JumboSearch from "@jumbo/components/JumboSearch";
import { Grid, IconButton, Tooltip } from "@mui/material";
import React from "react";
import prosAfricansServices from "./prosAfricansServices";
import ProsAfricansListItem from "./ProsAfricansListItem";
import { AddOutlined } from "@mui/icons-material";
import { useJumboDialog } from "@jumbo/components/JumboDialog/hooks/useJumboDialog";
import ProsAfricansAddNewMemberForm from "./ProsAfricansAddNewMemberForm";
import { useParams } from "next/navigation";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { Div } from "@jumbo/shared";
import { PROS_CONTROL_PERMISSIONS } from "@/utilities/constants/prosControlPermissions";
import { Organization } from "@/types/auth-types";

const ProsAfricansList = () => {
  const params = useParams();
  const { showDialog } = useJumboDialog();
  const { checkPermission, authOrganization } = useJumboAuth();
  const canAdd = checkPermission(PROS_CONTROL_PERMISSIONS.PROSAFRICANS_MANAGE);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: "prosAfricans",
    queryParams: { id: params.id, keywords: "" },
    countKey: "total",
    dataKey: "data",
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params?.id },
    }));
  }, [params]);

  const handleOnChange = React.useCallback(
    (keyword: string) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword: keyword,
        },
      }));
    },
    []
  );

  return (
    <JumboRqList
      service={prosAfricansServices.getUsers}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={5}
      itemsPerPageOptions={[5, 8, 15, 20]}
      renderItem={(user) => <ProsAfricansListItem user={user} />}
      componentElement="div"
      wrapperComponent={Div}
      wrapperSx={{ flex: 1, display: "flex", flexDirection: "column" }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <Grid container spacing={1}>
              <Grid size={{xs: 12, md: canAdd ? 10 : 12, lg: canAdd ? 11 : 12}}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keywords}
                />
              </Grid>
              {canAdd && (
                <Grid size={{xs: 12, md: 2, lg: 1}} textAlign="end">
                  <Tooltip title="Add Members">
                    <IconButton
                      onClick={() =>
                        showDialog({
                          title: "Add Members",
                          content: (
                            <ProsAfricansAddNewMemberForm/>
                          ),
                        })
                      }
                    >
                      <AddOutlined />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          }
        />
      }
    />
  );
};

export default ProsAfricansList;
