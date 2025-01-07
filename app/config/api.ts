const ENV = {
  dev: {
    BASE_URL: 'http://192.168.1.23:7203',
  },
  prod: {
    BASE_URL: 'https://api.example.com',
  }
};

const getEnvVars = () => {
  // Burada process.env veya başka bir yöntemle ortam kontrolü yapabilirsiniz
  const env = 'dev'; // veya 'prod'
  return ENV[env];
};

export const API_CONFIG = {
  ...getEnvVars(),
  ENDPOINTS: {
    AUTH: '/api/Authentication',
    ADMIN: '/api/Admin',
    TRADE: '/api/trade',
    STOCK: '/Stock',
    USER_STOCKS: '/api/UserStocks',
    TRADE_SEARCH: '/api/TradeSearch',
    STOCK_EXPORT: '/api/StockExport'
  }
}; 