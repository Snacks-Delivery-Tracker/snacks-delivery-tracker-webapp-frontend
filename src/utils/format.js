export const formatCurrency = (amount = 0) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(amount) || 0);

export const formatDate = (date, options = {}) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  ...options
}).format(new Date(date));

export const formatTime = (date) => new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit'
}).format(new Date(date));

export const todayLabel = () => new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', day: '2-digit', month: 'long'
}).format(new Date());
