import { Requisition } from '../RequisitionType';

export const processTypeConfig = {
  PURCHASE: { label: 'Purchase', color: 'primary' as const },
  PAYMENT: { label: 'Payment', color: 'warning' as const },
  LEAVE_REQUEST: { label: 'Leave Request', color: 'info' as const },
} as const;

export function getLeaveItemsTotalDays(requisition: Pick<Requisition, 'process_type' | 'leave_items'>): number {
  if (requisition.process_type !== 'LEAVE_REQUEST') return 0;
  return (requisition.leave_items || []).reduce((sum, item) => sum + Number(item.days_requested || 0), 0);
}

export function requisitionAmountDisplay(requisition: Requisition, currencyCode?: string): string {
  if (requisition.process_type === 'LEAVE_REQUEST') {
    const totalDays = getLeaveItemsTotalDays(requisition);
    return `${totalDays} day(s)`;
  }

  return (Number(requisition.amount || 0) + Number(requisition.vat_amount || 0)).toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode || requisition.currency?.code || 'USD',
  });
}
