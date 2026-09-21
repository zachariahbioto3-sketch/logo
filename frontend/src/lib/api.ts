import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

const AUTH_ROUTES = ["/auth/login/", "/auth/signup/", "/auth/refresh/"];

api.interceptors.request.use((config) => {
  const isAuthRoute = AUTH_ROUTES.some(r => config.url?.includes(r));
  if (!isAuthRoute) {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const isAuthRoute = AUTH_ROUTES.some(r => err.config?.url?.includes(r));
    if (err.response?.status === 401 && !isAuthRoute) {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const res = await axios.post("http://127.0.0.1:8000/api/auth/refresh/", { refresh });
          localStorage.setItem("access", res.data.access);
          err.config.headers.Authorization = `Bearer ${res.data.access}`;
          return axios(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

