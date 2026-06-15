'use client';

import { lazy, useEffect, useMemo, useState } from 'react';
import { Card, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import ProjectDashboard from './dashboard/ProjectDashboard';
import ProjectProfileProvider, { useProjectProfile } from './ProjectProfileProvider';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../project-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import ProjectClaims from './claims/ProjectClaims';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const AttachmentForm = lazy(() => import('@/components/filesShelf/attachments/AttachmentForm'));
const Subcontracts = lazy(() => import('./subcontracts/Subcontracts'));
const ProjectUsers = lazy(() => import('./projectUsers/ProjectUsers'));
const TimelineActivitiesListItem = lazy(() => import('./wbs/WBSListItem'));
const Deliverables = lazy(() => import('./deliverables/DeliverableGroupsListItem'));
const Budgets = lazy(() => import('./budgets/BudgetsListItem'));
const Updates = lazy(() => import('./updates/Updates'));

type TabKey =
  | 'dashboard'
  | 'deliverables'
  | 'wbs'
  | 'updates'
  | 'budgets'
  | 'subcontracts'
  | 'claims'
  | 'users'
  | 'attachments';

const TABS_NEEDING_DELIVERABLES: TabKey[] = [
  'deliverables',
  'budgets',
  'claims',
  'wbs',
  'subcontracts',
  'updates',
];

const TABS_NEEDING_TIMELINE: TabKey[] = [
  'deliverables',
  'budgets',
  'claims',
  'wbs',
  'subcontracts',
  'updates',
];

function ProfileContent() {
  const { project, updateProjectProfile, setIsDashboardTab }: any = useProjectProfile();
  const { authUser, checkOrganizationPermission } = useJumboAuth();
  const isAdministrator = authUser?.user?.organization_roles?.some(
    (role: { name?: string }) => role.name === 'Administrator'
  );
  const canManageTeam =
    isAdministrator ||
    checkOrganizationPermission(PERMISSIONS.PROJECTS_MANAGE_TEAM);
  const showUsersTab = canManageTeam;
  
  // Store active tab in sessionStorage for persistence
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('projectProfileActiveTab') as TabKey;
      const validTabs: TabKey[] = ['dashboard', 'deliverables', 'wbs', 'updates', 'budgets', 'subcontracts', 'claims', 'users', 'attachments'];
      return savedTab && validTabs.includes(savedTab) ? savedTab : 'dashboard';
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('projectProfileActiveTab', activeTab);
    }
  }, [activeTab]);

  const { data: deliverablesData, isLoading: isDeliverablesLoading, refetch: refetchDeliverables } = useQuery({
    queryKey: ['projectDeliverableGroups', project?.id],
    queryFn: () => projectsServices.showDeliverablesAndGroups(project!.id),
    enabled: !!project?.id,
    staleTime: 60_000,
  });

  //Budgets
  const { data: budgetsData, isLoading: isBudgetLoading, refetch: refetchBudgets } = useQuery({
    queryKey: ['projectBudgets', project?.id, project?.cost_center?.id],
    queryFn: () => 
      projectsServices.showProjectBudgets({ 
        id: project!.id,
        cost_center_id: project?.cost_center?.id 
      }),
    enabled: !!project?.id,
    staleTime: 60_000,
  });

  //Timeline Activities
  const { data: timelineActivitiesData, isLoading: isTimelineActivitiesLoading, refetch: refetchTimelineActivities } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project!.id),
    enabled: !!project?.id,
    staleTime: 60_000,
  });

  // Fetch data based on active tab only when needed.
  useEffect(() => {
    if (!project?.id) return;

    const fetchDataForTab = async () => {
      if (TABS_NEEDING_DELIVERABLES.includes(activeTab) && !deliverablesData) {
        await refetchDeliverables();
      }

      if (TABS_NEEDING_TIMELINE.includes(activeTab) && !timelineActivitiesData) {
        await refetchTimelineActivities();
      }

      if (activeTab === 'budgets' && !budgetsData) {
        await refetchBudgets();
      }
    };

    fetchDataForTab();
  }, [
    activeTab,
    project?.id,
    deliverablesData,
    timelineActivitiesData,
    budgetsData,
    refetchDeliverables,
    refetchTimelineActivities,
    refetchBudgets,
  ]);

  // Prefetch heavy tabs while dashboard is open so switch is instant later.
  useEffect(() => {
    if (!project?.id) return;
    refetchDeliverables();
    refetchTimelineActivities();
  }, [project?.id, refetchDeliverables, refetchTimelineActivities]);

  // Update profile context with fetched data
  useEffect(() => {
    if (deliverablesData) updateProjectProfile({ deliverable_groups: deliverablesData });
  }, [deliverablesData, updateProjectProfile]);

  useEffect(() => {
    if (budgetsData) updateProjectProfile({ projectBudgets: budgetsData.data });
  }, [budgetsData, updateProjectProfile]);

  useEffect(() => {
    if (timelineActivitiesData) updateProjectProfile({ projectTimelineActivities: timelineActivitiesData });
  }, [timelineActivitiesData, updateProjectProfile]);

  // Combine loading states - only show loading for active tab's data
  const getIsLoading = () => {
    switch (activeTab) {
      case 'deliverables':
      case 'wbs':
      case 'updates':
      case 'subcontracts':
      case 'claims':
        return (TABS_NEEDING_DELIVERABLES.includes(activeTab) && isDeliverablesLoading) ||
               (TABS_NEEDING_TIMELINE.includes(activeTab) && isTimelineActivitiesLoading);
      case 'budgets':
        return isBudgetLoading || 
               (TABS_NEEDING_DELIVERABLES.includes(activeTab) && isDeliverablesLoading) ||
               (TABS_NEEDING_TIMELINE.includes(activeTab) && isTimelineActivitiesLoading);
      default:
        return false;
    }
  };

  const isLoading = getIsLoading();

  useEffect(() => {
    updateProjectProfile({
      deliverablesLoading: isDeliverablesLoading,
      budgetsLoading: isBudgetLoading,
      timelineLoading: isTimelineActivitiesLoading,
    });
  }, [isDeliverablesLoading, isBudgetLoading, isTimelineActivitiesLoading, updateProjectProfile]);

  useEffect(() => {
    setIsDashboardTab(activeTab === 'dashboard');
  }, [activeTab, setIsDashboardTab]);

  useEffect(() => {
    if (!showUsersTab && activeTab === 'users') {
      setActiveTab('dashboard');
    }
  }, [activeTab, showUsersTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StakeholderSelectProvider>
            <ProjectDashboard />
          </StakeholderSelectProvider>
        );
      case 'deliverables':
        return <Deliverables />;
      case 'wbs':
        return <TimelineActivitiesListItem />;
      case 'updates':
        return <Updates />;
      case 'budgets':
        return <Budgets />;
      case 'subcontracts':
        return <Subcontracts />;
      case 'claims':
        return <ProjectClaims />;
      case 'users':
        if (!showUsersTab) return null;
        return <ProjectUsers />;
      case 'attachments':
        return (
          <AttachmentForm
            hideFeatures
            attachment_sourceNo={project?.projectNo}
            attachmentable_type="project"
            attachmentable_id={project?.id}
          />
        );
      default:
        return null;
    }
  }, [activeTab, project]);

  return (
    <JumboContentLayout
      header={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack>
            <Typography variant="h4">{project?.name}</Typography>
            <Typography variant="body1">{project?.reference}</Typography>
          </Stack>
        </Stack>
      }
    >
      <Card sx={{ height: '100%', p: 1 }}>
        <Stack spacing={1}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Dashboard" value="dashboard" />
            <Tab label="Deliverables" value="deliverables" />
            <Tab label="WBS" value="wbs" />
            <Tab label="Budgets" value="budgets" />
            <Tab label="Updates" value="updates" />
            <Tab label="Subcontracts" value="subcontracts" />
            {project?.client_id && <Tab label="Claims" value="claims" />}
            {showUsersTab && <Tab label="Users" value="users" />}
            <Tab label="Attachments" value="attachments" />
          </Tabs>

          {isLoading ? (
            <Stack spacing={2} sx={{ width: '100%' }}>
              <Skeleton variant="text" width="50%" height={32} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
            </Stack>
          ) : renderTabContent}
        </Stack>
      </Card>
    </JumboContentLayout>
  );
}

export default function ProjectProfile() {
  return (
    <ProjectProfileProvider>
      <CurrencySelectProvider>
        <ProfileContent />
      </CurrencySelectProvider>
    </ProjectProfileProvider>
  );
}