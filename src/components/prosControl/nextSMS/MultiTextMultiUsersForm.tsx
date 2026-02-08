'use client';
import { 
  Box, 
  Typography, 
  TextField, 
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';

interface MessageData {
  to: string;
  text: string;
}

interface MultiMessagesFormData {
  messages: MessageData[];
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

export default function MultiTextMultiUsersForm() {
    const { enqueueSnackbar } = useSnackbar();
    const [responseData, setResponseData] = useState<SmsResponse | null>(null);

    const schema = yup.object({
        messages: yup.array().of(
            yup.object().shape({
                to: yup.string()
                    .required("Recipient number is required")
                    .matches(/^255\d{9}$/, "Number must start with 255 and have 9 more digits"),
                text: yup.string().required("Message text is required")
            })
        ).min(1, "At least one message is required")
    });

    const { control, handleSubmit, formState: { errors }, reset } = useForm<MultiMessagesFormData>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            messages: [{ to: "", text: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "messages"
    });

    const mutation = useMutation({
        mutationFn: smsServices.sendMultiTextMultiUsers,
        onSuccess: (data: SmsResponse) => {
            enqueueSnackbar(`Successfully sent ${data.messages?.length || 0} messages`, { variant: 'success' });
            setResponseData(data);
            reset();
        },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data?.message || 'Failed to send messages', { variant: 'error' });
            setResponseData(null);
        }
    });

    const onSubmit = (data: MultiMessagesFormData) => {
        mutation.mutate({ messages: data.messages });
    };

    const addMessage = () => {
        append({ to: "", text: "" });
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

    const totalRecipients = fields.length;
    const totalMessages = fields.reduce((total, field) => total + (field.text ? Math.ceil(field.text.length / 160) : 0), 0);

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Send Multiple Texts to Multiple Users</Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {fields.map((field, index) => (
                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{xs: 12, md: 5}}>
                                    <TextField
                                        label="Recipient Number (255...)"
                                        fullWidth
                                        size="small"
                                        {...control.register(`messages.${index}.to` as const)}
                                        error={!!errors.messages?.[index]?.to}
                                        helperText={errors.messages?.[index]?.to?.message}
                                        placeholder="255712345678"
                                    />
                                </Grid>
                                
                                <Grid size={{xs: 12, md: 6}}>
                                    <TextField
                                        label="Message"
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={2}
                                        {...control.register(`messages.${index}.text` as const)}
                                        error={!!errors.messages?.[index]?.text}
                                        helperText={errors.messages?.[index]?.text?.message || 
                                            `${field.text?.length || 0} characters, ~${Math.ceil((field.text?.length || 0) / 160)} SMS`}
                                    />
                                </Grid>
                                
                                <Grid size={{xs: 12, md: 1}}>
                                    <IconButton
                                        onClick={() => remove(index)}
                                        color="error"
                                        disabled={fields.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', mt: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                            {totalRecipients} recipient(s), ~{totalMessages} total SMS
                        </Typography>
                    </Box>
                    <Button
                        onClick={addMessage}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        Add Another Message
                    </Button>
                </Box>

                <LoadingButton 
                    type="submit" 
                    variant="contained" 
                    loading={mutation.isPending}
                    sx={{ mt: 2 }}
                    fullWidth
                >
                    Send {totalRecipients} Message(s)
                </LoadingButton>
            </Box>

            {responseData && responseData.messages && (
                <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Delivery Status ({responseData.messages.length} messages sent)
                        </Typography>
                        
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>To</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>SMS Count</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {responseData.messages.map((message, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{message.to}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={message.status.name} 
                                                    color={getStatusColor(message.status.name)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{message.status.description}</TableCell>
                                            <TableCell>{message.smsCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Summary
                            </Typography>
                            <Typography variant="body2">
                                Total Messages Sent: {responseData.messages.length}
                            </Typography>
                            <Typography variant="body2">
                                Total SMS: {responseData.messages.reduce((total, msg) => total + msg.smsCount, 0)}
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