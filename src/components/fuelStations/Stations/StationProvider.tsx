'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { Station } from './StationType';
import stationServices from './station-services';

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
        // PASS USER ID to the service
        const response = await stationServices.getUserStations({ 
          userId: userId 
        });
        

        const stations = Array.isArray(response) ? response.map((station: any) => ({
          id: station.id,
          name: station.name,
          address: station.address,
          description: station.description,
          users: station.users,
          shift_teams: station.shift_teams,
          fuel_pumps: station.fuel_pumps,
          ledger: station.ledger,
          product: station.product
        })) : [];

        setUserStations(stations);
        
        // Auto-select first station if available
        if (stations.length > 0 && !activeStation) {
          setActiveStation(stations[0]);
        }
      } catch (error) {
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