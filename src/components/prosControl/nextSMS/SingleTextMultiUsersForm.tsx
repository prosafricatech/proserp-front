'use client';
import { Box, Typography, TextField, Chip, Card, CardContent, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';

interface MultiUsersFormData {
  to: string;
  text: string;
}

interface SmsResponse {
  messages: Array<{
    to: string;
    status: {
      groupId: number;
      groupName: string;
      id: number;
      name: string;
      description: string;
    };
    smsCount: number;
  }>;
}

export default function SingleTextMultiUsersForm() {
    const { enqueueSnackbar } = useSnackbar();
    const [responseData, setResponseData] = useState<SmsResponse | null>(null);

    const schema = yup.object({
        to: yup.string().required("Enter at least one recipient number"),
        text: yup.string().required("Message text is required")
    });

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MultiUsersFormData>({
        resolver: yupResolver(schema) as any
    });

    const mutation = useMutation({
        mutationFn: smsServices.sendSingleTextMultiUsers,
        onSuccess: (data) => {
            enqueueSnackbar('SMS sent successfully to multiple users!', { variant: 'success' });
            setResponseData(data);
            reset();
        },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to send SMS', { variant: 'error' });
            setResponseData(null);
        }
    });

    const onSubmit = (data: MultiUsersFormData) => {
        const toArray = data.to.split(",").map(n => n.trim()).filter(n => n.length > 0);
        mutation.mutate({ to: toArray, text: data.text });
    };

    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'PENDING_ENROUTE':
                return 'warning';
            case 'DELIVERED':
                return 'success';
            case 'REJECTED':
            case 'EXPIRED':
                return 'error';
            default:
                return 'default';
        }
    };

    // Calculate recipient count and SMS count
    const recipientCount = watch('to') ? watch('to').split(",").filter(n => n.trim().length > 0).length : 0;
    const estimatedSmsCount = Math.ceil((watch('text')?.length || 0) / 160) * recipientCount;

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Send One Text to Multiple Users</Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Recipients (comma separated)"
                    {...register("to")}
                    error={!!errors.to}
                    helperText={errors.to?.message || `Enter numbers separated by commas. ${recipientCount} recipient(s) detected.`}
                    multiline
                    rows={2}
                    fullWidth
                />

                <TextField
                    label="Message"
                    {...register("text")}
                    error={!!errors.text}
                    helperText={errors.text?.message || `${watch('text')?.length || 0} characters, ~${Math.ceil((watch('text')?.length || 0) / 160)} SMS per recipient`}
                    multiline 
                    rows={4}
                    fullWidth
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Total estimated SMS: {estimatedSmsCount}
                    </Typography>
                    
                    <LoadingButton 
                        type="submit" 
                        variant="contained" 
                        loading={mutation.isPending}
                    >
                        Send to {recipientCount} Recipient(s)
                    </LoadingButton>
                </Box>
            </Box>

            {responseData && responseData.messages && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            SMS Delivery Status ({responseData.messages.length} recipients)
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {responseData.messages.map((message, index) => (
                                <Grid size={{xs: 12, md: 6}} key={index}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            To: {message.to}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="body2">Status:</Typography>
                                            <Chip 
                                                label={message.status.name} 
                                                color={getStatusColor(message.status.name)}
                                                size="small"
                                            />
                                        </Box>
                                        
                                        <Typography variant="body2" gutterBottom>
                                            {message.status.description}
                                        </Typography>
                                        
                                        <Typography variant="body2">
                                            SMS Count: {message.smsCount}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Summary
                            </Typography>
                            <Typography variant="body2">
                                Total Recipients: {responseData.messages.length}
                            </Typography>
                            <Typography variant="body2">
                                Total SMS Sent: {responseData.messages.reduce((total, msg) => total + msg.smsCount, 0)}
                            </Typography>
                            <Typography variant="body2">
                                Current Status: {responseData.messages.every(msg => msg.status.name === 'DELIVERED') 
                                    ? 'All delivered' 
                                    : responseData.messages.some(msg => msg.status.name === 'PENDING_ENROUTE')
                                    ? 'In progress'
                                    : 'Mixed status'
                                }
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}