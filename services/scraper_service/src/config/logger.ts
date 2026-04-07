export const logger = {
  info: (message: string) => {
    console.log(`ℹ️ [INFO]: ${message}`);
  },

  error: (message: string) => {
    console.error(`❌ [ERROR]: ${message}`);
  },

  warn: (message: string) => {
    console.warn(`⚠️ [WARN]: ${message}`);
  }
};