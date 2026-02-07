'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';
import CertificatesListItem from './CertificatesListItem';
import CertificatesActionTail from './CertificatesActionTail';

interface SubContract {
  id?: number | string;
}

interface CertificatesTabProps {
  subContract?: SubContract;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ subContract }) => {
  const params = useParams();
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'Certificates',
    queryParams: {
      id: subContract?.id,
      keyword: '',
      subcontract_id: subContract?.id,
      aggregated: false,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    if (subContract?.id) {
      setQueryOptions((prev) => ({
        ...prev,
        queryParams: { ...prev.queryParams, id: subContract.id, subcontract_id: subContract.id },
      }));
    }
  }, [subContract?.id, params]);

  const renderCertificates = React.useCallback((certificate: any) => {
    return <CertificatesListItem certificate={certificate} />;
  }, []);

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={projectsServices.getCertificates}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderCertificates}
      componentElement="div"
      wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <JumboSearch onChange={handleOnChange} value={queryOptions.queryParams.keyword} />
              <CertificatesActionTail subContract={subContract} />
            </div>
          }
        />
      }
    />
  );
};

export default CertificatesTab;