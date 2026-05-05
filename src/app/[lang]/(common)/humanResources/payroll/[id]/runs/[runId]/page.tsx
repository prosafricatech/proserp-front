import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PayslipDetailPage({
  params,
}: {
  params: { lang: string; id: string; runId: string };
}) {
  redirect(`/${params.lang}/humanResources/payroll/${params.id}?run_id=${params.runId}`);
}
