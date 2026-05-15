'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  AddPhotoAlternateOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  DeleteOutlined,
  DragHandleOutlined,
  Star,
  StarOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert,
  Box,
  Button,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import productServices from '../productServices';

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = ({ photos, index, onClose }) => {
  const [current, setCurrent] = useState(index);
  const photo = photos[current];

  const prev = (e) => { e.stopPropagation(); setCurrent((i) => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setCurrent((i) => (i + 1) % photos.length); };

  return (
    <Dialog open onClose={onClose} maxWidth={false} PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', m: 1 } }}>
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          <CloseOutlined />
        </IconButton>

        {/* Counter */}
        <Box sx={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          {current + 1} / {photos.length}
          {photo.is_main && (
            <Box component='span' sx={{ ml: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 1, px: 0.75, py: 0.2, fontSize: 11, fontWeight: 700 }}>Main</Box>
          )}
        </Box>

        {/* Prev */}
        {photos.length > 1 && (
          <IconButton onClick={prev} sx={{ position: 'absolute', left: 12, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ChevronLeftOutlined sx={{ fontSize: 36 }} />
          </IconButton>
        )}

        {/* Image */}
        <Box
          component='img'
          src={photo.full_path}
          alt='product photo'
          onClick={(e) => e.stopPropagation()}
          sx={{ maxHeight: '85vh', maxWidth: '90vw', borderRadius: 2, objectFit: 'contain', boxShadow: 8 }}
        />

        {/* Next */}
        {photos.length > 1 && (
          <IconButton onClick={next} sx={{ position: 'absolute', right: 12, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ChevronRightOutlined sx={{ fontSize: 36 }} />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
};

// ─── Upload Dialog ────────────────────────────────────────────────────────────

const UploadDialog = ({ open, onClose, productId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (files) => productServices.uploadProductPhotos({ productId, files }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productPhotos', productId] });
      queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      enqueueSnackbar('Photos uploaded successfully', { variant: 'success' });
      handleClose();
    },
    onError: (e) => enqueueSnackbar(e?.response?.data?.message || 'Upload failed', { variant: 'error' }),
  });

  const handleClose = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    onClose();
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removePreview = (index) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if (previews.length === 0) return;
    upload(previews.map((p) => p.file));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Add Photos</DialogTitle>
      <DialogContent>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/gif,image/bmp,image/webp'
          multiple
          hidden
          onChange={handleFiles}
        />
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            mb: 2,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <AddPhotoAlternateOutlined sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant='body2' color='text.secondary'>
            Click to select photos
          </Typography>
          <Typography variant='caption' color='text.disabled'>
            JPG, PNG, GIF, BMP, WEBP · max 10 MB each · multiple allowed
          </Typography>
        </Box>

        {previews.length > 0 && (
          <Grid container spacing={1}>
            {previews.map((p, i) => (
              <Grid key={i} size={{ xs: 6, sm: 4 }}>
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                  <CardMedia
                    component='img'
                    image={p.url}
                    alt={p.file.name}
                    sx={{ height: 100, objectFit: 'cover' }}
                  />
                  <IconButton
                    size='small'
                    onClick={() => removePreview(i)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                    }}
                  >
                    <CloseOutlined fontSize='small' />
                  </IconButton>
                  <Typography
                    variant='caption'
                    noWrap
                    sx={{ display: 'block', px: 0.5, py: 0.25, bgcolor: 'background.paper', fontSize: 10 }}
                  >
                    {p.file.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={previews.length === 0 || isPending}
          startIcon={isPending ? <CircularProgress size={16} /> : <UploadOutlined />}
        >
          Upload {previews.length > 0 ? `(${previews.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

const DeleteConfirmDialog = ({ open, onClose, onConfirm, isPending }) => (
  <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
    <DialogTitle>Delete Photo</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this photo? This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={isPending}>Cancel</Button>
      <Button
        variant='contained'
        color='error'
        onClick={onConfirm}
        disabled={isPending}
        startIcon={isPending ? <CircularProgress size={16} /> : <DeleteOutlined />}
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Photo Card ───────────────────────────────────────────────────────────────

const PhotoCard = ({ photo, productId, canEdit, isDragging, onPreview }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { mutate: setMain, isPending: isSettingMain } = useMutation({
    mutationFn: () => productServices.setMainProductPhoto({ productId, photoId: photo.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productPhotos', productId] });
      queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      enqueueSnackbar('Main photo updated', { variant: 'success' });
    },
    onError: (e) => enqueueSnackbar(e?.response?.data?.message || 'Failed to set main', { variant: 'error' }),
  });

  const { mutate: deletePhoto, isPending: isDeleting } = useMutation({
    mutationFn: () => productServices.deleteProductPhoto({ productId, photoId: photo.id }),
    onSuccess: () => {
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productPhotos', productId] });
      queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      enqueueSnackbar('Photo deleted', { variant: 'success' });
    },
    onError: (e) => {
      setConfirmOpen(false);
      enqueueSnackbar(e?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    },
  });

  const isBusy = isSettingMain || isDeleting;

  return (
    <>
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          position: 'relative',
          width: 140,
          flexShrink: 0,
          borderRadius: 2,
          overflow: 'hidden',
          border: photo.is_main ? 2 : 1,
          borderColor: photo.is_main ? 'primary.main' : 'divider',
        }}
      >
        <CardMedia
          component='img'
          image={photo.full_path}
          alt='product photo'
          onClick={onPreview}
          sx={{ height: 120, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
        />

        {photo.is_main && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Main
          </Box>
        )}

        {isBusy && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.6)',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        {canEdit && !isBusy && (
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.45)', px: 0.5 }}
          >
            <Tooltip title='Drag to reorder'>
              <IconButton size='small' {...attributes} {...listeners} sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
                <DragHandleOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            {!photo.is_main ? (
              <Tooltip title='Set as main photo'>
                <IconButton size='small' onClick={() => setMain()} sx={{ color: 'white' }}>
                  <StarOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title='Main photo'>
                <IconButton size='small' disabled sx={{ color: 'warning.main' }}>
                  <Star fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Delete photo'>
              <IconButton size='small' onClick={() => setConfirmOpen(true)} sx={{ color: 'error.light' }}>
                <DeleteOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <DeleteConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deletePhoto()}
        isPending={isDeleting}
      />
    </>
  );
};

// ─── Main Gallery ─────────────────────────────────────────────────────────────

const ProductGallery = ({ product }) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const canEdit = checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [orderedIds, setOrderedIds] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['productPhotos', product.id],
    queryFn: () => productServices.getProductPhotos(product.id),
    enabled: !!product.id,
  });

  const { mutate: reorder, isPending: isReordering } = useMutation({
    mutationFn: (order) => productServices.reorderProductPhotos({ productId: product.id, order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productPhotos', product.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOrderedIds(null);
      enqueueSnackbar('Order saved', { variant: 'success' });
    },
    onError: (e) => {
      setOrderedIds(null);
      enqueueSnackbar(e?.response?.data?.message || 'Failed to reorder', { variant: 'error' });
    },
  });

  const sortedPhotos = orderedIds
    ? [...photos].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
    : photos;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sortedPhotos.findIndex((p) => p.id === active.id);
    const newIndex = sortedPhotos.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(sortedPhotos, oldIndex, newIndex).map((p) => p.id);
    setOrderedIds(newOrder);
    reorder(newOrder);
  };

  if (isLoading) {
    return (
      <Stack direction='row' gap={1.5} flexWrap='wrap' p={1}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant='rectangular' width={140} height={120} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' mb={1.5} px={0.5}>
        <Typography variant='subtitle2' color='text.secondary'>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </Typography>
        {canEdit && (
          <Button
            size='small'
            variant='outlined'
            startIcon={<AddPhotoAlternateOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            Add Photos
          </Button>
        )}
      </Stack>

      {photos.length === 0 ? (
        <Alert variant='outlined' severity='info' sx={{ borderRadius: 2 }}>
          No photos yet.{canEdit ? ' Click "Add Photos" to upload.' : ''}
        </Alert>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedPhotos.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
            <Stack direction='row' gap={1.5} flexWrap='wrap'>
              {sortedPhotos.map((photo, idx) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  productId={product.id}
                  canEdit={canEdit}
                  isDragging={activeId === photo.id}
                  onPreview={() => setLightboxIndex(idx)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      {lightboxIndex !== null && (
        <Lightbox photos={sortedPhotos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {canEdit && (
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          productId={product.id}
        />
      )}
    </Box>
  );
};

export default ProductGallery;

