'use client'

import React, { useEffect } from 'react';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import Head from 'next/head';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/services/config';
import OrganizationForm from '@/components/organizations/form/OrganizationForm';
import { useParams, useRouter } from 'next/navigation';
import { Organization } from '@/types/auth-types';
import { Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

interface OrganizationResponse {
  organization: Organization;
}

const EditOrganization: React.FC = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  const orgEditDict = dictionary.organizations.form;
  
  const params = useParams();
  const router = useRouter();
  const organization_id = params?.id as string;
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();

  const { data, isLoading, error } = useQuery<OrganizationResponse>({
    queryKey: ['organizationDetails', organization_id],
    queryFn: async () => {
      const response = await axios.get(`/api/organizations/${organization_id}/organizationDetails`);
      return response.data;
    },
    enabled: !!organization_id && !!authOrganization?.organization?.id,
  });

  useEffect(() => {
    if (!organization_id || !authOrganization?.organization?.id) return;

    // Convert both IDs to the same type for comparison
    const authOrgId = authOrganization.organization.id.toString();
    const paramOrgId = organization_id;

    if (
      authOrgId !== paramOrgId ||
      !checkOrganizationPermission(PERMISSIONS.ORGANIZATION_UPDATE)
    ) {
      router.push(`/${lang}/dashboard`);
    }
  }, [authOrganization, organization_id, checkOrganizationPermission, router]);

  if (isLoading) {
    return <BackdropSpinner message={orgEditDict.messages.loading} />;
  }

  if (error) {
    return <div>{orgEditDict.messages.error}</div>;
  }

  if (!data?.organization) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          {orgEditDict.pageTitle.replace('{organizationName}', data.organization.name)}
        </title>
      </Head>

      <Typography
        variant="h4" 
        component="h1"
        sx={{ 
          mb: 3,
          fontWeight: 'bold',
          color: 'primary.main'
        }}
      >
        {orgEditDict.heading.replace('{organizationName}', data.organization.name)}
      </Typography>
      <OrganizationForm organization={data.organization} />
    </>
  );
};

export default EditOrganization;