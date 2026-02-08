import axios from "@/lib/services/config";

interface AuthResponse {
    data?: {
        authUser?: any;
        authOrganization?: any;
    };
    status?: number;
    hasError?: boolean;
    error?: string;
}

interface UserData {
    [key: string]: any;
}

interface TokenMetadata {
    geolocation_accuracy?: number;
    latitude?: number;
    longitude?: number;
    fcm_token?: string;
}

const authServices = {
    async getCurrentUser(): Promise<AuthResponse> {
        try {
            const response = await axios.get("/api/auth/getuser");
            return response.data;
        } catch (e) {
            return {
                hasError: true,
                error: "Some error received from the API",
            };
        }
    },

    async signUp(userData: UserData): Promise<any> {
        try {
            return await axios.post('/api/auth/register', userData);
        } catch (e) {
            return Promise.reject(e);
        }
    },

    async updateAuthTokenMetaData(metadata: TokenMetadata): Promise<any> {
        try {
            return await axios.post('/api/auth/update-authTokenMetadata', metadata);
        } catch (e) {
            return Promise.reject(e);
        }
    }
};

export default authServices;