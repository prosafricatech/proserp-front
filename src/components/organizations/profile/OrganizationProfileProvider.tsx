'use client'

import { Alert, LinearProgress } from '@mui/material';
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/services/config';
import { Organization } from '@/types/auth-types';
import { useParams } from 'next/navigation';

interface OrganizationProfileContextType {
  organization?: Organization;
}

const OrganizationProfileContext = createContext<OrganizationProfileContextType>({});

export const useOrganizationProfile = () => useContext(OrganizationProfileContext);

interface OrganizationProfileProviderProps {
  children: ReactNode;
}

export default function OrganizationProfileProvider({ children }: OrganizationProfileProviderProps) {
    const params = useParams();
    const organization_id = params?.id;

    const { data: organization, isLoading, error } = useQuery<Organization>({
        queryKey: ['showOrganization', { id: organization_id }],
        queryFn: async () => {
            if (!organization_id) throw new Error('Organization ID is required');
            const response = await axios.get(`/api/organizations/${organization_id}/organizationDetails`);
            return response.data.organization;
        },
        enabled: !!organization_id,
    });

    React.useEffect(() => {
        if (organization?.name) {
        document.title = organization.name;
        }
    }, [organization?.name]);

    if (isLoading) {
        return <LinearProgress />;
    }

    if (error) {
        return (
            <Alert severity="error">
                {(error as any)?.response?.data?.message || 'Failed to load organization'}
            </Alert>
        );
    }

    const contextValue: OrganizationProfileContextType = {
        organization,
    };

    return (
        <OrganizationProfileContext.Provider value={contextValue}>
            {children}
        </OrganizationProfileContext.Provider>
    );
}