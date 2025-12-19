"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import UsersSelector from "@/components/sharedComponents/UsersSelector";
import StationTabs from "./StationTabs";
import stationServices from "./station-services";
import type { AddStationResponse, Station, UpdateStationResponse } from "./StationType";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import { User } from "@/components/prosControl/userManagement/UserManagementType";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface StationFormProps {
  station?: Station;
  setOpenDialog: (open: boolean) => void;
}

interface Ledger {
  id: number;
  name: string;
  alias?: string | null;
  ledger_group_id: number;
}

interface ShiftTeamFormData {
  name: string;
  Ledger: Ledger[];
  description?: string | null;
}

interface FuelPumpFormData {
  product_id: number | null;
  product_name?: string;
  name: string;
  tank_id: number | null;
}

interface FormData {
  id?: number;
  name: string;
  address?: string;
  users: User[];
  shift_teams: ShiftTeamFormData[];
  fuel_pumps: FuelPumpFormData[];
}

const validationSchema = yup.object({
  name: yup.string().required("Station name is required"),
  address: yup.string().nullable().optional(),
  users: yup.array().of(
    yup.object({
      id: yup.number().required(),
      name: yup.string().required(),
    })
  ).optional(),
  shift_teams: yup.array().of(
    yup.object({
      name: yup.string().required("Team name is required"),
      Ledger: yup.array()
        .of(yup.object({
          id: yup.number().required(),
          name: yup.string().required(),
        }))
        .min(1, "At least one ledger is required")
        .required("Ledger accounts are required"),
      description: yup.string().nullable().optional(),
    })
  ).min(1, "At least one shift team is required"),
  fuel_pumps: yup.array().of(
    yup.object({
      product_id: yup.number()
        .nullable()
        .required("Fuel name is required")
        .typeError("Fuel name is required"),
      product_name: yup.string().optional(),
      name: yup.string().required("Pump name is required"),
      tank_id: yup.number()
        .nullable()
        .required("Tank name is required")
        .typeError("Tank name is required"),
    })
  ).min(1, "At least one fuel pump is required"),
});

const StationForm: React.FC<StationFormProps> = ({ station, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

  // State to track current active tab
  const [activeTab, setActiveTab] = useState<number>(0);

  const defaultValues = useMemo(() => {
    return {
      id: station?.id,
      name: station?.name ?? "",
      address: station?.address ?? "",
      users: station?.users ?? [],
      
      shift_teams: station?.shift_teams?.length ? station.shift_teams.map(team => {
        const ledgers = Array.isArray(team.ledgers) ? team.ledgers.map(ledger => ({
          id: ledger.id,
          name: ledger.name,
          code: ledger.code || null,
          ledger_group_id: ledger.ledger_group_id || 0,
          alias: ledger.alias || null,
          nature_id: ledger.nature_id
        })) : [];
        
        return {
          name: team.name || "",
          Ledger: ledgers,
          description: team.description || null,
        };
      }) : [{ name: "", Ledger: [], description: null }],
      
      fuel_pumps: station?.fuel_pumps?.length ? station.fuel_pumps.map(pump => ({
        product_id: pump.product_id ?? null,
        product_name: pump.product?.name ?? "",
        name: pump.name || "",
        tank_id: pump.tank_id ?? null,
      })) : [{ 
        product_id: null, 
        product_name: "",
        name: "", 
        tank_id: null 
      }],
    };
  }, [station]);

  const methods = useForm<FormData>({
    defaultValues: defaultValues as unknown as FormData,
    resolver: yupResolver(validationSchema) as any,
  });

  const { register, handleSubmit, control, formState: { errors } } = methods;

  const { mutate: addStation, isPending: addLoading } = useMutation<
    AddStationResponse,
    unknown,
    Station
  >({
    mutationFn: stationServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["station"] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = "Something went wrong";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.message === "string"
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const { mutate: updateStation, isPending: updateLoading } = useMutation<
    UpdateStationResponse,
    unknown,
    Station & { id: number }
  >({
    mutationFn: stationServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["station"] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = "Something went wrong";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.message === "string"
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const saveMutation = useMemo(
    () => (station?.id ? updateStation : addStation),
    [station, updateStation, addStation]
  );

  const onSubmit = (formData: FormData) => {
    const validShifts = formData.shift_teams
      ?.filter(team => team.name?.trim() && team.Ledger?.length > 0)
      ?.map(team => ({
        name: team.name.trim(),
        ledger_ids: team.Ledger.map(ledger => ledger.id),
        description: team.description?.trim() || null,
      })) || [];

    const validFuelPumps = formData.fuel_pumps
      ?.filter(pump => pump.name?.trim() && pump.tank_id && pump.product_id)
      ?.map(pump => ({
        name: pump.name.trim(),
        tank_id: pump.tank_id,
        product_id: pump.product_id,
      })) || [];

    if (validShifts.length === 0) {
      enqueueSnackbar("At least one valid shift team is required", { variant: "error" });
      return;
    }

    if (validFuelPumps.length === 0) {
      enqueueSnackbar("At least one valid fuel pump is required", { variant: "error" });
      return;
    }

    const dataToSend = {
      name: formData.name.trim(),
      address: formData.address?.trim() || null,
      user_ids: formData.users?.map((user: User) => user.id) ?? [],
      shift_teams: validShifts,
      fuel_pumps: validFuelPumps,
      ...(station?.id ? { id: station.id } : {}),
    };
    
    saveMutation(dataToSend as any);
  };

  // Handle tab change
  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle next button click
  const handleNext = () => {
    setActiveTab(1); // Move to Fuel Pump tab
  };

  // Handle previous button click
  const handlePrevious = () => {
    setActiveTab(0); // Move back to Shift Team tab
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
                {station ? `Edit ${station.name}` : "New Fuel Station"}
              </Typography>
            </Grid>

            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Station Name"
                size="small"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                required
              />
            </Grid>

            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Address"
                size="small"
                {...register("address")}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Grid>

            <Grid size={{xs:12, md:6}}>
              <Controller
                name="users"
                control={control}
                render={({ field }) => (
                  <UsersSelector
                    multiple
                    defaultValue={field.value || []}
                    onChange={(users) => field.onChange(users || [])}
                    frontError={errors.users}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogTitle>

        <DialogContent>
          <StationTabs 
            station={station} 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} size="small">
            Cancel
          </Button>
          
         {/* Previous Button with Back Arrow - Only show on Fuel Pump tab (tab index 1) */}
          {activeTab === 1 && (
            <Button 
              onClick={handlePrevious}
              size="small"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              Previous
            </Button>
          )}
          
          {/* Next Button with Forward Arrow - Only show on Shift Team tab (tab index 0) */}
          {activeTab === 0 ? (
            <Button 
              onClick={handleNext}
              size="small"
              variant="outlined" // Changed to outlined to match Previous button
              endIcon={<ArrowForwardIcon />} // Forward arrow at the end
            >
              Next
            </Button>
          ) : (
            /* Submit Button - Only show on Fuel Pump tab (tab index 1) */
            <LoadingButton
              type="submit"
              variant="contained"
              size="small"
              loading={addLoading || updateLoading}
              disabled={!canCreateOrEdit}
            >
              Submit
            </LoadingButton>
          )}
        </DialogActions>
      </form>
    </FormProvider>
  );
};

export default StationForm;