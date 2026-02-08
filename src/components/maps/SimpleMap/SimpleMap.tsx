'use client';
import { JumboCard } from '@jumbo/components';
import { GoogleMap } from '@react-google-maps/api';

const SimpleMap = () => {
  return (
    <JumboCard
      contentWrapper
      contentSx={{ pt: 3, backgroundColor: 'background.paper' }}
    >
      <GoogleMap
        zoom={3}
        center={{ lat: 20.75056525, lng: 73.730039 }}
        mapContainerStyle={{ width: '100%', height: '400px' }}
      />
    </JumboCard>
  );
};

export { SimpleMap };
