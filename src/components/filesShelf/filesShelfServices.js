import axios from "@/lib/services/config";

const filesShelfServices = {};

filesShelfServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/filesShelf`, {
        params: { page, limit, ...queryParams }
    });
    return data;
}

export default filesShelfServices;