'use client';

import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import axios from "@/lib/services/config";
import { ASSET_IMAGES } from "@/utilities/constants/paths";
import { Div } from "@jumbo/shared";
import { LoadingButton } from "@mui/lab";
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/app/[lang]/contexts/LanguageContext";

const EmailVerificationNotice = () => {
  const { authUser } = useJumboAuth();
  const [isSending, setIsSending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const lang = useLanguage();
  const router = useRouter();

  /**
   * While authUser is loading
   */
  if (!authUser) {
    return (
      <Div
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Div>
    );
  }

  /**
   * Resend verification email
   */
  const resendVerificationLink = async () => {
    if (!authUser?.user?.email) return;

    setIsSending(true);
    try {
      const response = await axios.post(
        "/api/auth/verification-notification",
        { email: authUser.user.email }
      );

      enqueueSnackbar(response.data?.message || "Verification link sent", {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || "Failed to resend verification email",
        { variant: "error" }
      );
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Logout user
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({
      redirect: true,
      callbackUrl: "/auth/signin",
    });
  };

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: "wrap",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: (theme) => theme.spacing(4),
      }}
    >
      {/* Logo */}
      <Div sx={{ mb: 3, display: "inline-flex" }}>
        <Link href={`/${lang}/dashboard`} style={{ display: "inline-flex" }}>
          <img
            width={200}
            src={`${ASSET_IMAGES}/logos/proserp-logo.jpeg`}
            alt="ProsERP"
          />
        </Link>
      </Div>

      {/* Card */}
      <Card sx={{ maxWidth: "100%", width: 360, mb: 4 }}>
        <CardContent>
          <Typography textAlign="center" sx={{ mb: 2 }} variant="body1">
            Please verify your email through the link sent to the email address
            below. If the link has expired or you misplaced it, click the Resend
            verification link button to get a new one.
          </Typography>

          <Div sx={{ mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              id="email"
              label="Email"
              value={authUser?.user?.email || ""}
              disabled
            />
          </Div>

          <LoadingButton
            onClick={resendVerificationLink}
            loading={isSending}
            fullWidth
            variant="contained"
            size="large"
            sx={{ mb: 2 }}
          >
            Resend verification link
          </LoadingButton>

          <Divider sx={{ my: 2 }} />

          <LoadingButton
            onClick={handleLogout}
            loading={isLoggingOut}
            fullWidth
            variant="outlined"
            color="error"
            size="large"
            sx={{ mb: 2 }}
          >
            Logout
          </LoadingButton>

          <Typography textAlign="center" variant="body2" mb={1}>
            Already Verified?{' '}
            <span
              style={{ textDecoration: 'none', fontWeight: 500, color: '#1976d2', cursor: 'pointer' }}
              onClick={async () => {
                try {
                  window.location.href = '/';
                } catch (e) {
                  enqueueSnackbar('Could not recheck verification. Please try again.', { variant: 'error' });
                }
              }}
              role="button"
              tabIndex={0}
              onKeyPress={e => { if (e.key === 'Enter') window.location.href = '/'; }}
            >
              Proceed to Homepage
            </span>
          </Typography>

          <Typography textAlign="center" variant="body2">
            Don't remember your email?{" "}
            <Link href="/support" style={{ textDecoration: "none" }}>
              Contact Support
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
};

export default EmailVerificationNotice;
