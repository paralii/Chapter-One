import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getReferralOffer, getReferralCoupons, getReferralStats } from "../../../../api/user/offerAPI";

function ReferralDashboard() {
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [referrals, setReferrals] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offerRes,  statsRes] = await Promise.all([
          getReferralOffer(),
          getReferralCoupons(),
          getReferralStats(),
        ]);
        setReferralLink(offerRes.data.referralLink);
        setReferralCode(offerRes.data.referralCode);
        setReferrals(statsRes.data.referrals);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching referral data");
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
  };

  const shareToWhatsApp = () => {
    const text = `Join now and get 10% off with my referral link: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-lg">
        <h1 className="text-[26px] font-bold text-center mb-6 font-Outfit text-[#3c2712]">
          Refer & Earn
        </h1>
        {error && <p className="text-red-600 text-center mb-4 font-Inter">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-600 font-Inter">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Referral Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-bold mb-2 font-Outfit text-[#3c2712]">
                Referral Stats
              </h2>
              <p className="text-[16px] font-Inter text-gray-700">
                Successful Referrals: <span className="font-bold">{referrals}</span>
              </p>
            </div>

            {/* Referral Code */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-bold mb-2 font-Outfit text-[#3c2712]">
                Your Referral Code
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={referralCode || "Generating..."}
                  readOnly
                  className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px] font-Inter"
                />
                <button
                  onClick={() => copyToClipboard(referralCode)}
                  className="h-[50px] px-6 rounded-[20px] bg-[#3c2712] text-white font-semibold font-Outfit hover:bg-[#4d321b] transition disabled:opacity-60"
                  disabled={!referralCode}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Referral Link */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-bold mb-2 font-Outfit text-[#3c2712]">
                Your Referral Link
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={referralLink || "Generating..."}
                  readOnly
                  className="w-full h-[50px] px-5 rounded-[20px] bg-[#edece9] outline-none text-[16px] font-Inter"
                />
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="h-[50px] px-6 rounded-[20px] bg-[#3c2712] text-white font-semibold font-Outfit hover:bg-[#4d321b] transition disabled:opacity-60"
                  disabled={!referralLink}
                >
                  Copy
                </button>
                <button
                  onClick={shareToWhatsApp}
                  className="h-[50px] px-6 rounded-[20px] bg-green-500 text-white font-semibold font-Outfit hover:bg-green-600 transition disabled:opacity-60"
                  disabled={!referralLink}
                >
                  Share
                </button>
              </div>
            </div> */}

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => window.history.back()}
                className="h-[50px] px-8 rounded-[20px] border border-gray-400 text-gray-700 font-Outfit hover:bg-gray-100 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReferralDashboard;