import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginAdmin } from '../services/adminService';
import { loginSuccess } from '../redux/slices/adminSlice';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = await loginAdmin(email, password);
        if (data.error) {
            alert(data.error);
        } else {
            dispatch(loginSuccess(data.token));
            navigate('/admin/dashboard');
        }
    };

    return (
        <div className="login-container">
            <h2>Admin Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default AdminLogin;
