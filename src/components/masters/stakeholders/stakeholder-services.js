import axios from "@/lib/services/config";

const stakeholderServices = {};

// Use your own Next.js API route for fetching stakeholders
stakeholderServices.getList = async ({ type, keyword, page, limit }) => {
    const response = await axios.get('/api/masters/stakeholders', {
        params: { type, keyword, page, limit },
    });
    return response.data;
},

// Use your own Next.js API route for select options
stakeholderServices.getSelectOptions = async (type = "all") => {
  const { data } = await axios.get("/api/masters/stakeholders/options", {
    params: { type }
  });
  return data;
};

// Use your own Next.js API route for fetching ledgers
stakeholderServices.getLedgers = async (params) => {
  const { data } = await axios.get(`/api/masters/stakeholders/${params.stakeholder_id}/ledgers`, {
    params
  });
  return data;
};

// This should POST to your API route (e.g. `POST /api/masters/stakeholders`)
stakeholderServices.add = async (formData) => {
  const { data } = await axios.post("/api/masters/stakeholders/add", formData);
  return data;
};

// This should PUT to your API route (e.g. `PUT /api/masters/stakeholders/:id`)
stakeholderServices.update = async (stakeholder) => {
  const { data } = await axios.put(`/api/masters/stakeholders/${stakeholder.id}/update`, stakeholder);
  return data;
};

// This should DELETE to your API route (e.g. `DELETE /api/masters/stakeholders/:id`)
stakeholderServices.delete = async (id) => {
  const { data } = await axios.delete(`/api/masters/stakeholders/${id}/delete`);
  return data;
};

export default stakeholderServices;
