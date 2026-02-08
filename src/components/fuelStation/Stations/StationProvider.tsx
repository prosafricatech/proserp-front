'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import stationServices from './station-services';
import { Station } from './StationType';

interface StationContextType {
  activeStation: Station | null;
  setActiveStation: (station: Station | null) => void;
  userStations: Station[];
  isLoading: boolean;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const useSalesStation = () => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useSalesStation must be used within a StationProvider');
  }
  return context;
};

interface StationProviderProps {
  children: React.ReactNode;
}

const StationProvider: React.FC<StationProviderProps> = ({ children }) => {
  const { authUser } = useJumboAuth();
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [userStations, setUserStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user ID from authUser
  const getUserId = () => {
    return authUser?.user?.id || null;
  };

  // Fetch user stations when authUser changes
  useEffect(() => {
    const fetchUserStations = async () => {
      const userId = getUserId();
      
      if (!userId) {
        setUserStations([]);
        setActiveStation(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await stationServices.getUserStations({ 
          userId: userId 
        });
        

        const stations = Array.isArray(response) ? response.map((station: any) => ({
          ...station
        })) : [];

        setUserStations(stations);
        
        // REMOVED the auto-selection logic
        // Let the user explicitly select a station
        
      } catch (error) {
        console.error('Error fetching user stations:', error);
        setUserStations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStations();
  }, [authUser?.user?.id]);

  const value = {
    activeStation,
    setActiveStation,
    userStations,
    isLoading
  };

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
};

export default StationProvider;