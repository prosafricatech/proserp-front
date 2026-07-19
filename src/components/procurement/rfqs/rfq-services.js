import axios from '@/lib/services/config';

const rfqServices = {};

rfqServices.getList = async (params) => {
  const { data } = await axios.get('/api/rfqs', { params });
  return data;
};

rfqServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/rfqs/${id}`);
  return data;
};

rfqServices.add = async (payload) => {
  const { data } = await axios.post('/api/rfqs', payload);
  return data;
};

rfqServices.update = async (payload) => {
  const { data } = await axios.put(`/api/rfqs/${payload.id}`, payload);
  return data;
};

rfqServices.delete = async (payload) => {
  const { data } = await axios.delete(`/api/rfqs/${payload.id}`);
  return data;
};

rfqServices.getComparison = async (id) => {
  const { data } = await axios.get(`/api/rfqs/${id}/comparison`);
  return data;
};

rfqServices.addResponse = async (rfqId, payload) => {
  const { data } = await axios.post(`/api/rfqs/${rfqId}/responses`, payload);
  return data;
};

rfqServices.getResponse = async (id) => {
  const { data } = await axios.get(`/api/rfqs/${id}/responses`);
  return data;
};

rfqServices.updateResponse = async (payload) => {
  const { data } = await axios.put(`/api/rfqs/responses/${payload.id}`, payload);
  return data;
};

rfqServices.deleteResponse = async (payload) => {
  const { data } = await axios.delete(`/api/rfq-responses/${payload.id}`);
  return data;
};

export default rfqServices;
