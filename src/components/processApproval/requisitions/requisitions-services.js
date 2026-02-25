import axios from 'axios';

const requisitionsServices = {
  // ...other handlers
  expenseBudgetCheck: async ({ ledger_id, cost_center_id }) => {
    const response = await axios.post('/expense-budget-check', {
      ledger_id,
      cost_center_id,
    });
    return response.data;
  },
};

export default requisitionsServices;
