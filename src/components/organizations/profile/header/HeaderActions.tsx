'use client'

import { DashboardOutlined, Edit, KeyboardArrowRight } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Button, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useOrganizationProfile } from '../OrganizationProfileProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Organization } from '@/types/auth-types';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

export const HeaderActions: React.FC = () => {
    const lang = useLanguage();
    const dictionary = useDictionary();
    const headerDict = dictionary.organizations.profile.topHeader;

    const router = useRouter();
    const { organization }: { organization?: Organization } = useOrganizationProfile();
    const { authOrganization, checkOrganizationPermission, loadOrganization } = useJumboAuth();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    const isAuthOrganization = authOrganization?.organization?.id === organization?.id;

    const onLoad = async (): Promise<void> => {
        if (!organization) return;

        if (authOrganization?.organization?.id !== organization.id) {
            setIsLoading(true);
            try {
                await loadOrganization(
                    organization.id,
                    (response) => {
                        enqueueSnackbar(
                            headerDict.messages.organizationLoaded.replace('{organizationName}', organization.name),
                            { variant: 'success' }
                        );
                    },
                    (error: Error) => {
                        enqueueSnackbar(
                            headerDict.messages.generalError,
                            { variant: 'error' }
                        );
                    }
                );
            } catch (error) {
                enqueueSnackbar(
                    headerDict.messages.loadError,
                    { variant: 'error' }
                );
            } finally {
                setIsLoading(false);
            }
        } else {
            router.push(`/${lang}/dashboard`);
        }
    };

    if (!organization) {
        return null;
    }

    return (
        <div className="flex gap-2">
            <Tooltip title={headerDict.tooltips.loadOrganization.replace('{organizationName}', organization.name)}>
                <LoadingButton
                    onClick={onLoad}
                    disableRipple
                    loading={isLoading}
                    size="medium"
                    variant="text"
                    startIcon={isAuthOrganization ? <DashboardOutlined /> : <KeyboardArrowRight />}
                    sx={{
                        '&:hover': {
                            backgroundColor: 'transparent'
                        }
                    }}
                >
                    {isAuthOrganization ? headerDict.buttons.dashboard : headerDict.buttons.load}
                </LoadingButton>
            </Tooltip>

            {isAuthOrganization && checkOrganizationPermission(PERMISSIONS.ORGANIZATION_UPDATE) && (
                <Tooltip title={headerDict.tooltips.editOrganization}>
                    <Button
                        onClick={() => router.push(`/${lang}/organizations/edit/${organization.id}`)}
                        disableRipple
                        size="medium"
                        variant="text"
                        startIcon={<Edit />}
                        sx={{
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'transparent'
                            }
                        }}
                    >
                        {headerDict.buttons.edit}
                    </Button>
                </Tooltip>
            )}
        </div>
    );
};