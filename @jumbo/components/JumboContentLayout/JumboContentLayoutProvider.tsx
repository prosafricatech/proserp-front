import React from 'react';
import config from "@jumbo/config";
import JumboContentLayoutContext from "./JumboContentLayoutContext";
import { CONTENT_LAYOUT_ACTIONS } from './utils/constants';
import { SxProps, Theme } from '@mui/material';
import { DENSITIES, LAYOUT_CONTAINER_STYLES, POSITION_TYPES } from '@jumbo/utilities/constants';

interface ContentLayoutOptions {
    base: {
        density: DENSITIES;
    };
    root: {
        container: LAYOUT_CONTAINER_STYLES;
        sx: SxProps<Theme>;
    };
    wrapper: {
        sx: SxProps<Theme>;
    };
    sidebar: {
        type: POSITION_TYPES;
        width: number;
        minWidth: number;
        open: boolean;
        sx: SxProps<Theme>;
    };
    header: {
        type: POSITION_TYPES;
        spreadOut: boolean;
        sx: SxProps<Theme>;
    };
    content: {
        sx: SxProps<Theme>;
    };
    footer: {
        type: POSITION_TYPES;
        spreadOut: boolean;
        sx: SxProps<Theme>;
    };
    main: {
        sx: SxProps<Theme>;
    };
}

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface ContentLayoutAction {
    type: string;
    payload?: DeepPartial<ContentLayoutOptions>;
}

interface JumboContentLayoutProviderProps {
    layoutOptions?: DeepPartial<ContentLayoutOptions>;
    children?: React.ReactNode;
}

const getDefaultLayoutOptions = (): ContentLayoutOptions => ({
    base: { density: DENSITIES.STANDARD },
    root: { container: LAYOUT_CONTAINER_STYLES.FLUID, sx: {} },
    wrapper: { sx: {} },
    sidebar: { 
        type: POSITION_TYPES.DEFAULT,
        width: 250,
        minWidth: 80,
        open: true,
        sx: {}
    },
    header: {
        type: POSITION_TYPES.DEFAULT,
        spreadOut: true,
        sx: {}
    },
    footer: {
        type: POSITION_TYPES.DEFAULT,
        spreadOut: true,
        sx: {}
    },
    content: { sx: {} },
    main: { sx: {} }
});

const mergeOptions = <T extends { sx?: any }>(
    defaultOptions: T,
    configOptions?: Partial<T>,
    layoutOptions?: Partial<T>
  ): T => {
    return {
      ...defaultOptions,
      ...configOptions,
      ...layoutOptions,
      sx: {
        ...defaultOptions.sx,
        ...configOptions?.sx,
        ...layoutOptions?.sx,
      }
    };
};
  

const mergeReducerOptions = <T extends { sx?: any }>(
    current: T,
    update?: Partial<T>
  ): T => {
    if (!update) return current;
    return {
      ...current,
      ...update,
      sx: {
        ...current.sx,
        ...update?.sx,
      }
    };
};

let initialSetup: ContentLayoutOptions = getDefaultLayoutOptions();

const init = (layoutOptions: DeepPartial<ContentLayoutOptions> = {}): ContentLayoutOptions => {
    const defaultOptions = getDefaultLayoutOptions();
    const defaultConfig = config?.defaultContentLayout || {};
  
    initialSetup = {
        base: {
            density: layoutOptions.base?.density
                ?? defaultConfig.base?.density
                ?? defaultOptions.base.density,
            },
        root: mergeOptions(defaultOptions.root, defaultConfig.root, layoutOptions.root),
        wrapper: mergeOptions(defaultOptions.wrapper, defaultConfig.wrapper, layoutOptions.wrapper),
        header: mergeOptions(defaultOptions.header, defaultConfig.header, layoutOptions.header),
        sidebar: mergeOptions(defaultOptions.sidebar, defaultConfig.sidebar, layoutOptions.sidebar),
        footer: mergeOptions(defaultOptions.footer, defaultConfig.footer, layoutOptions.footer),
        content: mergeOptions(defaultOptions.content, defaultConfig.content, layoutOptions.content),
        main: mergeOptions(defaultOptions.main, defaultConfig.main, layoutOptions.main),
    };
  
    return initialSetup;
};

