import { SalesShift } from "./SalesShiftType";

interface QueryParams {
    stationId?: string;
    keyword?: string;
    from?: string | null;
    to?: string | null;
    page?: number;
    limit?: number;
}

interface PaginatedResponse {
    data: SalesShift[];
    total: number;
    current_page: number;
    last_page: number;
}

interface SalesShiftServices {
    getStationShifts: (params: { queryParams: QueryParams }) => Promise<PaginatedResponse>;
    createSalesShift: (data: any) => Promise<any>;
    updateSalesShift: (id: number, data: any) => Promise<any>;
    deleteSalesShift: (id: number) => Promise<any>;
}

// Mock service - replace with actual API calls later
const salesShiftServices: SalesShiftServices = {
  getStationShifts: async (params: { queryParams: QueryParams }) => {
    console.log('Mock: getStationShifts', params);
    
    // Return mock data that matches PaginatedResponse interface
    const mockSalesShifts: SalesShift[] = [
      {
        id: 1,
        shift_team_id: 1,
        shift_team: {
          id: 1,
          name: "Morning Shift",
          description: "Morning shift team",
          ledger_ids: [1, 2],
          ledgers: []
        },
        station_id: 1,
        station: {
          id: 1,
          name: "Main Station",
          users: [],
          shift_teams: [],
          fuel_pumps: []
        },
        shift_start: new Date().toISOString(),
        shift_end: null,
        submit_type: 'open',
        product_prices: [],
        pump_readings: [],
        fuel_vouchers: [],
        main_ledger: { id: 1, amount: 150000 },
        other_ledgers: []
      },
      {
        id: 2,
        shift_team_id: 2,
        shift_team: {
          id: 2,
          name: "Evening Shift",
          description: "Evening shift team",
          ledger_ids: [3, 4],
          ledgers: []
        },
        station_id: 1,
        station: {
          id: 1,
          name: "Main Station",
          users: [],
          shift_teams: [],
          fuel_pumps: []
        },
        shift_start: new Date(Date.now() - 86400000).toISOString(), // yesterday
        shift_end: new Date().toISOString(),
        submit_type: 'close',
        product_prices: [],
        pump_readings: [],
        fuel_vouchers: [],
        main_ledger: { id: 2, amount: 200000 },
        other_ledgers: []
      }
    ];

    return {
      data: mockSalesShifts,
      total: mockSalesShifts.length,
      current_page: 1,
      last_page: 1
    };
  },

  createSalesShift: async (data: any) => {
    console.log('Mock: createSalesShift', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      message: 'Sales shift created successfully',
      data: {
        id: Math.floor(Math.random() * 1000) + 3, // Generate random ID
        ...data
      }
    };
  },

  updateSalesShift: async (id: number, data: any) => {
    console.log('Mock: updateSalesShift', id, data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      message: 'Sales shift updated successfully',
      data: {
        id,
        ...data
      }
    };
  },

  deleteSalesShift: async (id: number) => {
    console.log('Mock: deleteSalesShift', id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      message: 'Sales shift deleted successfully',
      deletedId: id
    };
  }
};

// Additional methods that might be used by other components
export const salesShiftServiceExtensions = {
  getSalesShiftDetails: async (id: number): Promise<SalesShift> => {
    console.log('Mock: getSalesShiftDetails', id);
    
    // Return mock sales shift details
    return {
      id,
      shift_team_id: 1,
      shift_team: {
        id: 1,
        name: "Morning Shift",
        description: "Morning shift team",
        ledger_ids: [1, 2],
        ledgers: []
      },
      station_id: 1,
      station: {
        id: 1,
        name: "Main Station",
        users: [],
        shift_teams: [],
        fuel_pumps: []
      },
      shift_start: new Date().toISOString(),
      shift_end: null,
      submit_type: 'open',
      product_prices: [
        { product_id: 1, price: 2500 },
        { product_id: 2, price: 3000 }
      ],
      pump_readings: [
        { pump_id: 1, product_id: 1, tank_id: 1, opening: 1000, closing: 800 },
        { pump_id: 2, product_id: 2, tank_id: 2, opening: 1500, closing: 1200 }
      ],
      fuel_vouchers: [
        { stakeholder_id: 1, product_id: 1, quantity: 50, reference: "V001" },
        { stakeholder_id: null, product_id: 2, quantity: 30, expense_ledger_id: 5 }
      ],
      main_ledger: { id: 1, amount: 150000 },
      other_ledgers: [
        { id: 2, amount: 50000 },
        { id: 3, amount: 25000 }
      ]
    };
  },

  closeSalesShift: async (id: number) => {
    console.log('Mock: closeSalesShift', id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      message: 'Sales shift closed successfully',
      data: {
        id,
        shift_end: new Date().toISOString(),
        submit_type: 'close'
      }
    };
  }
};

// For backward compatibility, you can also attach these to the main object
(salesShiftServices as any).getSalesShiftDetails = salesShiftServiceExtensions.getSalesShiftDetails;
(salesShiftServices as any).closeSalesShift = salesShiftServiceExtensions.closeSalesShift;

export default salesShiftServices;