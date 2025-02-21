import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
// import UserHome from './pages/UserHome';

const App = () => {
    const adminToken = useSelector((state) => state.admin.adminToken);

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                {/* <Route path="/" element={<UserHome />} /> */}
                <Route path="/admin/login" element={adminToken ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} />

                {/* Protected Admin Routes */}
                <Route path="/admin/dashboard" element={adminToken ? <AdminDashboard /> : <Navigate to="/admin/login" />} />

                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;
