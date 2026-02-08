import axios from "@/lib/services/config";

const attachmentsServices = {};

attachmentsServices.addAttachment = async(postData) => {
  return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
    const formData = new FormData();
      Object.keys(postData).forEach((key) => {
        if(key === 'file') {
          formData.append(key, postData[key][0]);
        } else {
          formData.append(key, postData[key] !== 'null' ? postData[key] : null);
        }
      }
    );

    const { data } = await axios.post('/api/attachment/add', formData,{
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data;
  })
}

attachmentsServices.attachments = async(params) => {
  const {data} = await axios.get(`/api/attachment/getAttachments`,{
    params
  });
  return data;
}

attachmentsServices.deleteAttachment = async (id) => {
  return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
    const {data} = await axios.delete(`/api/attachment/${id}/delete`);
    return data;
  })
};

attachmentsServices.updateAttachment = async(attachment) => {
  return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
    const {data} = await axios.put(`/api/attachment/${attachment.id}/update`,attachment)
    return data;
  });
}

export default attachmentsServices;
