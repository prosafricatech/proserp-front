import axios from "@/lib/services/config";

const projectsServices = {};

projectsServices.getList = async (params) => {
  const response = await axios.get('/api/projectManagement/project', {
    params,
  });
  return response.data;
};

projectsServices.getSubcontractsList = async (params) => {
  const response = await axios.get(`/api/projectManagement/project/${params.project_id}/getSubcontractsList`, {
    params,
  });
  return response.data;
};

projectsServices.projectUpdatesList = async (params) => {
  const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectUpdatesList`, {
    params,
  });
  return response.data;
}

projectsServices.projectClaimsList = async (params) => {
  const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectClaimsList`, {
    params,
  });
  return response.data;
}

projectsServices.projectUsersList = async (params) => {
  const response = await axios.get(`/api/projectManagement/project/${params.project_id}/projectUsersList`, {
    params,
  });
  return response.data;
}


projectsServices.getSubContractMaterialIssued = async (params) => {
  const response = await axios.get(
    `/api/projectManagement/project/${params.subcontract_id}/getSubContractMaterialIssued`,
    { params }
  );
  return response.data;
};

projectsServices.getCertificates = async (params) => {
  const response = await axios.get(
    `/api/projectManagement/project/${params.subcontract_id}/getCertificates`,
    { params }
  );
  return response.data;
};

projectsServices.getSubContractDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getSubContractDetails`);
    return data;
}

projectsServices.getClaimDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getClaimDetails`);
    return data;
}

projectsServices.getCertificateDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getCertificateDetails`);
    return data;
}

projectsServices.detachUsers = async (costCenterId, payload) => {
    const { data } = await axios.put(
        `/api/accountsAndFinance/cost-centers/${costCenterId}/detach-users`,
        payload
    );
    return data;
};


projectsServices.getSubcontractOptions = async (id) => {
  const { data } = await axios.get(`/api/projectManagement/project/getSubcontractOptions`, {
    params: { project_id: id }
  });
  return data;
};

projectsServices.getSubContractMaterialIssuedDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getSubContractMaterialIssuedDetails`);
    return data;
}

projectsServices.getSubContractTasks = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getSubContractTasks`);
    return data;
}

projectsServices.getbudgetItemsDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/getbudgetItemsDetails`);
    return data;
}

projectsServices.showProjectBudgets = async (params) => {
  const response = await axios.get(`/api/projectManagement/project/showProjectBudgets`, {
    params,
  });
  return response.data;
};  

projectsServices.addProject = async(project) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addProject',project)
        return data;
    })
}

projectsServices.addSubContractTask = async(tasks) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addSubContractTask',tasks)
        return data;
    })
}

projectsServices.addCertificates = async(certificate) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addCertificates',certificate)
        return data;
    })
}

projectsServices.addClaim = async(claim) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addClaims',claim)
        return data;
    })
}

projectsServices.addSubContractMaterialIssued = async(tasks) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addSubContractMaterialIssued',tasks)
        return data;
    })
}

projectsServices.addSubcontract = async(project) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addSubcontract',project)
        return data;
    })
}

projectsServices.addDeliverableGroup = async(group) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addDeliverableGroup',group)
        return data;
    })
}

projectsServices.addTimelineActivity = async(activity) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addTimelineActivity',activity)
        return data;
    })
}

projectsServices.addProjectUpdates = async(updates) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addProjectUpdates',updates)
        return data;
    })
}

projectsServices.addDeliverables = async(deliverable) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addDeliverables',deliverable)
        return data;
    })
}

projectsServices.addTask = async(task) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addTask',task)
        return data;
    })
}

projectsServices.addBudget = async(budget) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/projectManagement/project/addBudget',budget)
        return data;
    })
}

projectsServices.addBudgetItems = async(budget) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/projectManagement/project/addBudgetItems`,budget)
        return data;
    })
}

projectsServices.updateDeliverableGroup = async(group) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${group.id}/updateDeliverableGroup`,group)
        return data;    
    })
}

projectsServices.updateTimelineActivity = async(activity) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${activity.id}/updateTimelineActivity`,activity)
        return data;    
    })
}

projectsServices.updateSubContractTask = async(subContractTask) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${subContractTask.id}/updateSubContractTask`,subContractTask)
        return data;    
    })
}

