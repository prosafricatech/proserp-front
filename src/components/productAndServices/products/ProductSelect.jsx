import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Checkbox,
  Chip,
  TextField,
  Box,
  Typography,
  Avatar,
  useTheme,
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useProductsSelect } from "./ProductsSelectProvider";

// const ProductThumbnail = ({ name, imageUrl, size = 64 }) => {
//   const theme = useTheme();
//   const letter = name?.charAt(0)?.toUpperCase() || "?";
//   const [hovered, setHovered] = useState(false);

//   const canHover = Boolean(imageUrl);

//   return (
//     <Box
//       sx={{
//         width: hovered && canHover ? size + 50 : size,
//         height: hovered && canHover ? size + 50 : size,
//         mr: 2,
//         transition: "all 0.25s ease",
//         flexShrink: 0,
//       }}
//     >
//       <Avatar
//         variant="square"
//         alt={name}
//         src={imageUrl || undefined}
//         onMouseEnter={() => canHover && setHovered(true)}
//         onMouseLeave={() => setHovered(false)}
//         sx={{
//           width: "100%",
//           height: "100%",
//           overflow: "hidden",

//           cursor: canHover ? "pointer" : "default",

//           bgcolor:
//             theme.type === "dark"
//               ? theme.palette.grey[800]
//               : theme.palette.grey[200],

//           color:
//             theme.type === "dark"
//               ? theme.palette.grey[100]
//               : theme.palette.grey[800],

//           border: "1px solid",
//           borderColor: theme.palette.divider,
//           fontSize: size * 0.45,

//           "& img": {
//             width: "100%",
//             height: "100%",
//             objectFit: "cover",
//           },
//         }}
//         imgProps={{
//           onError: (e) => {
//             e.currentTarget.style.display = "none";
//           },
//         }}
//       >
//         {!imageUrl && letter}
//       </Avatar>
//     </Box>
//   );
// };

function ProductSelect(props) {
  const {
    frontError = null,
    label = "Select Product",
    excludeIds = [],
    multiple = false,
    startAdornment,
    requiredProducts,
    addedProduct = null,
    defaultValue = null,
    disabled = false,
    readOnly = false,
    onChange,
  } = props;
  const { productOptions } = useProductsSelect();

  const [selectedItems, setSelectedItems] = useState(
    defaultValue ?? (multiple ? [] : null)
  );

  useEffect(() => {
    if (defaultValue !== null) {
      setSelectedItems(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (!addedProduct) return;

    const value = multiple ? [addedProduct] : addedProduct;
    setSelectedItems(value);
    onChange?.(value);
  }, [addedProduct, multiple, onChange]);

  const finalOptions = useMemo(() => {
    let opts = productOptions.filter(
      (p) =>
        !excludeIds.includes(p.id) &&
        p.id !== addedProduct?.id
    );

    if (addedProduct?.id) {
      opts = [...opts, addedProduct];
    }

    if (requiredProducts) {
      opts = opts.filter((o) =>
        requiredProducts.some((r) => r.id === o.id)
      );
    }

    return opts;
  }, [productOptions, excludeIds, addedProduct, requiredProducts]);

  const handleOnChange = (_, newValue) => {
    setSelectedItems(newValue);
    onChange?.(newValue);
  };

  return (
    <Autocomplete
      multiple={multiple}
      disabled={disabled}
      readOnly={readOnly}
      options={finalOptions}
      value={selectedItems}
      disableCloseOnSelect={multiple}
      onChange={handleOnChange}
      getOptionLabel={(o) => o?.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;

        return (
          <li {...rest} key={`${option.id}-${key}`}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                // minHeight: 80,
                py: 1,
              }}
            >
              {multiple && (
                <Checkbox
                  icon={<CheckBoxOutlineBlank fontSize="small" />}
                  checkedIcon={<CheckBox fontSize="small" />}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
              )}

              {/* <ProductThumbnail
                name={option.name}
                imageUrl={option.image_url}
                size={64}
              /> */}

              <Box>
                <Typography 
                  variant="body1" 
                  // fontWeight={500}
                >
                  {option.name}
                </Typography>

                {/* {option.type && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {option.type}
                  </Typography>
                )} */}
              </Box>
            </Box>
          </li>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });

          return (
            <Chip
              {...rest}
              key={`${option.id}-${key}`}
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {/* <ProductThumbnail
                    name={option.name}
                    imageUrl={option.image_url}
                    size={36}
                  /> */}
                  {option.name}
                </Box>
              }
              size="medium"
              sx={{
                borderRadius: 1,
                "& .MuiChip-label": {
                  display: "flex",
                  alignItems: "center",
                  pl: 0.5,
                },
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && (
                  <Box sx={{ mr: 0.5 }}>
                    {startAdornment}
                  </Box>
                )}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default ProductSelect;
