"use client";

import React from "react";
import { Grid, TextField, Button, IconButton, Box } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import * as yup from "yup";
import LedgerSelect from "@/components/accounts/ledgers/forms/LedgerSelect";
import { Station } from "./StationType";
import { useLedgerSelect } from "@/components/accounts/ledgers/forms/LedgerSelectProvider";

interface Ledger {
  id: number;
  name: string;
  code?: string | null;
  ledger_group_id?: number;
  alias?: string | null;
  nature_id?: number; 
}

export const shiftTeamSchema = yup.object({
  shift_teams: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required("Team name is required"),
        Ledger: yup
          .array()
          .of(yup.object({
            id: yup.number().required(),
            name: yup.string().required(),
          }))
          .min(1, "At least one ledger is required")
          .required("At least one ledger is required"),
        description: yup.string().nullable().optional(),
      })
    )
});

export type ShiftFormData = yup.InferType<typeof shiftTeamSchema>;

interface ShiftTeamTabProps {
  station?: Station;
}

const ShiftTeamTab: React.FC<ShiftTeamTabProps> = ({ station }) => {
  const { control, formState: { errors }, watch } = useFormContext<ShiftFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shift_teams",
  });
  
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const shiftTeams = watch("shift_teams");

  const getFieldError = (index: number, fieldName: string) => {
    return (errors as any)?.shift_teams?.[index]?.[fieldName];
  };

  return (
    <Box sx={{ width: "100%" }}>
      {fields.map((field, index) => {
        return (
          <Grid container spacing={1} key={field.id} sx={{ mb: 2 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5.5}}>
              <Controller
                name={`shift_teams.${index}.name`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ""}
                    fullWidth
                    label="Team Name"
                    size="small"
                    error={!!getFieldError(index, "name")}
                    helperText={getFieldError(index, "name")?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 5.5 }}>
              <Controller
                name={`shift_teams.${index}.Ledger`}
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <LedgerSelect
                    multiple
                    label="Ledgers"
                    defaultValue={
                      (field.value || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code ?? null,
                        ledger_group_id: item.ledger_group_id ?? undefined,
                        alias: item.alias ?? null,
                        nature_id: item.nature_id ?? undefined,
                      }))
                    }
                    onChange={(newValue) => {
                      field.onChange(Array.isArray(newValue) ? newValue : []);
                    }}
                    frontError={getFieldError(index, "Ledger")}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              {fields.length > 1 && (
                <IconButton onClick={() => remove(index)} color="error" sx={{ mt: 0.5 }}>
                  <Delete />
                </IconButton>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 11 }}>
              <Controller
                name={`shift_teams.${index}.description`}
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ""}
                    fullWidth
                    label="Description"
                    size="small"
                    multiline
                    rows={1}
                    placeholder="description"
                    error={!!getFieldError(index, "description")}
                    helperText={getFieldError(index, "description")?.message}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : e.target.value;
                      field.onChange(value);
                    }}
                  />
                )}
              />
            </Grid>

           
          </Grid>
        );
      })}
      
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => append({ 
            name: "", 
            Ledger: [], 
            description: null
          })}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default ShiftTeamTab;