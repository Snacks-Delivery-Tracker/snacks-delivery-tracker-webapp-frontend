// const API_BASE_URL = 'http://localhost:3001/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (API_BASE_URL == null) {
  console.log("VITE_API_BASE_URL is not defined");
  throw new Error('VITE_API_BASE_URL is not defined');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Something went wrong. Please try again.');
  }
  return payload.data ?? payload;
}

export const api = {
  getCurrentLine: () => request('/line/current'),
  getLine: (lineId) => request(`/line/${lineId}`),
  listLines: () => request('/line'),
  createLine: (data) => request('/line', { method: 'POST', body: JSON.stringify(data) }),
  addShopToLine: (lineId, shopId) => request(`/line/${lineId}/shops`, {
    method: 'POST', body: JSON.stringify({ shopId })
  }),
  removeShopFromLine: (lineId, shopId) => request(`/line/${lineId}/shops/${shopId}`, {
    method: 'DELETE'
  }),
  deleteLine: (lineId) => request(`/line/${lineId}`, { method: 'DELETE' }),
  closeLine: (lineId) => request('/line/close', {
    method: 'POST', body: JSON.stringify({ lineId })
  }),
  listShops: (search = '') => request(`/shop${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getShop: (shopId) => request(`/shop/${shopId}`),
  createShop: (data) => request('/shop', { method: 'POST', body: JSON.stringify(data) }),
  updateShop: (shopId, data) => request(`/shop/${shopId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShop: (shopId) => request(`/shop/${shopId}`, { method: 'DELETE' }),
  listSnacks: () => request('/snack'),
  createSnack: (data) => request('/snack', { method: 'POST', body: JSON.stringify(data) }),
  updateSnack: (data) => request('/snack', { method: 'PUT', body: JSON.stringify(data) }),
  deleteSnack: (id) => request('/snack', { method: 'DELETE', body: JSON.stringify({ id }) }),
  createDelivery: (data) => request('/delivery', { method: 'POST', body: JSON.stringify(data) }),
  getDelivery: (orderId) => request(`/delivery/${orderId}`),
  updateDelivery: (orderId, data) => request(`/delivery/${orderId}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  deleteDelivery: (orderId) => request(`/delivery/${orderId}`, { method: 'DELETE' }),
  getShopHistory: (shopId) => request(`/delivery/shop/${shopId}/history`),
  processPayment: (data) => request('/payment/process', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentsByShop: (shopId) => request('/payment/get-by-shop', { method: 'POST', body: JSON.stringify({ shopId }) }),
};
