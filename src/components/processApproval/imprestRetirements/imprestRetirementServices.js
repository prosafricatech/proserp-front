import axios from '@/lib/services/config';

const imprestRetirementServices = {};

imprestRetirementServices.list = async (params = {}) => {
  const { data } = await axios.get('/api/imprest-retirements', { params });
  return data;
};

imprestRetirementServices.show = async (id) => {
  const { data } = await axios.get(`/api/imprest-retirements/${id}`);
  return data;
};

imprestRetirementServices.add = async (payload) => {
  const { data } = await axios.post('/api/imprest-retirements', payload);
  return data;
};

imprestRetirementServices.update = async (payload) => {
  const { data } = await axios.put(`/api/imprest-retirements/${payload.id}`, payload);
  return data;
};

imprestRetirementServices.delete = async (id) => {
  const { data } = await axios.delete(`/api/imprest-retirements/${id}`);
  return data;
};

imprestRetirementServices.submit = async (id) => {
  const { data } = await axios.post(`/api/imprest-retirements/${id}/submit`);
  return data;
};

imprestRetirementServices.approve = async (payload) => {
  const { data } = await axios.post('/api/imprest-retirement-approvals', payload);
  return data;
};

imprestRetirementServices.updateApproval = async (payload) => {
  const { data } = await axios.put(`/api/imprest-retirement-approvals/${payload.id}`, payload);
  return data;
};

imprestRetirementServices.revokeApproval = async ({ approvalId, remarks = '' }) => {
  const { data } = await axios.delete(`/api/imprest-retirement-approvals/${approvalId}`, {
    data: { remarks },
  });
  return data;
};

export default imprestRetirementServices;
