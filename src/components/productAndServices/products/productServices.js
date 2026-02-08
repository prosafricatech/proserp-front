import axios from "@/lib/services/config";

const productServices = {};

productServices.getList = async (params) => {
  const response = await axios.get('/api/masters/products', {
    params,  // pass all query params here directly
  });
  return response.data;
},

productServices.downloadExcelTemplate = async (stores) => {
    const { data } = await axios.post(`/api/masters/products/downloadExcelTemplate`, stores, {
      responseType: 'blob',
    });      
    return data;
};

productServices.getProductSelectOptions = async() => {
    const {data} = await axios.get(`/api/masters/products/getProductSelectOptions`);
    return data;
}

productServices.getStoreBalances = async(params) => {
    const {data} = await axios.get(`/api/masters/products/${params.productId}/getStoreBalances`,{
        params
    });
    return data;
}

productServices.secondaryUnits = async (id) => {
    const {data} = await axios.get(`/api/masters/products/${id}/secondaryUnits`);
    return data;
}

productServices.getProductMovements = async (params) => {
    const {data} = await axios.get(`/api/masters/products/${params.product_id}/getProductMovements`,{
        params
    })
    return data;
}

productServices.getUnitCosts = async(params) => {
    const {data} = await axios.get(`/api/masters/products/${params.product_id}/getUnitCosts`,{
        params
    });
    return data;
}

productServices.getSellingPrices = async(params) => {
    const {data} = await axios.get(`/api/masters/products/${params.productId}/getSellingPrices`,{
        params
    });
    return data;
}

productServices.getProductBrands = async() => {
    const {data} = await axios.get(`/api/masters/products/getProductBrands`);
    return data;
}

productServices.getProductNames = async() => {
    const {data} = await axios.get(`/api/masters/products/getProductNames`);
    return data;
}

productServices.getProductParams = async() => {
    const {data} = await axios.get(`/api/masters/products/getProductParams`);
    return data;
}

productServices.getProductSpecifications = async() => {
    const {data} = await axios.get(`/api/masters/products/getProductSpecifications`);
    return data;
}

productServices.add = async(product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/products/add`,product)
        return data;
    })
}

productServices.addSecondaryUnit = async(product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/products/${product.id}/addSecondaryUnit`,product)
        return data;
    })
}

productServices.importProductsExcel = async(postData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const formData = new FormData();
        Object.keys(postData).forEach((key) => {
            if(key === 'products_excel') {
                // If the value is a FileList (like it will be for file inputs),
                // append the first file in the list.
                formData.append(key, postData[key][0]);
            } else {
                formData.append(key, postData[key] !== 'null' ? postData[key] : null);
            }
        });

        const {data} = await axios.post(`/api/masters/products/importProductsExcel`,formData,{
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data;
    })
}

productServices.update = async(product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/products/${product.id}/update`,product)
        return data;
    })
}

productServices.updateUnit = async(product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/products/${product.id}/updateUnit`,product)
        return data;
    })
}

productServices.delete = async (product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/products/${product.id}/delete`);
        return data;
    })
};

productServices.deleteUnit = async ({productId, unitId}) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/products/${productId}/deleteUnit/${unitId}`);
        return data;
    })
};

productServices.ItemMovementDownloadExcel = async (params) => {
  const response = await axios.post(
    `/api/masters/products/${params.product_id}/ItemMovementDownloadExcel`,
    params,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

productServices.mergeProducts = async(product) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/products/mergeProducts`,product)
        return data;
    })
}

export default productServices;