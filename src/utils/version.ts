// 从Vite环境变量获取版本号
export const getVersion = (): string => {
  return import.meta.env.VITE_APP_VERSION || 'unknown';
};

export default import.meta.env.VITE_APP_VERSION || 'unknown';