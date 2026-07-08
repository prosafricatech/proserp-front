'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Alert, Box, Grid, ListItemText, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useProjectProfile } from '../ProjectProfileProvider';

export default function ProjectStoresList() {
  const { project }: any = useProjectProfile();
  const router = useRouter();
  const lang = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const stores: any[] = Array.isArray(project?.stores) ? project.stores : [];

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.alias?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [stores, searchQuery]);

  return (
    <Box>
      {/* Search bar — right-aligned */}
      <Grid container justifyContent="flex-end" sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <JumboSearch value={searchQuery} onChange={setSearchQuery} />
        </Grid>
      </Grid>

      {filteredStores.length === 0 ? (
        <Alert variant="outlined" severity="info">
          {stores.length === 0
            ? 'No stores linked to this project.'
            : 'No stores match your search.'}
        </Alert>
      ) : (
        filteredStores.map((store) => (
          <Grid
            key={store.id}
            container
            columnSpacing={1}
            alignItems="center"
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              px: 2,
              py: 0.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => router.push(`/${lang}/procurement/stores/${store.id}`)}
          >
            <Grid size={12}>
              <Tooltip title="Open Store">
                <ListItemText
                  primary={
                    <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0}>
                      {store.name}
                    </Typography>
                  }
                />
              </Tooltip>
            </Grid>
          </Grid>
        ))
      )}
    </Box>
  );
}
