import stationServices from "./station-services";
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useEffect, useState } from "react";
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

  // Get user ID
  const getUserId = () => {
    return authUser?.user?.id || null;
  };

  const userId = getUserId();

  const { data: stations = [], isPending } = useQuery({
    queryKey: ["userStations", userId],
    queryFn: ({ queryKey }) => {
      const userId = queryKey[1];
      if (!userId) {
        return [];
      }
      console.log('🔄 Fetching stations for user:', userId);
      // PASS USER ID to the service
      return stationServices.getUserStations({ userId });
    },
    select: (data) => {
      console.log('📊 Raw stations data:', data);
      return Array.isArray(data) ? data.map((station: any) => ({
        id: station.id,
        name: station.name,
        address: station.address,
        description: station.description,
        users: station.users,
        shift_teams: station.shift_teams,
        fuel_pumps: station.fuel_pumps,
        ledger: station.ledger,
        product: station.product
      })) : [];
    },
    enabled: !!userId // Only enable if userId exists
  });

  const [selectedStation, setSelectedStation] = useState<Station | Station[] | null>(null);

  useEffect(() => {
    let newValue: Station | Station[] | null = null;

    if (defaultValue !== null) {
      newValue = defaultValue;
    } else if (stations.length === 1 && !multiple) {
      newValue = stations[0];
    } else if (stations.length > 0 && multiple) {
      newValue = [...stations];
    } else {
      newValue = multiple ? [] : null;
    }

    console.log('🎯 Setting selected station:', newValue);
    setSelectedStation(newValue);
    onChange(newValue);
  }, [defaultValue, multiple, stations]);

  if (isPending) {
    return <LinearProgress />;
  }

  console.log('🎪 Available stations for dropdown:', stations);

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
        console.log('🔄 Station selection changed:', newValue);
        setSelectedStation(newValue);
        onChange(newValue);
      }}
    />
  );
};

export default StationSelector;