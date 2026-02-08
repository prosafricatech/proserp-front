'use client';
import { JumboCard } from '@jumbo/components';
import { Circle, GoogleMap, InfoWindow } from '@react-google-maps/api';
import React from 'react';

const GeoLocationMap = () => {
  const [center, setCenter] = React.useState({ lat: 0, lng: 0 });
  const [content, setContent] = React.useState<string>('');
  const [radius, setRadius] = React.useState(6000);

  React.useEffect(() => {
    if (navigator?.geolocation) {
      navigator?.geolocation?.getCurrentPosition(
        (position) => {
          if (center?.lat === 0 && center?.lng === 0) {
            setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setContent(`Location found using HTML5.`);
            setRadius(Math.max(radius - 20, 0));
          }
        },
        (failure) => {
          setContent(`Your browser does not support geolocation.`);
        }
      );
    }
  }, [center?.lat, center?.lng, radius]);

  return (
    <JumboCard
      contentWrapper
      contentSx={{ pt: 3, backgroundColor: 'background.paper' }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '400px' }}
        center={center}
        zoom={10}
      >
        {center && (
          <InfoWindow position={center}>
            <div>{content}</div>
          </InfoWindow>
        )}
        {center.lat !== 0 && center.lng !== 0 && (
          <Circle
            center={center}
            radius={radius}
            options={{
              fillColor: 'red',
              fillOpacity: 0.4,
              strokeColor: 'white',
              strokeOpacity: 1,
              strokeWeight: 1,
            }}
          />
        )}
      </GoogleMap>
    </JumboCard>
  );
};

export { GeoLocationMap };
