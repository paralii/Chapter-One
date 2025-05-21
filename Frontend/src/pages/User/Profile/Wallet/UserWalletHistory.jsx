import React, { useState, useEffect } from 'react';
import userAxios from '../../../../api/userAxios';

const UserWallet = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchWalletData = async () => {
      const res = await userAxios.get('/profile/wallet');
      setWalletBalance(res.data.balance);
      setTransactions(res.data.transactions);
    };
    fetchWalletData();
  }, []);

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">Your Wallet</h2>
        <p className="text-xl font-semibold mb-4">Balance: ${walletBalance}</p>
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <ul className="space-y-4">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="p-4 border rounded-lg">
              <p><strong>{transaction.date}</strong></p>
              <p>{transaction.description}</p>
              <p><strong>Amount:</strong> ${transaction.amount}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserWallet;
