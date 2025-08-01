import adminAxios from "../adminAxios";

export const getDailySalesReport = (params) => {
  return adminAxios.get("/sales-report/daily", { params });
};

export const getWeeklySalesReport = (params) => {
  return adminAxios.get("/sales-report/weekly", { params });
};

export const getYearlySalesReport = (params) => {
  return adminAxios.get("/sales-report/yearly", { params });
};

export const getCustomSalesReport = (params) => {
  return adminAxios.get("/sales-report/custom", { params });
};

export const getSalesReport = (params) => {
  return adminAxios.get("/sales-report", { params });
};

export const downloadSalesReportPdf = (params) => {
  return adminAxios.get("/sales-report/download/pdf", { params, responseType: "blob" });
};

export const downloadSalesReportExcel = (params) => {
  return adminAxios.get("/sales-report/download/excel", { params, responseType: "blob" });
};

export default {
  getDailySalesReport,
  getWeeklySalesReport,
  getYearlySalesReport,
  getCustomSalesReport,
  getSalesReport,
  downloadSalesReportPdf,
  downloadSalesReportExcel,
};
