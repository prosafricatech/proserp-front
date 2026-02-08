const { default: axios } = require("./config");

const helperServices = {};

helperServices.getUsers = async () => {
  const { data } = await axios.get('/api/sharedComponents/getUsers');
  return data;
}

export default helperServices;
 