'use client';
import { JumboCard } from '@jumbo/components';
import { GoogleMap, InfoBox } from '@react-google-maps/api';

const StyledMap = () => {
  const center = { lat: 5.33, lng: 0.12 };
  const options = { closeBoxURL: '', enableEventPropagation: true };
  return (
    <JumboCard
      contentWrapper
      contentSx={{ pt: 3, backgroundColor: 'background.paper' }}
    >
      <GoogleMap
        zoom={2}
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={center}
      >
        <InfoBox options={options} onLoad={() => {}}>
          <div
            style={{ backgroundColor: 'yellow', opacity: 0.75, padding: 20 }}
          >
            <div style={{ fontSize: 16, color: `#08233B` }}>Taipei</div>
          </div>
        </InfoBox>
      </GoogleMap>
    </JumboCard>
  );
};

export { StyledMap };
