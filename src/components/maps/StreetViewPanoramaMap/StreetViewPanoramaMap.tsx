'use client';
import { JumboCard } from '@jumbo/components';
import {
  GoogleMap,
  OverlayView,
  StreetViewPanorama,
} from '@react-google-maps/api';

const STYLES = {
  overlayView: {
    background: `red`,
    color: `white`,
    padding: 5,
    borderRadius: `50%`,
  },
};
const getPixelPositionOffset = (width: number, height: number) => {
  return { x: -(width / 2), y: -(height / 2) };
};
const StreetViewPanoramaMap = () => {
  const center = {
    lat: 51.5320665,
    lng: -0.177203,
  };
  return (
    <JumboCard
      contentWrapper
      contentSx={{ pt: 3, backgroundColor: 'background.paper' }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={center}
        zoom={8}
      >
        <StreetViewPanorama options={{ position: center, visible: true }} />
        <OverlayView
          position={{ lat: 49.28590291211115, lng: -123.11248166065218 }}
          mapPaneName={OverlayView.OVERLAY_LAYER}
          getPixelPositionOffset={getPixelPositionOffset}
        >
          <div style={STYLES.overlayView}>OverlayView</div>
        </OverlayView>
      </GoogleMap>
    </JumboCard>
  );
};

export { StreetViewPanoramaMap };
