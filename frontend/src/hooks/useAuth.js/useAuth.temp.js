import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import moment from "moment";

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
        setIsAuth(true);
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      // TEMPORAL: Deshabilitar auto-refresh para evitar bucle
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('Auth error - redirecting to login');
        localStorage.removeItem("token");
        localStorage.removeItem("companyId");
        api.defaults.headers.Authorization = undefined;
        setIsAuth(false);
        history.push("/login");
      }
      return Promise.reject(error);
    }
  );

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // TEMPORAL: Simplificar verificación de token
    if (token) {
      try {
        // Solo verificar si el token existe, no hacer refresh automático
        api.defaults.headers.Authorization = `Bearer ${JSON.parse(token)}`;
        setIsAuth(true);
        // TODO: Hacer una llamada simple para verificar si el token es válido
      } catch (err) {
        console.log('Token error:', err);
        localStorage.removeItem("token");
        localStorage.removeItem("companyId");
        setIsAuth(false);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth", userData);
      localStorage.setItem("token", JSON.stringify(data.token));
      localStorage.setItem("companyId", data.user.companyId);
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      setIsAuth(true);
      toast.success(i18n.t("auth.toasts.success"));
      history.push("/tickets");
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoading(true);
    localStorage.removeItem("token");
    localStorage.removeItem("companyId");
    api.defaults.headers.Authorization = undefined;
    setUser({});
    setIsAuth(false);
    setLoading(false);
    history.push("/login");
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout
  };
};

export default useAuth;