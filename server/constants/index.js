import dotenv from "dotenv";
dotenv.config();

const Constants = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    OTP_EXPIRATION_TIME: 1000 * 60 * 10,
    OTP_RESEND_TIME: 1000 * 60 * 2,
    MAX_FILE_SIZE: 10,
    MAX_VIDEO_FILE_SIZE: 15,
    USER_STATUS: {
        PENDING: 1,
        ACTIVE: 2,
        SUSPENDED: 3,
        INACTIVE: 4,
    },
};

export default Constants;