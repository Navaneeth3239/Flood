export * from './incidents';
export * from './alerts';
export * from './safetyInfo';

export const isMockDataEnabled = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_USE_MOCK_DATA === true;
};
