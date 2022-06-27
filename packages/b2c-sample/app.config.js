import envConfig from "./env/config";

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...envConfig,
    },
  };
};
