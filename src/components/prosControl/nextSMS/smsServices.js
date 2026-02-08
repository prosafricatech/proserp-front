import axios from "@/lib/services/config";

const smsServices = {};

// Send single SMS
smsServices.sendSingleSms = async (payload) => {
  return await axios.get('/sanctum/csrf-cookie').then(async () => {
    const { data } = await axios.post('/api/prosControl/sms/send-single', payload);
    return data;
  });
};

// Send one text to multiple users
smsServices.sendSingleTextMultiUsers = async (payload) => {
  return await axios.get('/sanctum/csrf-cookie').then(async () => {
    const { data } = await axios.post('/api/prosControl/sms/send-multi-users', payload);
    return data;
  });
};

// Send multiple texts to multiple users
smsServices.sendMultiTextMultiUsers = async (payload) => {
  return await axios.get('/sanctum/csrf-cookie').then(async () => {
    const { data } = await axios.post('/api/prosControl/sms/send-multi-messages', payload);
    return data;
  });
};

// Check balance
smsServices.checkBalance = async () => {
  const { data } = await axios.get('/api/prosControl/sms/balance');
  return data;
};

// Delivery report
smsServices.getDeliveryReport = async () => {
  const { data } = await axios.get(`/api/prosControl/sms/delivery-report`);
  return data;
};

// Sent logs
smsServices.getLogs = async (params) => {
  const { data } = await axios.get('/api/prosControl/sms/logs', { params });
  return data;
};

export default smsServices;