projectsServices.updateCertificates = async(certificate) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${certificate.id}/updateCertificates`,certificate)
        return data;    
    })
}

projectsServices.updateDeliverables = async(deliverable) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${deliverable.id}/updateDeliverables`,deliverable)
        return data;    
    })
}

projectsServices.updateClaim = async(claim) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${claim.id}/updateClaim`,claim)
        return data;    
    })
}

projectsServices.updateProjectUpdates = async(update) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${update.id}/updateProjectUpdates`,update)
        return data;    
    })
}

projectsServices.updateSubcontract = async(subcontract) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${subcontract.id}/updateSubcontract`,subcontract)
        return data;    
    })
}

projectsServices.updateSubContractMaterialIssued = async(material) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${material.id}/updateSubContractMaterialIssued`,material)
        return data;    
    })
}

projectsServices.updateProject = async(project) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${project.id}/updateProject`,project)
        return data;    
    })
}

projectsServices.EditTask = async(task) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${task.id}/EditTask`,task)
        return data;    
    })
}

projectsServices.EditBudget = async(budget) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/projectManagement/project/${budget.id}/EditBudget`,budget)
        return data;    
    })
}

projectsServices.showDeliverablesAndGroups = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/showDeliverablesAndGroups`);
    return data;
}

projectsServices.showProjectTimelineActivities = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/showProjectTimelineActivities`);
    return data;
}

projectsServices.projectUpdateDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/projectUpdateDetails`);
    return data;
}

projectsServices.showProjectTaskDetails = async (taskId) => {
    const {data} = await axios.get(`/api/projectManagement/project/${taskId}/showProjectTaskDetails`);
    return data;
}

projectsServices.showSubcontractTaskDetails = async (taskId, certificateDate) => {
    const { data } = await axios.get(
        `/api/projectManagement/project/${taskId}/showSubcontractTaskDetails`,
        {
            params: {
                as_at: certificateDate
            }
        }
    );
    return data;
};

projectsServices.showDelUncertifiedQTY = async (delId, claimDate) => {
    const { data } = await axios.get(
        `/api/projectManagement/project/${delId}/showDelUncertifiedQTY`,
        {
            params: {
                as_at: claimDate
            }
        }
    );
    return data;
};

projectsServices.showDeliverableDetails = async (id) => {
    const {data} = await axios.get(`/api/projectManagement/project/${id}/showDeliverableDetails`);
    return data;
}

projectsServices.showProject = async({queryKey}) => {
    const id = queryKey[1]?.id;
    const {data} = await axios.get(`/api/projectManagement/project/${id}/showProject`)
    return data;
}

projectsServices.getProjectRevenue = async (projectId) => {
    const {data} = await axios.get(`/api/projectManagement/project/${projectId}/revenue`);
    return data;
}

projectsServices.getProjectBudget = async (projectId) => {
    const {data} = await axios.get(`/api/projectManagement/project/${projectId}/budget`);
    return data;
}

projectsServices.getProjectProgress = async (projectId) => {
    const {data} = await axios.get(`/api/projectManagement/project/${projectId}/progress`);
    return data;
}

projectsServices.deleteProject = async (project_id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${project_id}/deleteProject`);
        return data;
    })
};

projectsServices.deleteExistingBudgetItem = async ({ id, type }) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
      const { data } = await axios.delete(`/api/projectManagement/project/deleteExistingBudgetItem/${type}/${id}`);
      return data;
    });
};  

projectsServices.deleteDeliverableGroup = async (group) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${group.id}/deleteDeliverableGroup`);
        return data;
    })
};

projectsServices.deleteTimelineActivity = async (activity) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${activity.id}/deleteTimelineActivity`);
        return data;
    })
};

projectsServices.deleteDeliverable = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteDeliverable`);
        return data;
    })
};

projectsServices.deleteTask = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteTask`);
        return data;
    })
};

projectsServices.deleteClaim = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteClaim`);
        return data;
    })
};

projectsServices.deleteBudget = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteBudget`);
        return data;
    })
};

projectsServices.deleteSubContractTask = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContractTask`);
        return data;
    })
};

projectsServices.deleteSubContract = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContract`);
        return data;
    })
};

projectsServices.deleteCertificate = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteCertificate`);
        return data;
    })
};

projectsServices.deleteSubContractMaterialIssued = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteSubContractMaterialIssued`);
        return data;
    })
};

projectsServices.deleteUpdate = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/projectManagement/project/${id}/deleteUpdate`);
        return data;
    })
};

export default projectsServices;