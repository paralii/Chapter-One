import React from "react";

const Footer = () => {
  return (
    <footer className="py-3 px-3 sm:px-6 lg:px-8 bg-[#f4f4f4]">
      <div className="footer-content max-w-[1400px] mx-auto grid grid-cols-2 sm:flex sm:flex-row justify-between gap-3 sm:gap-6">
        
        {/* Contact Us */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-1.5 text-sm font-semibold">Contact Us</div>
          <div className="footer-link text-xs font-light hover:text-gray-600 cursor-pointer">chapter.1.ae@gmail.com</div>
          <div className="footer-link text-xs font-light hover:text-gray-600 cursor-pointer">+123 456 7890</div>
        </div>

        {/* Order & Customer Service */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-1.5 text-sm font-semibold">Orders</div>
          <div className="footer-link text-xs font-light hover:text-gray-600 cursor-pointer">Order Tracking</div>
          <div className="footer-link text-xs font-light hover:text-gray-600 cursor-pointer">Privacy Policy</div>
        </div>

        {/* FAQ */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-1.5 text-sm font-semibold">FAQ</div>
          <div className="footer-link text-xs font-light hover:text-gray-600 cursor-pointer">Returns & Exchanges</div>
        </div>

        {/* Follow Us */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-1.5 text-sm font-semibold">Follow Us</div>
          <div className="social-icons flex gap-2 text-base">
            <i className="ti ti-brand-facebook hover:text-gray-600 cursor-pointer transition-colors"></i>
            <i className="ti ti-brand-instagram hover:text-gray-600 cursor-pointer transition-colors"></i>
            <i className="ti ti-brand-twitter hover:text-gray-600 cursor-pointer transition-colors"></i>
            <i className="ti ti-brand-whatsapp hover:text-gray-600 cursor-pointer transition-colors"></i>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-gray-600">
        <p>&copy; 2025 ChapterOne. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
