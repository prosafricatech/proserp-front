'use client';

import { lazy, useEffect, useMemo, useState } from 'react';
import { Card, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import ProjectDashboard from './dashboard/ProjectDashboard';
import ProjectProfileProvider, { useProjectProfile } from './ProjectProfileProvider';
import { useQuery } from '@tanstack/react-query';
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
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  //Deliverables & Groups
  const { data: deliverablesData, isLoading: isDeliverablesLoading } = useQuery({
    queryKey: ['projectDeliverableGroups', project?.id],
    queryFn: () => projectsServices.showDeliverablesAndGroups(project.id),
    enabled: !!project?.id && TABS_NEEDING_DELIVERABLES.includes(activeTab),
  });

  //Budgets
  const { data: budgetsData, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['projectBudgets', project?.id, project?.cost_center?.id],
    queryFn: projectsServices.showProjectBudgets,
    enabled: !!project?.id && activeTab === 'budgets',
  });

  //Timeline Activities
  const { data: timelineActivitiesData, isLoading: isTimelineActivitiesLoading } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project.id),
    enabled: !!project?.id && TABS_NEEDING_TIMELINE.includes(activeTab),
  });

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

  const isLoading = isDeliverablesLoading || isBudgetLoading || isTimelineActivitiesLoading;

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
            onChange={(_, newValue) => setActiveTab(newValue)}
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