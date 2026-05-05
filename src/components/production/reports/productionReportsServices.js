import axios from '@/lib/services/config';

const productionReportsServices = {};

productionReportsServices.getOutputReport = async (params) => {
  const { data } = await axios.get('/api/manufacturing/batches/productionOutputReport', {
    params,
  });
  return data;
};

productionReportsServices.getCostReport = async (params) => {
  const { data } = await axios.get('/api/manufacturing/batches/productionCostReport', {
    params,
  });
  return data;
};

export default productionReportsServices;
