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

userLedgerServices.getUserLedgersList = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/accountsAndFinance/user-ledgers', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

userLedgerServices.getUserLedgerPayments = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/accountsAndFinance/user-ledger-payments', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

userLedgerServices.getUserLedgers = async (userId) => {
  const { data } = await axios.get(`/api/accountsAndFinance/users/${userId}/ledgers`);
  return data;
};

export default userLedgerServices;