'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardProps,
  CardHeaderProps,
  CardContentProps,
} from '@mui/material';
import { getBgColorStyle, getBgImageStyle } from '@jumbo/utilities/styleHelpers';
import { JumboBackdrop } from '../JumboBackdrop';

interface JumboCardQuickProps extends Omit<CardProps, 'title'> {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  bgColor?: string | string[];
  bgImage?: string;
  bgGradientDir?: string;
  headerSx?: CardHeaderProps['sx'];
  footerProps?: any;
  noWrapper?: boolean;
  wrapperSx?: CardContentProps['sx'];
  backdrop?: boolean;
  backdropColor?: string;
  backdropOpacity?: string | number;
  reverse?: boolean;
  divider?: boolean;
}

const JumboCardQuick: React.FC<JumboCardQuickProps> = ({
  title,
  subheader,
  avatar,
  action,
  bgColor,
  bgImage,
  bgGradientDir,
  headerSx = {},
  footerProps,
  noWrapper = false,
  wrapperSx,
  backdrop = false,
  backdropColor = '#000000',
  backdropOpacity = '0.7',
  reverse = false,
  divider = false,
  sx,
  children,
  ...restProps
}) => {
  const [bgStyle, setBgStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    let newStyle: React.CSSProperties = {};

    if (bgImage) {
      const imageStyle = getBgImageStyle(bgImage);
      if (imageStyle) {
        newStyle = { ...newStyle, ...imageStyle };
      }
    } else if (bgColor) {
      const colors = Array.isArray(bgColor) ? bgColor.join(', ') : bgColor;
      const colorStyle = getBgColorStyle({
        colors,
        gradientDir: bgGradientDir,
      });

      if (colorStyle) {
        const safeStyle: React.CSSProperties = {
          ...colorStyle,
          background: colorStyle.backgroundImage as string | undefined,
          backgroundColor: colorStyle.backgroundColor as React.CSSProperties['backgroundColor'],
          backgroundImage: colorStyle.backgroundImage as React.CSSProperties['backgroundImage'],
        };
        newStyle = { ...newStyle, ...safeStyle };
      }
    }

    setBgStyle(newStyle);
  }, [bgColor, bgImage, bgGradientDir]);

  return (
    <Card
      sx={[
        bgStyle,
        { position: 'relative' },
        ...(Array.isArray(sx) ? sx : [sx ?? false]).filter(Boolean),
      ]}
      {...restProps}
    >
      <JumboBackdrop
        color={backdropColor}
        opacity={backdropOpacity}
        open={backdrop}
      />

      {(action || title || avatar || subheader) && !reverse && (
        <CardHeader
          title={title}
          subheader={subheader}
          action={action}
          avatar={avatar}
          sx={{
            zIndex: 2,
            position: 'relative',
            ...headerSx,
          }}
        />
      )}

      {noWrapper ? (
        children
      ) : (
        <CardContent
          sx={{
            ...wrapperSx,
            zIndex: 2,
            position: 'relative',
          }}
        >
          {children}
        </CardContent>
      )}

      {(action || title || avatar || subheader) && reverse && (
        <CardHeader
          title={title}
          subheader={subheader}
          action={action}
          avatar={avatar}
          sx={{
            zIndex: 2,
            position: 'relative',
            borderTop: divider ? 1 : 0,
            borderTopColor: 'divider',
            ...headerSx,
          }}
        />
      )}
    </Card>
  );
};

export default JumboCardQuick;