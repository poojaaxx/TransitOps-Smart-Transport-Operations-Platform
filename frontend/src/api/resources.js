import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  me: () => client.get('/auth/me'),
};

export const vehicleApi = {
  list: (params) => client.get('/vehicles', { params }),
  available: () => client.get('/vehicles/available'),
  get: (id) => client.get(`/vehicles/${id}`),
  create: (data) => client.post('/vehicles', data),
  update: (id, data) => client.patch(`/vehicles/${id}`, data),
  remove: (id) => client.delete(`/vehicles/${id}`),
  documents: (id) => client.get(`/vehicles/${id}/documents`),
  uploadDocument: (id, formData) =>
    client.post(`/vehicles/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDocument: (id, docId) => client.delete(`/vehicles/${id}/documents/${docId}`),
};

export const driverApi = {
  list: (params) => client.get('/drivers', { params }),
  available: () => client.get('/drivers/available'),
  get: (id) => client.get(`/drivers/${id}`),
  create: (data) => client.post('/drivers', data),
  update: (id, data) => client.patch(`/drivers/${id}`, data),
  remove: (id) => client.delete(`/drivers/${id}`),
  checkLicenseReminders: () => client.post('/drivers/check-license-reminders'),
};

export const tripApi = {
  list: (params) => client.get('/trips', { params }),
  get: (id) => client.get(`/trips/${id}`),
  create: (data) => client.post('/trips', data),
  update: (id, data) => client.patch(`/trips/${id}`, data),
  remove: (id) => client.delete(`/trips/${id}`),
  dispatch: (id) => client.post(`/trips/${id}/dispatch`),
  complete: (id, data) => client.post(`/trips/${id}/complete`, data),
  cancel: (id) => client.post(`/trips/${id}/cancel`),
};

export const maintenanceApi = {
  list: (params) => client.get('/maintenance', { params }),
  get: (id) => client.get(`/maintenance/${id}`),
  create: (data) => client.post('/maintenance', data),
  update: (id, data) => client.patch(`/maintenance/${id}`, data),
  close: (id, data) => client.patch(`/maintenance/${id}/close`, data),
};

export const fuelApi = {
  list: (params) => client.get('/fuel-logs', { params }),
  create: (data) => client.post('/fuel-logs', data),
  remove: (id) => client.delete(`/fuel-logs/${id}`),
};

export const expenseApi = {
  list: (params) => client.get('/expenses', { params }),
  create: (data) => client.post('/expenses', data),
  remove: (id) => client.delete(`/expenses/${id}`),
};

export const dashboardApi = {
  kpis: (params) => client.get('/dashboard/kpis', { params }),
  statusBreakdown: (params) => client.get('/dashboard/vehicle-status-breakdown', { params }),
  tripsTrend: (params) => client.get('/dashboard/trips-trend', { params }),
};

export const reportApi = {
  vehicles: () => client.get('/reports/vehicles'),
  csvUrl: '/reports/vehicles/csv',
  pdfUrl: '/reports/vehicles/pdf',
};

export const userApi = {
  list: () => client.get('/users'),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.patch(`/users/${id}`, data),
};
