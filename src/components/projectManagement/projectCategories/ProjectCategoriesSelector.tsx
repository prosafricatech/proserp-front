import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Chip,
  LinearProgress,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import projectCategoryServices from "../projectCategories/project-category-services";
import { ProjectCategory } from "../projectCategories/ProjectCategoriesType";

interface ProjectCategoriesSelectorProps {
  onChange: (value: ProjectCategory | null) => void;
  label?: string;
  defaultValue?: number | ProjectCategory | null; // can be ID or full object
  frontError?: { message: string } | null;
}

const ProjectCategoriesSelector: React.FC<ProjectCategoriesSelectorProps> = ({
  onChange,
  label = "Project Category",
  defaultValue = null,
  frontError = null,
}) => {
  const { data: categories, isLoading } = useQuery<ProjectCategory[], Error>({
    queryKey: ["projectCategories"],
    queryFn: () => projectCategoryServices.getAll(),
  });

  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null);

  useEffect(() => {
    if (categories && defaultValue) {
      if (typeof defaultValue === "object") {
        setSelectedCategory(defaultValue);
      } else {
        const match = categories.find((cat) => cat.id === defaultValue);
        setSelectedCategory(match ?? null);
      }
    }
  }, [categories, defaultValue]);

  if (isLoading) return <LinearProgress />;

  return (
    <Autocomplete
      options={categories ?? []}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.name ?? ""}
      value={selectedCategory}
      onChange={(_, newValue) => {
        onChange(newValue);
        setSelectedCategory(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          fullWidth
          error={!!frontError}
          helperText={frontError?.message}
        />
      )}
    />
  );
};

export default ProjectCategoriesSelector;
