"use client"

import { useState, useEffect } from "react"
import userAxios from "../../../api/userAxios"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import UserProfileDashboard from "../Profile/UserProfileDashboard"

const UserWalletHistory = () => {
  const navigate = useNavigate()
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true)
        const res = await userAxios.get("/wallet/details")
        setWalletBalance(res.data.balance)
        setTransactions(res.data.transactions)
      } catch (err) {
        console.error("Error fetching wallet data:", err)
        toast.error("Failed to fetch wallet data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchWalletData()
  }, [])

  const handleBack = () => navigate("/profile")

  return (
  <div className="relative min-h-screen">
    {/* Blurred dashboard background */}
    <div className="absolute inset-0 blur-sm brightness-50 pointer-events-none">
      <UserProfileDashboard />
    </div>

    {/* Dark overlay for better modal contrast */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    {/* Modal content with responsive sizing */}
    <div className="relative z-10 min-h-screen flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-[90vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[450px] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh]">

        <h2 className="text-lg xs:text-xl sm:text-[22px] md:text-[26px] lg:text-[28px] font-bold text-center mb-4 sm:mb-6 font-Outfit text-[#3c2712]">
          Wallet History
        </h2>

        {/* Scrollable content area */}
        <div className="flex flex-col flex-grow overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-600 py-8 sm:py-12 text-sm sm:text-base">
              Loading wallet data...
            </div>
          ) : (
            <>
              <div className="mb-4 sm:mb-6 text-center">
                <p className="text-sm sm:text-[16px] md:text-[18px] font-semibold font-Inter text-[#3c2712]">
                  Current Balance
                </p>
                <p className="text-xl sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold font-Inter text-[#f4a261]">
                  ₹{walletBalance.toFixed(2)}
                </p>
              </div>

              <div className="mb-4 sm:mb-6 flex-grow">
                <h3 className="text-sm sm:text-[16px] md:text-[18px] font-semibold font-Inter text-[#3c2712] mb-3 sm:mb-4">
                  Transaction History
                </h3>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-600 font-Inter py-6 sm:py-8 text-sm sm:text-base">
                    No transactions found.
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-[200px] xs:max-h-[250px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[400px] overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="p-3 sm:p-4 border border-[#edece9] rounded-[15px] sm:rounded-[20px] bg-[#edece9]/50 hover:bg-[#edece9]/70 transition-colors"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-Inter text-xs sm:text-[14px] text-[#3c2712] truncate">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                            <p className="font-Inter text-xs sm:text-[14px] text-gray-600 truncate">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`font-Inter font-semibold text-sm sm:text-[16px] ${
                                transaction.type === "credit"
                                  ? "text-green-600"
                                  : transaction.type === "debit"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              ₹{transaction.amount.toFixed(2)}
                            </p>
                            <p className="font-Inter text-[10px] sm:text-[12px] text-gray-500 capitalize">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Always visible bottom button */}
        <div className="pt-4 border-t bg-white flex justify-center">
  <button
    type="button"
    onClick={handleBack}
    className="w-full max-w-[160px] xs:max-w-[180px] sm:max-w-[200px] h-[40px] xs:h-[45px] sm:h-[50px] rounded-[15px] sm:rounded-[20px] border border-gray-400 text-gray-700 font-Outfit hover:bg-gray-100 transition text-sm sm:text-base"
  >
    Back to Profile
  </button>
</div>


      </div>
    </div>
  </div>
  )
}

export default UserWalletHistory
