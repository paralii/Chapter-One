// src/api/admin/salesReportAPI.js
import adminAxios from "../adminAxios";

// Get Daily Sales Report
export const getDailySalesReport = (params) => {
  return adminAxios.get("/sales-report/daily", { params });
};

// Get Weekly Sales Report
export const getWeeklySalesReport = (params) => {
  return adminAxios.get("/sales-report/weekly", { params });
};

// Get Yearly Sales Report
export const getYearlySalesReport = (params) => {
  return adminAxios.get("/sales-report/yearly", { params });
};

// Get Custom Sales Report (by date range)
export const getCustomSalesReport = (params) => {
  return adminAxios.get("/sales-report/custom", { params });
};

// Get Overall Sales Report (with discount, overall count, etc.)
export const getSalesReport = (params) => {
  return adminAxios.get("/sales-report", { params });
};

// Download Sales Report as PDF (returns blob)
export const downloadSalesReportPdf = (params) => {
  return adminAxios.get("/sales-report/download/pdf", { params, responseType: "blob" });
};

// Download Sales Report as Excel (returns blob)
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
