export const generateOrderID = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${randomNum}`;
};
