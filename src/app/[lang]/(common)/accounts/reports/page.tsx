export const dynamic = "force-dynamic";
import AccountsReports from '@/components/accounts/reports/AccountsReports'
import React, { Suspense } from 'react'

function page() {
  return (
    <Suspense fallback={null}>
      <AccountsReports/>
    </Suspense>
  )
}

export default page