import axios from "@/lib/services/config";

const supportServices = {};

supportServices.permissionsList = async (params) => {
  const response = await axios.get('/api/prosControl/troubleshooting/permissionsList', {
    params,  // pass all query params here directly
  });
  return response.data;
};

supportServices.prosPermissionList = async (params) => {
  const response = await axios.get('/api/prosControl/troubleshooting/prosPermissionList', {
    params,  // pass all query params here directly
  });
  return response.data;
};

supportServices.runDatabaseActions = async(formData) => {
    const {data} = await axios.post('/api/prosControl/troubleshooting/runDatabaseActions',formData);
    return data;
}

supportServices.addPermission = async(permissions) => {
    const {data} = await axios.post('/api/prosControl/troubleshooting/addPermission',permissions)
    return data;
}

supportServices.addProsPermission = async(permissions) => {
    const {data} = await axios.post('/api/prosControl/troubleshooting/addProsPermission',permissions)
    return data;
}

supportServices.updatePermission = async(permission) => {
    const {data} = await axios.put(`/api/prosControl/troubleshooting/${permission.id}/updatePermission`,permission)
    return data;
}

supportServices.updateProsPermission = async(permission) => {
    const {data} = await axios.put(`/api/prosControl/troubleshooting/${permission.id}/updateProsPermission`,permission)
    return data;
}

supportServices.deletePermission = async (permission) => {
    const {data} = await axios.delete(`/api/prosControl/troubleshooting/${permission.id}/deletePermission`);
    return data;
};

supportServices.deleteProsPermission = async (permission) => {
    const {data} = await axios.delete(`/api/prosControl/troubleshooting/${permission.id}/deleteProsPermission`);
    return data;
};

supportServices.getModules = async() => {
    const {data} = await axios.get(`/api/prosControl/troubleshooting/getModules`);
    return data;
}

export default supportServices;