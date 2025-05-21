// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/profile`, { withCredentials: true })
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
