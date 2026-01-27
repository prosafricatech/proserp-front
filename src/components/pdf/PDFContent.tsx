import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { styled } from '@mui/material';
import React, { lazy, Suspense, ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

type PDFDocument = ReactElement<DocumentProps>;

interface PDFContentProps {
  document: PDFDocument;
  fileName?: string;
}

const StyledDownloadLink = styled('div')(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  '& a': {
    color: theme.palette.mode === 'dark' ? '#29f096' : theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 500,
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.mode === 'dark' ? '#29f096' : theme.palette.primary.main}`,
    display: 'inline-block',
    transition: 'all 0.3s ease',
    '&:hover': {
      color: theme.palette.mode === 'dark' ? '#1ed184' : theme.palette.primary.dark,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(41, 240, 150, 0.1)' : 'rgba(25, 118, 210, 0.1)',
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows[2],
    },
  },
}));

const PDFDownloadLink = lazy(() => 
  import('@react-pdf/renderer').then(module => ({ 
    default: module.PDFDownloadLink 
  }))
);

const PDFViewer = lazy(() => 
  import('@react-pdf/renderer').then(module => ({ 
    default: module.PDFViewer 
  }))
);

const PDFContent: React.FC<PDFContentProps> = ({ document, fileName = 'ProsERP document' }) => {
  const isMobile = deviceType() === 'mobile';
  
  if (isMobile) {
    return (
      <Suspense fallback={<BackdropSpinner />}>
        <StyledDownloadLink>
          <PDFDownloadLink 
            document={document} 
            fileName={`${fileName}.pdf`}
          >
            {({ loading }) => loading ? <BackdropSpinner /> : `Download ${fileName} PDF`}
          </PDFDownloadLink>
        </StyledDownloadLink>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<BackdropSpinner />}>
      <PDFViewer width="100%" height="600">
        {document}
      </PDFViewer>
    </Suspense>
  );
};

export default PDFContent;