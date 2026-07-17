export const dynamic = 'force-dynamic';

import React from 'react';
import RFQDetail from '@/components/procurement/rfqs/detail/RFQDetail';

function page({ params }: { params: { id: string } }) {
  return <RFQDetail rfqId={params.id} />;
}

export default page;
