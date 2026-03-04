import axios from "@/lib/services/config";

const prosAfricansServices = {};

prosAfricansServices.getSubscriptionsList = async (params) => {
  const response = await axios.get('/api/prosControl/subscriptions', {
    params,  // pass all query params here directly
  });
  return response.data;
};

prosAfricansServices.getUsers = async (params) => {
  const response = await axios.get('/api/prosControl/prosafricans/getUsers', {
    params,  // pass all query params here directly
  });
  return response.data;
};

prosAfricansServices.addRole = async(roleData) => {
    const {data} = await axios.post(`/api/prosControl/prosafricans/addRole`,roleData);
    return data;
}

prosAfricansServices.permissionOptions = async() => {
    const {data} = await axios.get(`/api/prosControl/prosafricans/permissionOptions`);
    return data;
}

prosAfricansServices.roles = async() => {
    const {data} = await axios.get(`/api/prosControl/prosafricans/roles`);
    return data;
}

prosAfricansServices.checkMember = async(email) => {
    const {data} = await axios.get(`/api/prosControl/prosafricans/checkMember/${email}`)
    return data;
}

prosAfricansServices.addMember = async(addMemberData) => {
    const {data} = await axios.post(`/api/prosControl/prosafricans/addMember`,{users: addMemberData});
    return data;
}

prosAfricansServices.userDetachAction = async(data) => {
    const action = data;
    const {data: responseData} = await axios.delete(`/api/prosControl/prosafricans/${action.user_id}/userDetachAction`, { data: action });
    return responseData;
}

prosAfricansServices.userLeaveAction = async(data) => {
    const action = data;
    const {data: responseData} = await axios.delete(`/api/prosControl/prosafricans/${action.user_id}/userLeaveAction`, { data: action });
    return responseData;
}

 prosAfricansServices.saveUserRoles = async(user,selectedRoles) => {
    const {data} = await axios.put(`/api/prosControl/prosafricans/saveUserRoles`,{
        user_id: user.id,
        role_ids: selectedRoles
    });
    return data;
}

export default prosAfricansServices;