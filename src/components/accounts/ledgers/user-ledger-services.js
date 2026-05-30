import axios from '@/lib/services/config';

const userLedgerServices = {};

userLedgerServices.linkUser = async (payload) => {
  const { data } = await axios.post('/api/accountsAndFinance/user-ledgers', payload);
  return data;
};

userLedgerServices.unlinkUser = async (id) => {
  const { data } = await axios.delete(`/api/accountsAndFinance/user-ledgers/${id}`);
  return data;
};

userLedgerServices.getMyLedgers = async () => {
  const { data } = await axios.get('/api/accountsAndFinance/my-ledgers');
  return data;
};

userLedgerServices.getUserLedgers = async (userId) => {
  const { data } = await axios.get(`/api/accountsAndFinance/users/${userId}/ledgers`);
  return data;
};

export default userLedgerServices;