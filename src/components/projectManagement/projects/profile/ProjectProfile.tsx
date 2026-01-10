'use client';

import { lazy, useEffect, useMemo, useState } from 'react';
import { Card, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import ProjectDashboard from './dashboard/ProjectDashboard';
import ProjectProfileProvider, { useProjectProfile } from './ProjectProfileProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import projectsServices from '../project-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import ProjectClaims from './claims/ProjectClaims';

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
  const queryClient = useQueryClient();
  
  // Store active tab in sessionStorage for persistence
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    // Get saved tab from sessionStorage or default to 'dashboard'
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
    queryFn: () => projectsServices.showDeliverablesAndGroups(project.id),
  });

  //Budgets
  const { data: budgetsData, isLoading: isBudgetLoading, refetch: refetchBudgets } = useQuery({
    queryKey: ['projectBudgets', project?.id, project?.cost_center?.id],
    queryFn: projectsServices.showProjectBudgets,
  });

  //Timeline Activities
  const { data: timelineActivitiesData, isLoading: isTimelineActivitiesLoading, refetch: refetchTimelineActivities } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project.id),
  });

  // Clear cache and fetch fresh data when tab changes
  useEffect(() => {
    if (!project?.id) return;

    // Clear existing cache for fresh data
    queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups', project.id] });
    queryClient.invalidateQueries({ queryKey: ['projectBudgets', project.id, project.cost_center?.id] });
    queryClient.invalidateQueries({ queryKey: ['projectTimelineActivities', project.id] });

    // Fetch data based on active tab
    const fetchDataForTab = async () => {
      switch (activeTab) {
        case 'deliverables':
        case 'wbs':
        case 'updates':
        case 'budgets':
        case 'subcontracts':
        case 'claims':
          // These tabs need deliverables
          if (TABS_NEEDING_DELIVERABLES.includes(activeTab)) {
            await refetchDeliverables();
          }
          // These tabs need timeline
          if (TABS_NEEDING_TIMELINE.includes(activeTab)) {
            await refetchTimelineActivities();
          }
          break;
        case 'budgets':
          await refetchBudgets();
          break;
      }
    };

    fetchDataForTab();
  }, [activeTab, project?.id]);

  // Initial data fetch when component mounts
  useEffect(() => {
    if (project?.id && TABS_NEEDING_DELIVERABLES.includes(activeTab)) {
      refetchDeliverables();
    }
    if (project?.id && TABS_NEEDING_TIMELINE.includes(activeTab)) {
      refetchTimelineActivities();
    }
    if (project?.id && activeTab === 'budgets') {
      refetchBudgets();
    }
  }, [project?.id]);

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
        <>
          <Typography variant="h4">{project?.name}</Typography>
          <Typography variant="body1">{project?.reference}</Typography>
        </>
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
            <Tab label="Users" value="users" />
            <Tab label="Attachments" value="attachments" />
          </Tabs>

          {isLoading ? <LinearProgress /> : renderTabContent}
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