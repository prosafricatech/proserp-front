'use client';

import { onMessageListener } from "@/app/helpers/init-firebase";
import { useSnackbar } from "notistack";
import { useEffect } from "react";

const PushNotification: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const unsubscribePromise = onMessageListener().then((payload: any) => {
      enqueueSnackbar(
        `${payload?.notification?.title}: ${payload?.notification?.body}`,
        {
          variant: 'info',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        }
      );
    });

    return () => {
      unsubscribePromise.catch((err) => console.error('Failed to unsubscribe: ', err));
    };
  }, [enqueueSnackbar]);

  return null;
};

export default PushNotification;
