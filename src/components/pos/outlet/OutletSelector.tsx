import posServices from "../pos-services";
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { Outlet } from "./OutletType";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

interface OutletSelectorProps {
  onChange: (newValue: Outlet | Outlet[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: Outlet | Outlet[] | null;
  frontError?: { message?: string } | null;
}

const OutletSelector = ({
  onChange,
  multiple = false,
  label = "Outlet",
  defaultValue = null,
  frontError = null
}: OutletSelectorProps) => {
  const { authUser } = useJumboAuth();

  const { data: rawOutlets = [], isPending } = useQuery({
    queryKey: ["userSalesOutlets", authUser?.user?.id],
    queryFn: ({ queryKey }) =>
      posServices.getUserOutlets({ userId: queryKey[1] }),
    select: (data) =>
      data.map((outlet: any) => ({
        id: outlet.id,
        name: outlet.name,
        address: outlet.address,
        status: outlet.status,
        cost_center: outlet.cost_center,
        counters: outlet.counters,
        stores: outlet.stores
      })),
    enabled: !!authUser?.user?.id
  });

  const allOutlet: any = useMemo(
    () => ({
      id: "all",
      name: "All Outlets",
      address: "",
      status: "active",
      cost_center: null,
      counters: [],
      stores: []
    }),
    []
  );

  const outlets: Outlet[] = useMemo(
    () => [allOutlet, ...rawOutlets],
    [rawOutlets, allOutlet]
  );

  const [selectedOutlet, setSelectedOutlet] =
    useState<Outlet | Outlet[] | null>(null);

  // Initialize selection
  useEffect(() => {
    let newValue: Outlet | Outlet[] | null = null;

    if (defaultValue !== null) {
      newValue = defaultValue;
    } else if (rawOutlets.length === 1) {
      newValue = multiple ? [rawOutlets[0]] : rawOutlets[0];
    } else {
      newValue = multiple ? [allOutlet] : allOutlet;
    }

    const getId = (v: any) =>
      Array.isArray(v) ? v.map((o) => o.id).join(",") : v?.id;

    if (getId(selectedOutlet) !== getId(newValue)) {
      setSelectedOutlet(newValue);
      onChange(newValue);
    }
  }, [defaultValue, multiple, rawOutlets, allOutlet]);

  // Safe normalization (always called before any return)
  const normalizedValue = useMemo(() => {
    if (multiple) {
      return Array.isArray(selectedOutlet) ? selectedOutlet : [];
    }
    return selectedOutlet || null;
  }, [selectedOutlet, multiple]);

  // --- NOW SAFE TO RETURN SOMETHING ---
  if (isPending) return <LinearProgress />;

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      options={outlets}
      disableCloseOnSelect={multiple}
      value={normalizedValue}
      isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
      getOptionLabel={(option: any) => option?.name || ""}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          error={!!frontError}
          helperText={frontError?.message}
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option: any, index) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={`${option.id}-${key}`}
              label={option.name}
            />
          );
        })
      }
      {...(multiple && {
        renderOption: (props, option: any, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                checked={selected}
                style={{ marginRight: 8 }}
              />
              {option.name}
            </li>
          );
        }
      })}
      onChange={(e, newValue) => {
        setSelectedOutlet(newValue);
        onChange(newValue);
      }}
    />
  );
};

export default OutletSelector;
