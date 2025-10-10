import stationServices from "./station-services";
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { Station } from "./StationType";

interface StationSelectorProps {
  onChange: (newValue: Station | Station[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: Station | Station[] | null;
  frontError?: {
    message?: string;
  } | null;
}

const StationSelector = ({
  onChange,
  multiple = false,
  label = "Station",
  defaultValue = null,
  frontError = null
}: StationSelectorProps) => {
  const { authUser } = useJumboAuth();

  const { data: rawStations = [], isPending } = useQuery({
    queryKey: ["userStations", authUser?.user?.id],
    queryFn: ({ queryKey }) =>
      stationServices.getUserStations({ userId: queryKey[1] }),
    select: (data) =>
      data.map((station: any) => ({
        id: station.id,
        name: station.name,
        address: station.address,
        description: station.description,
        users: station.users,
        shift_teams: station.shift_teams,
        fuel_pumps: station.fuel_pumps,
        ledger: station.ledger,
        product: station.product
      })),
    enabled: !!authUser?.user?.id
  });

  const allStation: any = useMemo(
    () => ({
      id: "all",
      name: "All Stations",
      address: "",
      description: "",
      users: [],
      shift_teams: [],
      fuel_pumps: [],
      ledger: [],
      product: []
    }),
    []
  );

  const stations: Station[] = useMemo(() => [allStation, ...rawStations], [rawStations, allStation]);

  const [selectedStation, setSelectedStation] = useState<Station | Station[] | null>(null);

  useEffect(() => {
    let newValue: Station | Station[] | null = null;

    if (defaultValue !== null) {
      newValue = defaultValue;
    } else if (rawStations.length === 1) {
      newValue = multiple ? [rawStations[0]] : rawStations[0];
    } else {
      newValue = multiple ? [allStation] : allStation;
    }

    const getId = (v: any) => (Array.isArray(v) ? v.map((o) => o.id).join(",") : v?.id);

    if (getId(selectedStation) !== getId(newValue)) {
      setSelectedStation(newValue);
      onChange(newValue);
    }
  }, [defaultValue, multiple, rawStations, allStation]);

  if (isPending) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      options={stations}
      disableCloseOnSelect={multiple}
      value={selectedStation}
      getOptionLabel={(option: Station) => option?.name || ""}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!!frontError}
          helperText={frontError?.message}
          fullWidth
          label={label}
          size="small"
          placeholder={label}
        />
      )}
      renderTags={(tagValue: Station[], getTagProps) =>
        tagValue.map((option, index) => {
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
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
          option: Station,
          { selected }
        ) => {
          const { key, ...otherProps } = props;
          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          );
        }
      })}
      onChange={(e, newValue) => {
        setSelectedStation(newValue);
        onChange(newValue);
      }}
    />
  );
};

export default StationSelector;