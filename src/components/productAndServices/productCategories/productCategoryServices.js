import axios from "@/lib/services/config";

const productCategoryServices = {};

productCategoryServices.getList = async ({ type, keyword, page, limit }) => {
    const response = await axios.get('/api/masters/products/product_categories', {
      params: { type, keyword, page, limit },
    });
    return response.data;
},

productCategoryServices.getCategoryOptions = async() => {
    const {data} = await axios.get(`/api/masters/products/product_categories/getCategoryOptions`);
    return data;
}

productCategoryServices.add = async(productCategory) => {
   return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/products/product_categories/add`,productCategory)
        return data;
    })
}

productCategoryServices.update = async(productCategory) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/products/product_categories/${productCategory.id}/update`,productCategory)
        return data;
    });
}


productCategoryServices.delete = async (productCategory) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/products/product_categories/${productCategory.id}/delete`);
        return data;
    })
};


export default productCategoryServices;