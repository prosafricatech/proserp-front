import axios from "@/lib/services/config";

const moduleSettingsServices = {};

moduleSettingsServices.updateSettings = async(updatedSettings) => {
    const {data} = await axios.post(`/api/sharedComponents/moduleSettings`,updatedSettings);
    return data;
}

export default moduleSettingsServices;