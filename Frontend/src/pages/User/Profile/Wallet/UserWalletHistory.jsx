import React, { useState, useEffect } from 'react';
import userAxios from '../../../../api/userAxios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserWalletHistory = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const res = await userAxios.get('/wallet/details');
        setWalletBalance(res.data.balance);
        setTransactions(res.data.transactions);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        toast.error('Failed to fetch wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  const handleBack = () => navigate('/profile');

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg">
        <h2 className="text-[22px] sm:text-[26px] font-bold text-center mb-6 font-Outfit text-[#3c2712]">
          Wallet History
        </h2>

        {loading ? (
          <div className="text-center text-gray-600">Loading wallet data...</div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-[18px] font-semibold font-Inter text-[#3c2712]">
                Current Balance
              </p>
              <p className="text-[24px] font-bold font-Inter text-[#f4a261]">
                ${walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-[18px] font-semibold font-Inter text-[#3c2712] mb-4">
                Transaction History
              </h3>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-600 font-Inter">
                  No transactions found.
                </p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="p-4 border border-[#edece9] rounded-[20px] bg-[#edece9]/50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-Inter text-[14px] text-[#3c2712]">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                          <p className="font-Inter text-[14px] text-gray-600">
                            {transaction.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-Inter font-semibold text-[16px] ${
                              transaction.type === 'credit'
                                ? 'text-green-600'
                                : transaction.type === 'debit'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}$
                            {transaction.amount.toFixed(2)}
                          </p>
                          <p className="font-Inter text-[12px] text-gray-500 capitalize">
                            {transaction.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleBack}
                className="w-full max-w-[200px] h-[50px] rounded-[20px] border border-gray-400 text-gray-700 font-Outfit hover:bg-gray-100 transition"
              >
                Back to Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserWalletHistory;