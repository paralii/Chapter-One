// src/utils/helper.js

export const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  

  export const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };
  
  export const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };
  