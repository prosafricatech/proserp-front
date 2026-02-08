"use client";

import React from "react";
import axios from "@/lib/services/config";
import { JumboDdMenu } from "@jumbo/components";
import { useJumboDialog } from "@jumbo/components/JumboDialog/hooks/useJumboDialog";
import JumboGridItem from "@jumbo/components/JumboList/components/JumboGridItem";
import JumboListItem from "@jumbo/components/JumboList/components/JumboListItem";
import { Span } from "@jumbo/shared";
import {
  AlternateEmailOutlined,
  MoreHorizOutlined,
  PersonAddOutlined,
  PhoneOutlined,
  RemoveCircle,
  VerifiedUser,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { Stack, styled } from "@mui/system";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { MenuItemProps } from "@jumbo/types";
import { Organization } from "@/types/auth-types";

type InvitationListItemProps = {
  organization: Organization;
  view: "grid" | "list";
};

const Item = styled(Span)(({ theme }) => ({
  minWidth: 0,
  flexGrow: 0,
  padding: theme.spacing(0, 1),
}));

const InvitationListItem: React.FC<InvitationListItemProps> = ({
  organization,
  view,
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const statusColor: "primary" | "success" | "error" | "default" | "secondary" =
    "primary";

  const respondToInvitation = async (response: boolean) => {
    try {
      await axios.get("/sanctum/csrf-cookie");
      const res = await axios.put(`/api/invitations/${organization.id}/respond`, {
        response,
      });

      enqueueSnackbar(res?.data?.message ?? "Response recorded", {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    }
  };

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case "accept":
        showDialog({
          variant: "confirm",
          title: `Accept Invitation?`,
          content: `This will add ${organization.name} to your organizations list.`,
          onYes: () => {
            hideDialog();
            respondToInvitation(true);
          },
          onNo: hideDialog,
        });
        break;

      case "decline":
        showDialog({
          variant: "confirm",
          title: `Decline joining ${organization.name}?`,
          content:
            "An inviter will have to reinvite you next time you need to join!",
          onYes: () => {
            hideDialog();
            respondToInvitation(false);
          },
          onNo: hideDialog,
        });
        break;

      default:
        break;
    }
  };

  const ItemAction = () => (
    <JumboDdMenu
      icon={<MoreHorizOutlined />}
      menuItems={[
        {
          icon: <PersonAddOutlined color="success" />,
          title: "Accept",
          action: "accept",
        },
        {
          icon: <RemoveCircle color="error" />,
          title: "Decline",
          action: "decline",
        },
      ]}
      onClickCallback={handleItemAction}
    />
  );

  if (view === "grid") {
    return (
      <JumboGridItem xs={12} lg={4}>
        <Card variant="outlined" elevation={0}>
          <CardHeader
            avatar={
              <Avatar
                sx={{ width: 48, height: 48 }}
                alt={organization.name}
                src={organization?.logo_path ?? ""}
              />
            }
            action={<ItemAction />}
            title={
              <Typography variant="h6" color="text.primary" mb={0.25}>
                {organization.name}
              </Typography>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Divider sx={{ mb: 2 }} />
            <List disablePadding>
              <ListItem sx={{ px: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 50 }}>
                  <AlternateEmailOutlined />
                </ListItemIcon>
                <ListItemText primary={organization.email} />
              </ListItem>
              <ListItem sx={{ px: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 50 }}>
                  <PhoneOutlined />
                </ListItemIcon>
                <ListItemText primary={organization.phone} />
              </ListItem>
              <Tooltip title="Status">
                <ListItem sx={{ px: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 50 }}>
                    <VerifiedUser color={statusColor} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Chip
                        size="small"
                        label={organization.status}
                        color={statusColor}
                      />
                    }
                  />
                </ListItem>
              </Tooltip>
            </List>
          </CardContent>
        </Card>
      </JumboGridItem>
    );
  }

  return (
       <Box
            sx={{
                cursor: "pointer",
                borderTop: 1,
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
            }}
        >
            <JumboListItem
                componentElement="div"
                itemData={organization}
                secondaryAction={<ItemAction />}
            >
                <ListItemAvatar>
                    <Avatar alt={organization.name} src={organization?.logo_path ?? ""} />
                </ListItemAvatar>
                <ListItemText
                    primary={
                    <Typography variant="body1" component="div">
                        <Stack direction="row" alignItems="center" sx={{ minWidth: 0 }}>
                        <Tooltip title="Organization Name">
                            <Item
                            sx={{
                                flexBasis: { xs: "100%", sm: "50%", md: "25%" },
                            }}
                            >
                            <Typography
                                variant="h5"
                                fontSize={14}
                                lineHeight={1.25}
                                mb={0}
                                noWrap
                            >
                                {organization.name}
                            </Typography>
                            <Typography
                                variant="body1"
                                noWrap
                                color="text.secondary"
                                sx={{ display: { sm: "none" } }}
                            >
                                {organization.email}
                            </Typography>
                            </Item>
                        </Tooltip>
                        <Tooltip title="Email">
                            <Item
                            sx={{
                                flexBasis: { sm: "50%", md: "28%" },
                                display: { xs: "none", sm: "block" },
                            }}
                            >
                            <Typography variant="body1" noWrap>
                                {organization.email}
                            </Typography>
                            </Item>
                        </Tooltip>
                        <Tooltip title="Phone">
                            <Item
                            sx={{
                                flexBasis: { md: "25%" },
                                display: { xs: "none", md: "block" },
                            }}
                            >
                            <Typography variant="body1" noWrap>
                                {organization.phone}
                            </Typography>
                            </Item>
                        </Tooltip>
                        <Tooltip title="Status">
                            <Item
                            sx={{
                                flexBasis: { md: "22%" },
                                display: { xs: "none", md: "block" },
                            }}
                            >
                            <Chip
                                size="small"
                                label={organization.status}
                                color={statusColor}
                            />
                            </Item>
                        </Tooltip>
                        </Stack>
                    </Typography>
                    }
                />
            </JumboListItem>
        </Box>

  );
};

export default InvitationListItem;
