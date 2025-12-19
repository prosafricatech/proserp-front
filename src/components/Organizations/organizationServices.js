import axios from "../../lib/services/config";

const organizationServices = {
  // GET METHODS
  getList: async ({ type, keyword, page, limit }) => {
    const response = await axios.get("/api/organizations", {
      params: { type, keyword, page, limit },
    });

    return response.data;
  },

  getUsers: async (params = {}) => {
    const { page = 1, limit = 10, organizationId, ...rest } = params;
    const { data } = await axios.get(`/api/organizations/${organizationId}/profileUsers`, {
      params: { page, limit, ...rest },
    });
    return data;
  },

  getOrganizationUsers: async (params = {}) => {
    const { organizationId, keyword = '', ...rest } = params;
    const { data } = await axios.get(`/api/organizations/${organizationId}/getOrganizationUsers`, {
      params: {
        keyword,
        ...rest,
      },
    });

    return data;
  },

  getOptions: async () => {
    const { data } = await axios.get("/api/organizations/get_options");
    return data;
  },

  getPermissionOptions: async (id) => {
    const { data } = await axios.get(`/api/organizations/${id}/permission_options`);
    return data;
  },

  getRoles: async (organizationId) => {
    const { data } = await axios.get(`/api/organizations/${organizationId}/roles`);
    return data;
  },

  // POST/PUT METHODS with CSRF cookie protection
  create: async (organization) => {
    await axios.get('/sanctum/csrf-cookie');
    const formData = buildFormData(organization);
    const { data } = await axios.post("/api/organizations", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (organization) => {
    await axios.get('/sanctum/csrf-cookie');
    const formData = buildFormData(organization);
    const { data } = await axios.post(
      `/api/organizations/${organization.id}/update`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  addInvitee: async (organizationId, email) => {
    const { data } = await axios.get(
      `/api/organizations/${organizationId}/user_to_invite`,
      { params: { email } }
    );
    return data;
  },

  addRole: async (roleData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const {data} = await axios.post(`/api/organizations/${roleData.organization_id}/new-role`,roleData);
      return data;
    })
  },

  inviteUsers: async (organizationId, invitationsData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const {data} = await axios.post(`/api/organizations/${organizationId}/invite_users`,{invitees: invitationsData});
      return data;
    })
  },

  saveUserRoles: async (organizationId, userId, roleIds) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const {data} = await axios.put(`/api/organizations/${organizationId}/edit-user-roles`,{
        user_id: userId,
        role_ids: roleIds
      });
      return data;
    })
  },

  userDetachAction: async (organizationId, actionData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const {data} = await axios.put(`/api/organizations/${organizationId}/detach-user`, actionData);
      return data; 
    })
  },

  userLeaveAction: async (organizationId, actionData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const {data} = await axios.put(`/api/organizations/${organizationId}/detach-user`, actionData);
      return data; 
    })
  },

  loadOrganization: async (params) => {
    const { data } = await axios.put(`/api/organizations/${params.organization_id}/load`, {
      organization_id: params.organization_id,
    });
    return data;
  },
};

// Helper function for form data construction
export function buildFormData(data) {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value === null || value === undefined) return;

    if (value instanceof FileList) {
      if (value.length > 0) {
        formData.append(key, value[0]);
      }
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export default organizationServices;
