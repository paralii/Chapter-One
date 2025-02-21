import axios from 'axios';

export const loginAdmin = async (email, password) => {
    try {
        const response = await axios.post('http://localhost:5000/api/admin/login', { email, password }, { withCredentials: true });
        return response.data;
    } catch (error) {
        return { error: error.response.data.message };
    }
};
