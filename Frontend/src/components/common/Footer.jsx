import React from "react";

const Footer = () => {
  return (
    <footer className="py-6 px-6 lg:px-20 bg-[#f4f4f4] mt-8">
      <div className="footer-content flex flex-col sm:flex-row justify-between gap-6">
        
        {/* Contact Us */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-3 text-lg font-semibold">Contact Us</div>
          <div className="footer-link mb-1 text-sm font-light">chapter.1.ae@gmail.com</div>
          <div className="footer-link mb-1 text-sm font-light">+123 456 7890</div>
        </div>

        {/* Order & Customer Service */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-3 text-lg font-semibold">Order Information</div>
          <div className="footer-link mb-1 text-sm font-light">Order Tracking</div>
          <div className="footer-link mb-1 text-sm font-light">Privacy Policy</div>
        </div>

        {/* FAQ */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-3 text-lg font-semibold">FAQ</div>
          <div className="footer-link mb-1 text-sm font-light">Returns & Exchanges</div>
        </div>

        {/* Follow Us */}
        <div className="footer-section text-gray-800">
          <div className="footer-title mb-3 text-lg font-semibold">Follow Us</div>
          <div className="social-icons flex gap-3 text-lg">
            <i className="ti ti-brand-facebook"></i>
            <i className="ti ti-brand-instagram"></i>
            <i className="ti ti-brand-twitter"></i>
            <i className="ti ti-brand-whatsapp"></i>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom mt-8 text-center text-sm text-gray-600">
        <p>&copy; 2025 ChapterOne. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
