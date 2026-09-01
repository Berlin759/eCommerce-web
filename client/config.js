export const serverUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const checkConfig = (server) => {
    let config = {};
    switch (server) {
        case "production":
            config = {
                baseUrl: serverUrl,
            };
            break;
        case "local":
            config = {
                baseUrl: serverUrl,
            };
            break;
        default:
            break;
    }
    return config;
};

export const selectServer = "local";
export const config = checkConfig(selectServer);
