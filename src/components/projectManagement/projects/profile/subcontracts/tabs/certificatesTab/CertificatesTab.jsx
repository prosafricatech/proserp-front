import React from 'react';
import { Card, Grid, Stack } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';
import CertificatesListItem from './CertificatesListItem';
import CertificatesActionTail from './CertificatesActionTail';

const CertificatesTab = ({ subContract }) => {
  const params = useParams();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'Certificates',
    queryParams: { 
      id: subContract?.id,
      keyword: '', 
      subcontract_id: subContract?.id, 
      aggregated: false
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: subContract?.id },
    }));
  }, [params]);

  const renderCertificates = React.useCallback((certificate) => {
    return <CertificatesListItem certificate={certificate} />;
  }, []);

  const handleOnChange = React.useCallback(
    (keyword) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword,
        },
      }));
    },
    []
  );

  return (
    <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.getCertificates}
        primaryKey={"id"} 
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderCertificates}
        componentElement="div"
        wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
        }}
        toolbar={
            <JumboListToolbar
                hideItemsPerPage={true}
                actionTail={
                    <Stack direction="row">
                        <JumboSearch
                            onChange={handleOnChange}
                            value={queryOptions.queryParams.keyword}
                        />
                        <CertificatesActionTail subContract={subContract}/>
                    </Stack>
                }
            />
        }
    />
  );
};

export default CertificatesTab;
