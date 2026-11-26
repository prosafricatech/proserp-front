'use client'

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { useBioAccess } from '../useBioAccess';
import BioSelect from '../BioSelect';
import FarmFirstPage, { useBioFarm } from '../FarmFirstPage';
import { batchServices, speciesTemplateServices } from '../bio-production-services';
import { BioSpeciesTemplate } from '../types';
import { Batch } from './batchTypes';
import BatchForm from './BatchForm';
import BatchListItem from './BatchListItem';

const BatchesList = () => {
  const text = useDictionary().bioProduction.batches;
  const { farm } = useBioFarm();
  const access = useBioAccess().batches;
  const [status, setStatus] = useState<string | number>('');
  const [stage, setStage] = useState<string | number>('');

  // The stage names the species templates use, in the order the stages come, to filter by the stage a batch is in now.
  const { data: templates } = useQuery<{ data: BioSpeciesTemplate[] }>({
    queryKey: ['bioSpeciesTemplateStages'],
    queryFn: () => speciesTemplateServices.getList({ limit: 1000 }),
  });
  const stageOptions = useMemo(() => {
    const first = new Map<string, number>();
    (templates?.data ?? []).forEach((template) => (template.stages ?? []).forEach((each) => {
      const sequence = Number(each.sequence ?? 0);
      first.set(each.name, Math.min(first.get(each.name) ?? sequence, sequence));
    }));

    return Array.from(first.entries()).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([name]) => ({ value: name, label: name }));
  }, [templates]);

  const renderItem = React.useCallback((batch: Batch) => <BatchListItem batch={batch} />, []);

  return (
    <BioMasterList<Batch>
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioBatches'
      service={batchServices.getList}
      renderItem={renderItem}
      Form={BatchForm}
      canCreate={access.create}
      filters={{ farm_id: farm.id, status: status || undefined, stage: stage || undefined }}
      filterControls={[
        <BioSelect
          key='status'
          label={text.tables.status}
          options={[{ value: 'on progress', label: text.status['on progress'] }, { value: 'closed', label: text.status.closed }]}
          value={status}
          onChange={setStatus}
        />,
        <BioSelect key='stage' label={text.tables.stage} options={stageOptions} value={stage} onChange={setStage} />,
      ]}
    />
  );
};

const Batches = () => {
  const text = useDictionary().bioProduction.batches;

  return (
    <BioGate anyOf={[PERMISSIONS.BIO_BATCHES_READ]}>
      <FarmFirstPage title={text.pageTitle}>
        <BatchesList />
      </FarmFirstPage>
    </BioGate>
  );
};

export default Batches;
