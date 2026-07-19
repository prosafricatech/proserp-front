'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  AccountBalanceOutlined,
  ApartmentOutlined,
  AssignmentIndOutlined,
  BadgeOutlined,
  CalendarMonthOutlined,
  ContactPhoneOutlined,
  CreditCardOutlined,
  EmailOutlined,
  EventAvailableOutlined,
  FingerprintOutlined,
  HomeOutlined,
  PaymentsOutlined,
  PersonOutlineOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { type ReactElement, type ReactNode } from 'react';
import { MyHrProfileType } from './profileType';

interface MyHrProfileProps {
  isLoading?: boolean;
  profile?: MyHrProfileType;
}

// @/app/helpers if a 4th copy ever shows up.
const formatEmploymentType = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatMoney = (value?: number | null) =>
  value || value === 0
    ? value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : undefined;

const capitalize = (value?: string | null) =>
  value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : undefined;

// ---- reusable pieces -------------------------------------------------

/** Quick-glance KPI card for the top dashboard strip. */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactElement;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card variant='outlined' sx={{ p: 2, height: '100%' }}>
      <Stack direction='row' spacing={1.5} alignItems='center'>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            // bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='caption' color='text.secondary' noWrap>
            {label}
          </Typography>
          <Typography
            variant='subtitle1'
            fontWeight={600}
            noWrap
            component='div'
          >
            {value ?? '—'}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

type InfoItemDef = {
  key: string;
  label: string;
  value?: string | null;
  icon: ReactElement;
};

/** Single icon + label + value tile — matches PersonalInfoTab.tsx's convention. */
function InfoItem({ icon, label, value }: Omit<InfoItemDef, 'key'>) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
      }}
    >
      <Box
        sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='caption' color='text.secondary'>
          {label}
        </Typography>
        <Typography variant='body2' fontWeight={500} noWrap>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

/** A titled card containing a grid of InfoItems — one per profile section. */
function InfoSection({
  title,
  items,
}: {
  title: string;
  items: InfoItemDef[];
}) {
  return (
    <Card variant='outlined' sx={{ p: 2 }}>
      <Typography variant='subtitle1' fontWeight={600} mb={1.5}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.25,
        }}
      >
        {items.map((item) => (
          <InfoItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={item.value}
          />
        ))}
      </Box>
    </Card>
  );
}

function contractStatusColor(
  status?: string
): 'success' | 'default' | 'warning' {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'success';
    case 'terminated':
      return 'default';
    default:
      return 'warning';
  }
}

// ---- main component ---------------------------------------------------

