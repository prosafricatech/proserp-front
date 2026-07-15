import axios from '@/lib/services/config';

const rfqServices = {};

// ==================== RFQ CRUD ====================

/**
 * Get paginated list of RFQs
 * @param {Object} params - Query parameters (keyword, status, limit, page)
 * @returns {Promise<Object>} Paginated response envelope with data array
 */
rfqServices.getList = async (params) => {
  const { data } = await axios.get('/api/rfqs', { params });
  return data;
};

/**
 * Get single RFQ with full details including items, stakeholders, and responses
 * @param {number} id - RFQ ID
 * @returns {Promise<Object>} Full RFQ object
 */
rfqServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/rfqs/${id}`);
  return data;
};

/**
 * Create new RFQ
 * @param {Object} payload - RFQ create payload (rfq_date, response_deadline, items[], stakeholder_ids[])
 * @returns {Promise<Object>} Created RFQ with id
 */
rfqServices.add = async (payload) => {
  const { data } = await axios.post('/api/rfqs', payload);
  return data;
};

/**
 * Update existing RFQ
 * @param {Object} payload - RFQ update payload (must include id, replaces full items[] and stakeholder_ids[])
 * @returns {Promise<Object>} Updated RFQ
 */
rfqServices.update = async (payload) => {
  const { data } = await axios.put(`/api/rfqs/${payload.id}`, payload);
  return data;
};

/**
 * Delete RFQ (blocked if responses exist)
 * @param {Object} payload - Object with id property
 * @returns {Promise<Object>} Success message
 */
rfqServices.delete = async (payload) => {
  const { data } = await axios.delete(`/api/rfqs/${payload.id}`);
  return data;
};

// ==================== RFQ Comparison & Analysis ====================

/**
 * Get items × supplier quotes matrix (normalized to base currency)
 * @param {number} id - RFQ ID
 * @returns {Promise<Object>} Comparison object with items[], each containing quotes[]
 */
rfqServices.getComparison = async (id) => {
  const { data } = await axios.get(`/api/rfqs/${id}/comparison`);
  return data;
};

// ==================== RFQ Response Recording (Phase 2) ====================

/**
 * Record supplier quote response for an RFQ
 * @param {number} rfqId - RFQ ID
 * @param {Object} payload - Response payload (stakeholder_id, currency_id, exchange_rate, response_date, validity_date, items[])
 * @returns {Promise<Object>} Created response with id
 */
rfqServices.addResponse = async (rfqId, payload) => {
  const { data } = await axios.post(`/api/rfqs/${rfqId}/responses`, payload);
  return data;
};

/**
 * Update supplier quote response (replaces all response items)
 * @param {Object} payload - Response update payload (must include id, replaces full items[])
 * @returns {Promise<Object>} Updated response
 */
rfqServices.updateResponse = async (payload) => {
  const { data } = await axios.put(`/api/rfq-responses/${payload.id}`, payload);
  return data;
};

/**
 * Delete supplier quote response
 * @param {Object} payload - Object with id property
 * @returns {Promise<Object>} Success message
 */
rfqServices.deleteResponse = async (payload) => {
  const { data } = await axios.delete(`/api/rfq-responses/${payload.id}`);
  return data;
};

export default rfqServices;
