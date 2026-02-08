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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
         const {data} = await axios.post(`/api/prosControl/prosafricans/addRole`,roleData);
         return data;
     })
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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/prosControl/prosafricans/addMember`,{users: addMemberData});
        return data;
    })
}

prosAfricansServices.userDetachAction = async(data) => {
    const action = data;
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/prosControl/prosafricans/${action.user_id}/userDetachAction`, action);
        return data; 
    })
}

prosAfricansServices.userLeaveAction = async(data) => {
    const action = data;
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/prosControl/prosafricans/${action.user_id}/userLeaveAction`, action);
        return data; 
    })
}

 prosAfricansServices.saveUserRoles = async(user,selectedRoles) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/prosControl/prosafricans/saveUserRoles`,{
            user_id: user.id,
            role_ids: selectedRoles
        });
        return data;
    })
}

export default prosAfricansServices;