const jumboContentLayoutReducer = (
    state: ContentLayoutOptions, 
    action: ContentLayoutAction
  ): ContentLayoutOptions => {
    if (!action.payload) return state;
  
    switch (action.type) {
      case CONTENT_LAYOUT_ACTIONS.SET_BASE_OPTIONS:
        return {
          ...state,
          base: {
            ...state.base,
            ...action.payload.base
          }
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_HEADER_OPTIONS:
        return {
          ...state,
          header: mergeReducerOptions(state.header, action.payload.header)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_SIDEBAR_OPTIONS:
        return {
          ...state,
          sidebar: mergeReducerOptions(state.sidebar, action.payload.sidebar)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_WRAPPER_OPTIONS:
        return {
          ...state,
          wrapper: mergeReducerOptions(state.wrapper, action.payload.wrapper)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_CONTENT_OPTIONS:
        return {
          ...state,
          content: mergeReducerOptions(state.content, action.payload.content)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_MAIN_OPTIONS:
        return {
          ...state,
          main: mergeReducerOptions(state.main, action.payload.main)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_FOOTER_OPTIONS:
        return {
          ...state,
          footer: mergeReducerOptions(state.footer, action.payload.footer)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_ROOT_OPTIONS:
        return {
          ...state,
          root: mergeReducerOptions(state.root, action.payload.root)
        };
  
      case CONTENT_LAYOUT_ACTIONS.SET_ALL_OPTIONS:
        return {
          ...state,
          base: {
            ...state.base,
            ...action.payload.base,
          },
          root: mergeReducerOptions(state.root, action.payload.root),
          header: mergeReducerOptions(state.header, action.payload.header),
          sidebar: mergeReducerOptions(state.sidebar, action.payload.sidebar),
          wrapper: mergeReducerOptions(state.wrapper, action.payload.wrapper),
          main: mergeReducerOptions(state.main, action.payload.main),
          content: mergeReducerOptions(state.content, action.payload.content),
          footer: mergeReducerOptions(state.footer, action.payload.footer),
        };
  
      case CONTENT_LAYOUT_ACTIONS.RESET:
        return initialSetup;
  
      default:
        throw new Error("Invalid action type to update Content Layout in ContentLayoutProvider");
    }
  };
  

const JumboContentLayoutProvider: React.FC<JumboContentLayoutProviderProps> = ({
    layoutOptions = {},
    children
}) => {
    const [contentLayoutOptions, dispatch] = React.useReducer(
        jumboContentLayoutReducer,
        layoutOptions,
        init
    );

    const setBaseOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['base']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_BASE_OPTIONS, payload: { base: options } });
    }, []);

    const setRootOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['root']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_ROOT_OPTIONS, payload: { root: options } });
    }, []);

    const setHeaderOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['header']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_HEADER_OPTIONS, payload: { header: options } });
    }, []);

    const setSidebarOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['sidebar']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_SIDEBAR_OPTIONS, payload: { sidebar: options } });
    }, []);

    const setWrapperOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['wrapper']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_WRAPPER_OPTIONS, payload: { wrapper: options } });
    }, []);

    const setFooterOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['footer']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_FOOTER_OPTIONS, payload: { footer: options } });
    }, []);

    const setContentOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['content']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_CONTENT_OPTIONS, payload: { content: options } });
    }, []);

    const setMainOptions = React.useCallback((options: DeepPartial<ContentLayoutOptions['main']>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_MAIN_OPTIONS, payload: { main: options } });
    }, []);

    const setContentLayout = React.useCallback((options: DeepPartial<ContentLayoutOptions>) => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.SET_ALL_OPTIONS, payload: options });
    }, []);

    const resetContentLayout = React.useCallback(() => {
        dispatch({ type: CONTENT_LAYOUT_ACTIONS.RESET });
    }, []);

    const contextValue = React.useMemo(() => ({
        ...contentLayoutOptions,
        setBaseOptions,
        setRootOptions,
        setHeaderOptions,
        setSidebarOptions,
        setWrapperOptions,
        setFooterOptions,
        setContentOptions,
        setMainOptions,
        setContentLayout,
        resetContentLayout
    }), [contentLayoutOptions]);

    return (
        <JumboContentLayoutContext.Provider value={contextValue}>
            {children}
        </JumboContentLayoutContext.Provider>
    );
};

export default JumboContentLayoutProvider;