const MyHrProfile = ({ isLoading = false, profile }: MyHrProfileProps) => {
  if (isLoading) {
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Grid container spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton
                variant='rectangular'
                width='100%'
                height={72}
                sx={{ borderRadius: 1.5 }}
              />
            </Grid>
          ))}
        </Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            variant='rectangular'
            width='100%'
            height={140}
            sx={{ borderRadius: 1.5 }}
          />
        ))}
      </Stack>
    );
  }

  if (!profile) return null;

  const contract = profile.active_contract;
  const bank = profile.primary_bank_account;

  const identitySection: InfoItemDef[] = [
    {
      key: 'employeeNumber',
      label: 'Employee Number',
      value: profile.employee_number,
      icon: <BadgeOutlined fontSize='small' />,
    },
    {
      key: 'gender',
      label: 'Gender',
      value: capitalize(profile.gender),
      icon: <PersonOutlineOutlined fontSize='small' />,
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      value: profile.date_of_birth
        ? readableDate(profile.date_of_birth, false)
        : undefined,
      icon: <CalendarMonthOutlined fontSize='small' />,
    },
    {
      key: 'nationalId',
      label: 'National ID',
      value: profile.national_id,
      icon: <FingerprintOutlined fontSize='small' />,
    },
    {
      key: 'passportNumber',
      label: 'Passport Number',
      value: profile.passport_number,
      icon: <BadgeOutlined fontSize='small' />,
    },
  ];

  const contactSection: InfoItemDef[] = [
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      value: profile.phone_number,
      icon: <ContactPhoneOutlined fontSize='small' />,
    },
    {
      key: 'email',
      label: 'Email',
      value: profile.email,
      icon: <EmailOutlined fontSize='small' />,
    },
    {
      key: 'address',
      label: 'Address',
      value: profile.address,
      icon: <HomeOutlined fontSize='small' />,
    },
  ];

  const employmentSection: InfoItemDef[] = [
    {
      key: 'department',
      label: 'Department',
      value: profile.department?.name,
      icon: <ApartmentOutlined fontSize='small' />,
    },
    {
      key: 'costCenter',
      label: 'Cost Center',
      value: profile.cost_center?.name,
      icon: <ApartmentOutlined fontSize='small' />,
    },
    {
      key: 'employmentType',
      label: 'Employment Type',
      value: formatEmploymentType(profile.employment_type),
      icon: <WorkOutlineOutlined fontSize='small' />,
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      value: profile.join_date
        ? readableDate(profile.join_date, false)
        : undefined,
      icon: <CalendarMonthOutlined fontSize='small' />,
    },
  ];

  const contractSection: InfoItemDef[] | null = contract
    ? [
        {
          key: 'designation',
          label: 'Designation',
          value: contract.designation?.title,
          icon: <AssignmentIndOutlined fontSize='small' />,
        },
        {
          key: 'contractType',
          label: 'Contract Type',
          value: formatEmploymentType(contract.contract_type),
          icon: <AssignmentIndOutlined fontSize='small' />,
        },
        {
          key: 'startDate',
          label: 'Start Date',
          value: contract.start_date
            ? readableDate(contract.start_date, false)
            : undefined,
          icon: <EventAvailableOutlined fontSize='small' />,
        },
        {
          key: 'basicSalary',
          label: 'Basic Salary',
          value: formatMoney(contract.basic_salary),
          icon: <PaymentsOutlined fontSize='small' />,
        },
      ]
    : null;

  const bankSection: InfoItemDef[] | null = bank
    ? [
        {
          key: 'bankName',
          label: 'Bank',
          value: bank.bank?.name || bank.bank_name,
          icon: <AccountBalanceOutlined fontSize='small' />,
        },
        {
          key: 'accountName',
          label: 'Account Name',
          value: bank.account_name,
          icon: <PersonOutlineOutlined fontSize='small' />,
        },
        {
          key: 'accountNumber',
          label: 'Account Number',
          value: bank.account_number,
          icon: <CreditCardOutlined fontSize='small' />,
        },
      ]
    : null;

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {/* Quick-glance dashboard strip */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<ApartmentOutlined />}
            label='Department'
            value={profile.department?.name || '—'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AssignmentIndOutlined />}
            label='Designation'
            value={contract?.designation?.title || '—'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<WorkOutlineOutlined />}
            label='Employment Type'
            value={formatEmploymentType(profile.employment_type) || '—'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<BadgeOutlined />}
            label='Contract Status'
            value={
              contract ? (
                <Chip
                  label={capitalize(contract.status)}
                  size='small'
                  color={contractStatusColor(contract.status)}
                  variant='outlined'
                />
              ) : (
                'No Contract'
              )
            }
          />
        </Grid>
      </Grid>

      <InfoSection title='Identity' items={identitySection} />
      <InfoSection title='Contact' items={contactSection} />
      <InfoSection title='Employment' items={employmentSection} />

      {contractSection ? (
        <InfoSection title='Current Contract' items={contractSection} />
      ) : (
        <Card variant='outlined' sx={{ p: 2 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            Current Contract
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            No active contract on file yet.
          </Typography>
        </Card>
      )}

      {bankSection ? (
        <InfoSection title='Primary Bank Account' items={bankSection} />
      ) : (
        <Card variant='outlined' sx={{ p: 2 }}>
          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            Primary Bank Account
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            No primary bank account on file. Contact HR to have one added.
          </Typography>
        </Card>
      )}
    </Stack>
  );
};

export default MyHrProfile;
