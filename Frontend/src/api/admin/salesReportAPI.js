import adminAxios from "../adminAxios";

export const getSalesReport = () => {
  return adminAxios.get("/sales-report")
}

export const generateSalesReportPDF = () => {
  return adminAxios.get("/sales-report")
}

export const generateSalesReportExcel = () => {
  return adminAxios.get("/sales-report")
}