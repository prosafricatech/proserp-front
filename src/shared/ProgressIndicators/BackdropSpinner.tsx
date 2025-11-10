'use client';

import { Backdrop } from "@mui/material";
import React from "react";
import { Div } from "@jumbo/shared";
import Image from "next/image";
import { keyframes } from "@emotion/react";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { ASSET_IMAGES } from "@/utilities/constants/paths";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

interface BackdropSpinnerProps {
  message?: string;
  isRouterTransfer?: boolean;
}

const spiralRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const BackdropSpinner: React.FC<BackdropSpinnerProps> = ({
  message,
  isRouterTransfer
}) => {
  const { theme } = useJumboTheme();
  const { authOrganization } = useJumboAuth();
  const mainColor = authOrganization?.organization?.settings?.main_color || "#2113AD";
  const lightColor = authOrganization?.organization?.settings?.light_color || "#bec5da";
  const contrastText = authOrganization?.organization?.settings?.contrast_text || "#FFFFFF";

  return (
    <Backdrop
      sx={{
        color: "#ffffff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: "column",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
      }}
      open={true}
    >
      <Div
        sx={{
          position: "relative",
          width: 150,
          height: 150,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Spiral arcs */}
        <Div
          sx={{
            position: "absolute",
            width: 140,
            height: 140,
            border: "5px solid transparent",
            borderTopColor: mainColor,
            borderRadius: "50%",
            animation: `${spiralRotate} 2s linear infinite`,
            boxShadow: `0 0 10px ${mainColor}80`,
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
          }}
        />
        <Div
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            border: "5px solid transparent",
            borderBottomColor: lightColor,
            borderRadius: "50%",
            animation: `${spiralRotate} 2s linear infinite 0.3s`,
            boxShadow: `0 0 10px ${lightColor}80`,
            clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
          }}
        />
        <Div
          sx={{
            position: "absolute",
            width: 100,
            height: 100,
            border: "5px solid transparent",
            borderTopColor: contrastText,
            borderRadius: "50%",
            animation: `${spiralRotate} 2s linear infinite 0.6s`,
            boxShadow: `0 0 10px ${contrastText}80`,
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
          }}
        />
        {/* Static logo in the center */}
        <Div
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 10px ${mainColor}30`,
            zIndex: 1,
          }}
        >
          <Image
            src={theme?.type === 'light' ? `${ASSET_IMAGES}/logos/proserp-blue.png` : `${ASSET_IMAGES}/logos/proserp-white.png`}
            alt="ProsERP"
            width={85}
            height={85}
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </Div>
      </Div>

      {!isRouterTransfer && message && (
        <Div sx={{ p: 2, mt: 2 }}>
          <h2 style={{ color: contrastText, textShadow: `0 0 5px ${mainColor}50` }}>{message}</h2>
        </Div>
      )}
    </Backdrop>
  );
};