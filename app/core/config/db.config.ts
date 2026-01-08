const { MONGODB_HOST, MONGODB_NAME, MONGODB_USER: user, MONGODB_PASS: pass } = process.env;

export default {
  url: `${MONGODB_HOST}/${MONGODB_NAME}`,
  options: {
    user,
    pass
  }
};
