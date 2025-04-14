// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/user/profile`, { withCredentials: true })
      .then(response => {
        setUser(response.data.user);
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading };
};

export default useAuth;
