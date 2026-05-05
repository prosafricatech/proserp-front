import { LeaveRequisitionItem, Requisition } from '../RequisitionType';

export const processTypeConfig = {
  PURCHASE: { label: 'Purchase', color: 'primary' as const },
  PAYMENT: { label: 'Payment', color: 'primary' as const },
  LEAVE_REQUEST: { label: 'Leave Request', color: 'primary' as const },
} as const;

type LeaveLikeRequisition = Pick<Requisition, 'process_type' | 'leave_items'> & {
  items?: LeaveRequisitionItem[];
};

export function getLeaveItems(requisition: LeaveLikeRequisition): LeaveRequisitionItem[] {
  if (requisition.process_type !== 'LEAVE_REQUEST') return [];
  const leaveItems = requisition.leave_items || ('items' in requisition ? requisition.items : []) || [];
  return leaveItems.map((item) => ({
    ...item,
    employee: item.employee || (item.employee_number || item.first_name || item.last_name
      ? {
          id: item.employee_id,
          employee_number: item.employee_number,
          first_name: item.first_name,
          last_name: item.last_name,
        }
      : undefined),
    leave_type: item.leave_type || (item.leave_type_name
      ? {
          id: item.leave_type_id,
          name: item.leave_type_name,
        }
      : undefined),
    days_requested: Number(item.days_requested || 0),
  }));
}

export function getLeaveItemsTotalDays(requisition: LeaveLikeRequisition): number {
  return getLeaveItems(requisition).reduce((sum, item) => sum + Number(item.days_requested || 0), 0);
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
