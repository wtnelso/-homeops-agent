// Feature flag configuration
export const IS_LIVE = import.meta.env.VITE_APP_IS_LIVE === 'TRUE' || false;
export const IS_MOCK_LOGGED_IN = import.meta.env.VITE_MOCK_LOGGED_IN === 'TRUE' || false;
