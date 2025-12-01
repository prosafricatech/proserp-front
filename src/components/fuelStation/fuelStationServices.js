import axios from "@/lib/services/config";

const fuelStationServices = {};

fuelStationServices.getStationShifts = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/fuelStations/salesShifts/${queryParams.stationId}/getStationShifts`, {
        params: { page, limit, ...queryParams }
    });
    return data;
}

fuelStationServices.getStationDippings = async ({queryKey}) => {
    const {page, limit, queryParams} = queryKey[queryKey.length - 1];
    const {data} = await axios.get(`/fuel-stations/${queryParams.stationId}/dippings`, {
        params: {
            page: page,
            limit: limit,
            ...queryParams
        }
    });
    return data;
};

fuelStationServices.getStationsList = async ({queryKey}) => {
    const {page, limit, queryParams} = queryKey[queryKey.length - 1];
    const {data} = await axios.get('/api/fuelStations/stations', {
        params: {
            page: page,
            limit: limit,
            ...queryParams
        }
    });
    return data;
};

fuelStationServices.dippingReport = async(params) => {
    const {data} = await axios.get(`/fuel-stations/dipping-report`,{
        params
    })
    return data;
}

fuelStationServices.getUserStations = async({queryKey}) => {
    const { userId } = queryKey[1]; 
    console.log(userId)
    if (!userId) {
      throw new Error('User ID is required');
    }
    const { data } = await axios.get(`/api/fuelStations/stations/${userId}/userStations`);
    return data;
}

fuelStationServices.retrieveLastReadings = async(params) => {
    const {data} = await axios.get(`/fuel-stations/${params.stationId}/shift-predecessor`,{
        params
    });
    return data;
}

fuelStationServices.showStation = async (id) => {
    const {data} = await axios.get(`/fuel-stations/stations/${id}`);
    return data;
}

fuelStationServices.showshiftDetails = async (id) => {
    const {data} = await axios.get(`/api/fuelStations/salesShifts/${id}/showshiftDetails`);
    return data;
}

fuelStationServices.showDippingDetails = async (id) => {
    const {data} = await axios.get(`/fuel-stations/dippings/${id}`);
    return data;
}

fuelStationServices.addStation = async(station) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/fuel-stations/stations',station)
        return data;
    })
}

fuelStationServices.addSalesShifts = async(salesShift) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/fuelStations/salesShifts/add',salesShift)
        return data;
    })
}

fuelStationServices.editStation = async(station) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/fuel-stations/stations/${station.id}`,station)
        return data;    
    })
}

fuelStationServices.updateSalesShifts = async(salesShift) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/fuelStations/salesShifts/${salesShift.id}/update`,salesShift)
        return data;    
    })
}

fuelStationServices.deleteStation = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/fuel-stations/stations/${id}`);
        return data;
    })
};

fuelStationServices.deleteSalesShift = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/fuelStations/salesShifts/${id}/delete`);
        return data;
    })
};

fuelStationServices.deleteDipping = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/fuel-stations/dippings/${id}`);
        return data;
    })
};

export default fuelStationServices;