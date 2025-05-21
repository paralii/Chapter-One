import adminAxios from '../adminAxios';

export const listOrdersAdmin = async (params) => {
  try {
    const response = await adminAxios.get('/orders', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch orders');
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to fetch orders');
  }
};

export const getOrderDetailsAdmin = async (orderId) => {
  try {
    const response = await adminAxios.get(`/orders/${orderId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch order details');
    }
    return response.data.order;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to fetch order details');
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await adminAxios.put(`/orders/${orderId}/status`, { status });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update order status');
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to update order status');
  }
};

export const markItemDelivered = async (orderId, productId) => {
  try {
    const response = await adminAxios.patch('/orders/item/delivered', { orderId, productId });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark item as delivered');
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to mark item as delivered');
  }
};

export const softDeleteOrder = async (orderId) => {
  try {
    const response = await adminAxios.delete(`/orders/${orderId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete order');
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to delete order');
  }
};

export const downloadAdminInvoice = async (orderId) => {
  try {
    const response = await adminAxios.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to download invoice');
  }
};

export const verifyReturnRequest = async (orderId, productId, returnApproved) => {
  try {
    const response = await adminAxios.post('/orders/return/verify', {
      orderId,
      productId,
      returnApproved,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to verify return request');
    }
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to verify return request');
  }
};