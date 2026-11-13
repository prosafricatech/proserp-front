import axios from "@/lib/services/config";

const crud = (path) => ({
  getList: async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(path, { params: { page, limit, ...queryParams } });
    return data;
  },
  get: async (id) => {
    const { data } = await axios.get(`${path}/${id}`);
    return data;
  },
  add: async (payload) => {
    const { data } = await axios.post(path, payload);
    return data;
  },
  update: async (payload) => {
    const { data } = await axios.put(`${path}/${payload.id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`${path}/${id}`);
    return data;
  },
});

export const farmServices = crud('/api/bioProduction/farms');
export const reportServices = {
  get: async (report, params) => (await axios.get(`/api/bioProduction/reports/${report}`, { params })).data,
  excel: async (report, params) => (await axios.post(`/api/bioProduction/reports/${report}`, params, { responseType: 'blob' })).data,
};

export const unitGroupServices = crud('/api/bioProduction/unitGroups');
export const productionUnitServices = {
  ...crud('/api/bioProduction/productionUnits'),
  addMany: async (payload) => (await axios.post('/api/bioProduction/productionUnits/bulk', payload)).data,
  moveToGroup: async (payload) => (await axios.post('/api/bioProduction/productionUnits/move-to-group', payload)).data,
  getEnvironment: async (id, params = {}) => (await axios.get(`/api/bioProduction/productionUnits/${id}/environment`, { params })).data,
};
export const measurementParameterServices = crud('/api/bioProduction/measurementParameters');
export const speciesTemplateServices = crud('/api/bioProduction/speciesTemplates');

const batchPath = '/api/bioProduction/batches';

const post = async (url, payload) => {
  const { data } = await axios.post(url, payload);
  return data;
};

const put = async (url, payload) => {
  const { data } = await axios.put(url, payload);
  return data;
};

export const batchServices = {
  ...crud(batchPath),
  // Batch actions all take the batch id alongside their payload.
  advanceStage: ({ id, ...payload }) => post(`${batchPath}/${id}/advance-stage`, payload),
  undoStage: ({ id }) => post(`${batchPath}/${id}/undo-stage`, {}),
  correctOpening: ({ id, ...payload }) => post(`${batchPath}/${id}/correct-opening`, payload),
  mergeTargets: async (id) => (await axios.get(`${batchPath}/${id}/merge-targets`)).data,
  mergePreview: async ({ id, ...params }) => (await axios.get(`${batchPath}/${id}/merge-preview`, { params })).data,
  merge: ({ id, ...payload }) => post(`${batchPath}/${id}/merge`, payload),
  undoMerge: ({ id }) => post(`${batchPath}/${id}/undo-merge`, {}),
  updateStage: ({ id, stageId, ...payload }) => put(`${batchPath}/${id}/stages/${stageId}`, payload),
  transfer: ({ id, ...payload }) => post(`${batchPath}/${id}/transfers`, payload),
  recordMortality: ({ id, ...payload }) => post(`${batchPath}/${id}/mortalities`, payload),
  updateMortality: ({ id, eventId, ...payload }) => put(`${batchPath}/${id}/mortalities/${eventId}`, payload),
  deleteMortality: async ({ id, eventId }) => (await axios.delete(`${batchPath}/${id}/mortalities/${eventId}`)).data,
  recordWeightSampling: ({ id, ...payload }) => post(`${batchPath}/${id}/weight-samplings`, payload),
  recordInput: ({ id, ...payload }) => post(`${batchPath}/${id}/inputs`, payload),
  updateInput: ({ id, eventId, ...payload }) => put(`${batchPath}/${id}/inputs/${eventId}`, payload),
  addExpense: ({ id, ...payload }) => post(`${batchPath}/${id}/expenses`, payload),
  writeOffMortality: ({ id, ...payload }) => post(`${batchPath}/${id}/mortality-writeoffs`, payload),
  harvest: ({ id, ...payload }) => post(`${batchPath}/${id}/harvests`, payload),
  updateHarvest: ({ id, harvestId, ...payload }) => put(`${batchPath}/${id}/harvests/${harvestId}`, payload),
  deleteHarvest: async ({ id, harvestId }) => (await axios.delete(`${batchPath}/${id}/harvests/${harvestId}`)).data,
  updateProduce: ({ id, collectionId, ...payload }) => put(`${batchPath}/${id}/produce/${collectionId}`, payload),
  deleteProduce: async ({ id, collectionId }) => (await axios.delete(`${batchPath}/${id}/produce/${collectionId}`)).data,
  collectProduce: ({ id, ...payload }) => post(`${batchPath}/${id}/produce`, payload),
  getProduce: async (id, params = {}) => (await axios.get(`${batchPath}/${id}/produce`, { params })).data,
  getProduceCostPreview: async (id, date) => (await axios.get(`${batchPath}/${id}/produce-cost-preview`, { params: { date } })).data,
  close: ({ id, ...payload }) => post(`${batchPath}/${id}/close`, payload),
  getSummary: async (id) => (await axios.get(`${batchPath}/${id}/summary`)).data,
  getFeedProjection: async (id, params = {}) => (await axios.get(`${batchPath}/${id}/feed-projection`, { params })).data,
  getInputs: async (id, params = {}) => (await axios.get(`${batchPath}/${id}/inputs`, { params })).data,
  getExpenses: async (id, params = {}) => (await axios.get(`${batchPath}/${id}/expenses`, { params })).data,
  getMortalities: async (id, params = {}) => (await axios.get(`${batchPath}/${id}/mortalities`, { params })).data,
  getWriteOffPreview: async (id) => (await axios.get(`${batchPath}/${id}/mortality-writeoff-preview`)).data,
  deleteInput: async ({ id, eventId }) => (await axios.delete(`${batchPath}/${id}/inputs/${eventId}`)).data,
  deleteExpense: async ({ id, expenseId }) => (await axios.delete(`${batchPath}/${id}/expenses/${expenseId}`)).data,
};

export const dashboardServices = {
  get: async (params) => (await axios.get('/api/bioProduction/dashboard', { params })).data,
  trend: async (params) => (await axios.get('/api/bioProduction/dashboard/trend', { params })).data,
  feedProjection: async (params) => (await axios.get('/api/bioProduction/dashboard/feed-projection', { params })).data,
};

const roundPath = '/api/bioProduction/rounds';

export const roundServices = {
  /** How an amount would be shared over the open batches of a farm or group; nothing is saved. */
  spreadCost: (payload) => post(`${roundPath}/costs/spread`, payload),
  getList: async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;

    return (await axios.get(roundPath, { params: { page, limit, ...queryParams } })).data;
  },
  get: async (id) => (await axios.get(`${roundPath}/${id}`)).data,
  delete: async (id) => (await axios.delete(`${roundPath}/${id}`)).data,
  getBatches: async (farmId, params = {}) => (await axios.get(`${roundPath}/batches`, { params: { farm_id: farmId, ...params } })).data,
  saveFeeding: (payload) => post(`${roundPath}/feeding`, payload),
  saveMortality: (payload) => post(`${roundPath}/mortality`, payload),
  saveWeighing: (payload) => post(`${roundPath}/weights`, payload),
  saveHarvest: (payload) => post(`${roundPath}/harvests`, payload),
  updateHarvest: (id, payload) => put(`${roundPath}/${id}/harvests`, payload),
  saveProduce: (payload) => post(`${roundPath}/produce`, payload),
  updateProduce: (id, payload) => put(`${roundPath}/${id}/produce`, payload),
  saveMeasurement: (payload) => post(`${roundPath}/measurements`, payload),
  updateMeasurement: (id, payload) => put(`${roundPath}/${id}/measurements`, payload),
  saveCost: (payload) => post(`${roundPath}/costs`, payload),
  updateCost: (id, payload) => put(`${roundPath}/${id}/costs`, payload),
  updateFeeding: (id, payload) => put(`${roundPath}/${id}/feeding`, payload),
  updateMortality: (id, payload) => put(`${roundPath}/${id}/mortality`, payload),
  updateWeighing: (id, payload) => put(`${roundPath}/${id}/weights`, payload),
};
