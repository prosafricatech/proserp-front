'use client'

import React, { lazy, useEffect, useState, useCallback } from 'react';
import { Card, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import ProjectDashboard from './dashboard/ProjectDashboard';
import ProjectProfileProvider, { useProjectProfile } from './ProjectProfileProvider';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../project-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';

const AttachmentForm = lazy(() => import('@/components/filesShelf/attachments/AttachmentForm'));
const Subcontracts = lazy(() => import('./subcontracts/Subcontracts'));
const ProjectUsers = lazy(() => import('./projectUsers/ProjectUsers'));
const TimelineActivitiesListItem = lazy(() => import('./wbs/WBSListItem'));
const Deliverables = lazy(() => import('./deliverables/DeliverableGroupsListItem'));
const Budgets = lazy(() => import('./budgets/BudgetsListItem'));
const Updates = lazy(() => import('./updates/Updates'));

function ProfileContent() {
  const { project, updateProjectProfile, setIsDashboardTab } = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [fetchDeliverables, setFetchDeliverables] = useState(false);
  const [fetchTimelineActivities, setFetchTimelineActivities] = useState(false);

  // Memoize the setter functions to prevent unnecessary re-renders
  const stableSetFetchDeliverables = useCallback(setFetchDeliverables, []);
  const stableSetFetchTimelineActivities = useCallback(setFetchTimelineActivities, []);

  const { 
    data: deliverablesData, 
    isLoading: isDeliverablesLoading 
  } = useQuery({
    queryKey: ['projectDeliverableGroups', { id: project.id }],
    queryFn: () => projectsServices.showDeliverablesAndGroups(project.id),
    enabled: activeTab === 3 || fetchDeliverables,
  });

  const { 
    data: budgetsData, 
    isLoading: isBudgetLoading 
  } = useQuery({
    queryKey: ['projectBudgets', { id: project.id, cost_center: project?.cost_center?.id }],
    queryFn: projectsServices.showProjectBudgets,
    enabled: activeTab === 4,
  });

  const { 
    data: timelineActivitiesData, 
    isLoading: isTimelineActivitiesLoading 
  } = useQuery({
    queryKey: ['projectTimelineActivities', { id: project.id }],
    queryFn: () => projectsServices.showProjectTimelineActivities(project.id),
    enabled: activeTab === 1 || fetchTimelineActivities,
  });

  // Use useEffect to handle side effects when data changes
  useEffect(() => {
    if (deliverablesData) {
      updateProjectProfile({ deliverable_groups: deliverablesData });
    }
  }, [deliverablesData, updateProjectProfile]);

  useEffect(() => {
    if (budgetsData) {
      updateProjectProfile({ projectBudgets: budgetsData.data });
    }
  }, [budgetsData, updateProjectProfile]);

  useEffect(() => {
    if (timelineActivitiesData) {
      updateProjectProfile({ projectTimelineActivities: timelineActivitiesData });
    }
  }, [timelineActivitiesData, updateProjectProfile]);

  useEffect(() => {
    setIsDashboardTab(activeTab === 0);
  }, [activeTab, setIsDashboardTab]);
  
  // Only update when these specific values change
  useEffect(() => {
    if (fetchDeliverables || fetchTimelineActivities || activeTab !== 0) {
      updateProjectProfile({
        deliverablesLoading: isDeliverablesLoading,
        budgetsLoading: isBudgetLoading,
        timelineLoading: isTimelineActivitiesLoading,
      });
    }
  }, [
    activeTab, 
    isDeliverablesLoading, 
    isBudgetLoading, 
    isTimelineActivitiesLoading, 
    fetchDeliverables, 
    fetchTimelineActivities, 
    updateProjectProfile
  ]);

  // Separate useEffect for setting the functions (only once)
  useEffect(() => {
    updateProjectProfile({
      setFetchDeliverables: stableSetFetchDeliverables,
      setFetchTimelineActivities: stableSetFetchTimelineActivities,
    });
  }, [stableSetFetchDeliverables, stableSetFetchTimelineActivities, updateProjectProfile]);

  const isLoading = !fetchDeliverables && !fetchTimelineActivities && Object.values({
    deliverables: isDeliverablesLoading,
    budgets: isBudgetLoading,
    timeline: isTimelineActivitiesLoading,
  }).some(Boolean);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <StakeholderSelectProvider>
            <ProjectDashboard />
          </StakeholderSelectProvider>
        );
      case 1:
        return <TimelineActivitiesListItem />;
      case 2:
        return <Updates />;
      case 3:
        return <Deliverables />;
      case 4:
        return <Budgets />;
      case 5:
        return <Subcontracts />;
      case 6:
        return <ProjectUsers />;
      case 7:
        return (
          <AttachmentForm
            hideFeatures
            attachment_sourceNo={project.projectNo}
            attachmentable_type="project"
            attachmentable_id={project.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <JumboContentLayout
      header={
        <>
          <Typography variant="h4">{project.name}</Typography>
          <Typography variant="body1">{project.reference}</Typography>
        </>
      }
    >
      <Card sx={{ height: '100%', padding: 1 }}>
        <Stack spacing={1} direction="column">
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Dashboard" />
            <Tab label="WBS" />
            <Tab label="Updates" />
            <Tab label="Deliverables" />
            <Tab label="Budgets" />
            <Tab label="Subcontracts" />
            <Tab label="Users" />
            <Tab label="Attachments" />
          </Tabs>
          {!fetchDeliverables && !fetchTimelineActivities && isLoading ? (
            <LinearProgress />
          ) : (
            renderTabContent()
          )}
        </Stack>
      </Card>
    </JumboContentLayout>
  );  
}

function ProjectProfile() {
  return (
    <ProjectProfileProvider>
      <CurrencySelectProvider>
        <ProfileContent />
      </CurrencySelectProvider>
    </ProjectProfileProvider>
  );
}

export default ProjectProfile;