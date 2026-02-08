'use client';
import { JumboCard } from '@jumbo/components';
import { Div } from '@jumbo/shared';
import { Button, Typography } from '@mui/material';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import React from 'react';

const STYLES = {
  mapContainer: {
    height: 100,
  },
  overlayView: {
    background: '#fff',
    border: '1px solid #ccc',
    padding: 2,
    width: 300,
  },
};

const getPixelPositionOffset = (width: number, height: number) => {
  return { x: -(width / 2), y: -(height / 2) };
};

const OverlayMap = () => {
  const [count, setCount] = React.useState<number>(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <JumboCard
      contentWrapper
      contentSx={{ pt: 3, backgroundColor: 'background.paper' }}
    >
      <GoogleMap
        id='overlay-view-example'
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={{ lat: 47.646935, lng: -122.303763 }}
        zoom={15}
      >
        <OverlayView
          position={{ lat: 47.646935, lng: -122.303763 }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={getPixelPositionOffset}
        >
          <Div sx={STYLES.overlayView}>
            <Typography variant={'h1'}>OverlayView</Typography>
            <Button variant={'contained'} onClick={handleClick}>
              {count === 0
                ? 'Clicked'
                : `I have been clicked ${count} time${count === 1 ? '' : 's'}`}
            </Button>
          </Div>
        </OverlayView>
      </GoogleMap>
    </JumboCard>
  );
};

export { OverlayMap };
