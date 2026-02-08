import React from 'react';
import { Stack, Chip, ChipProps, StackProps } from "@mui/material";
import { colorForBgColor } from '@jumbo/utilities/styleHelpers';
import { getArrayElementFromKey } from '@jumbo/utilities/systemHelpers';

type ChipData = {
    label?: string;
    color?: string;
    size?: ChipProps['size'];
    [key: string]: any;
};

type MapKeys = {
    label?: string;
    color?: string;
    size?: string;
};

interface JumboChipsGroupProps extends Omit<StackProps, 'onClick' | 'sx'> {
    chips?: ChipData[];
    max?: number;
    onClick?: (event: React.MouseEvent<HTMLDivElement>, chip: ChipData) => void;
    mapKeys?: MapKeys;
    defaultColor?: string;
    spacing?: number;
    size?: ChipProps['size'];
    chipProps?: Omit<ChipProps, 'label' | 'onClick' | 'size' | 'sx'>;
    stackSx?: StackProps['sx'];
    chipSx?: ChipProps['sx'];
}

const JumboChipsGroup: React.FC<JumboChipsGroupProps> = ({
    chips = [],
    max = -1,
    onClick,
    mapKeys,
    defaultColor = "#DDDDDD",
    spacing = 1,
    size = "medium",
    chipProps,
    stackSx,
    chipSx,
    ...stackProps
}) => {
    const handleClick = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>, chip: ChipData) => {
            if (onClick) {
                onClick(event, chip);
            }
        }, 
        [onClick]
    );

    const chipsToShow = max !== -1 ? chips.slice(0, max) : chips;

    return (
        <Stack 
            direction="row" 
            spacing={spacing} 
            sx={{
                flexWrap: 'wrap',
                gap: spacing,
                ...stackSx
            }}
            {...stackProps}
        >
            {chipsToShow.map((chip, index) => {
                const label = chip?.label ?? getArrayElementFromKey(chip, mapKeys?.label);
                const bgColor = chip?.color ?? defaultColor;
                const color = colorForBgColor(bgColor);
                const chipSize = chip?.size ?? size;

                return (
                    <Chip
                        key={index}
                        label={label}
                        size={chipSize}
                        sx={{
                            bgcolor: bgColor,
                            color: color,
                            ...chipSx,
                        }}
                        onClick={(event) => handleClick(event, chip)}
                        {...chipProps}
                    />
                );
            })}
            {chipsToShow.length < chips.length && (
                <Chip 
                    label={`+${chips.length - chipsToShow.length}`} 
                    size={size}
                    sx={chipSx}
                    {...chipProps}
                />
            )}
        </Stack>
    );
};

export default JumboChipsGroup;