import { SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

export interface ContentLayoutContext {
    header: {
        spreadOut: boolean;
        sx?: SxProps<Theme>;
    };
    footer: {
        spreadOut: boolean;
        sx?: SxProps<Theme>;
    };
    sidebar?: {
        sx?: SxProps<Theme>;
    };
    root?: {
        sx?: SxProps<Theme>;
    };
    content?: {
        sx?: SxProps<Theme>;
    };
    main?: {
        sx?: SxProps<Theme>;
    }
    setContentLayout: (options: LayoutOptions) => void;
}

export interface LayoutOptions {
    header?: {
        spreadOut?: boolean;
        sx?: SxProps<Theme>;
    };
    footer?: {
        spreadOut?: boolean;
        sx?: SxProps<Theme>;
    };
    sidebar?: {
        sx?: SxProps<Theme>;
    };
    wrapper?: {
        component?: React.ElementType;
        sx?: SxProps<Theme>;
    };
    root?: {
        sx?: SxProps<Theme>;
    };
    content?: {
        sx?: SxProps<Theme>;
    };
}

export interface JumboContentLayoutProps {
    header?: ReactNode;
    footer?: ReactNode;
    sidebar?: ReactNode;
    children: ReactNode;
    layoutOptions?: LayoutOptions;
}