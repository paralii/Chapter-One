"use client";
import React from "react";
import Footer from "../../components/common/Footer";

const emailIconSvg = `<svg id="70:2248" width="24" height="49" viewBox="0 0 24 49" fill="none" xmlns="http://www.w3.org/2000/svg" class="email-icon">
  <path d="M19.4966 17.4233C20.3477 17.9908 20.9408 19.6775 20.9408 21.6139V30.179C20.9408 32.4492 20.1253 34.3756 19.0344 34.5615C18.7071 34.6154 18.3797 34.6654 18.0524 34.7054V40.8824L15.164 34.8872C13.8604 34.8872 12.5702 34.7773 11.2936 34.5615C11.0157 34.5148 10.7453 34.3502 10.4993 34.0779M19.4966 17.4233C19.3478 17.3239 19.194 17.2602 19.0383 17.2334C16.4599 16.7892 13.8681 16.7892 11.2897 17.2334C10.2008 17.4213 9.38725 19.3457 9.38725 21.6139V30.179C9.38725 31.8517 9.83014 33.3365 10.4993 34.0779M19.4966 17.4233V13.6783C19.4966 10.4389 18.3874 7.63117 16.8393 7.21351C14.8471 6.67753 12.8403 6.40918 10.8314 6.41016C8.79513 6.41016 6.78964 6.68394 4.82361 7.21351C3.27544 7.63117 2.16631 10.4389 2.16631 13.6783V26.1203C2.16631 29.3597 3.27544 32.1674 4.82361 32.5851C5.37915 32.7349 5.93756 32.8648 6.49887 32.9727V42.3812L10.4993 34.0779" stroke="#DF7300" stroke-width="2.31868" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

const phoneIconSvg = `<svg id="70:2250" width="33" height="34" viewBox="0 0 33 34" fill="none" xmlns="http://www.w3.org/2000/svg" class="phone-icon">
  <path d="M3.09378 9.5625C3.09378 21.2982 12.3283 30.8125 23.7188 30.8125H26.8125C27.633 30.8125 28.42 30.4767 29.0001 29.8789C29.5803 29.2811 29.9063 28.4704 29.9063 27.625V25.6813C29.9063 24.9503 29.4237 24.3128 28.7348 24.1358L22.6532 22.5689C22.0482 22.4131 21.4129 22.6468 21.0403 23.1597L19.7065 24.9914C19.3188 25.5241 18.6492 25.7592 18.0428 25.5297C15.7917 24.6771 13.7475 23.3305 12.0516 21.5832C10.3557 19.8359 9.04873 17.7298 8.22116 15.4105C7.99841 14.7858 8.22666 14.0958 8.74366 13.6963L10.5215 12.3222C11.0207 11.9382 11.2462 11.2823 11.0949 10.6604L9.57416 4.3945C9.49047 4.04982 9.2974 3.74383 9.0256 3.52514C8.75381 3.30646 8.41888 3.18762 8.07403 3.1875H6.18753C5.36702 3.1875 4.58011 3.52332 3.99992 4.1211C3.41973 4.71887 3.09378 5.52962 3.09378 6.375V9.5625Z" stroke="#DF7200" stroke-width="2.31868" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

const locationIconSvg = `<svg id="70:2252" width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" class="location-icon">
  <path d="M23.1868 16.2585C23.1868 17.4884 22.6982 18.6679 21.8286 19.5376C20.9589 20.4072 19.7794 20.8958 18.5495 20.8958C17.3195 20.8958 16.14 20.4072 15.2703 19.5376C14.4007 18.6679 13.9121 17.4884 13.9121 16.2585C13.9121 15.0285 14.4007 13.849 15.2703 12.9793C16.14 12.1097 17.3195 11.6211 18.5495 11.6211C19.7794 11.6211 20.9589 12.1097 21.8286 12.9793C22.6982 13.849 23.1868 15.0285 23.1868 16.2585Z" stroke="#DF7200" stroke-width="2.31868" stroke-linecap="round" stroke-linejoin="round"></path>
  <path d="M30.1429 16.2584C30.1429 27.2984 18.5495 33.6485 18.5495 33.6485C18.5495 33.6485 6.95609 27.2984 6.95609 16.2584C6.95609 13.1837 8.17753 10.2349 10.3517 8.06067C12.5259 5.88648 15.4747 4.66504 18.5495 4.66504C21.6242 4.66504 24.5731 5.88648 26.7473 8.06067C28.9214 10.2349 30.1429 13.1837 30.1429 16.2584V16.2584Z" stroke="#DF7200" stroke-width="2.31868" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

const socialIconSvg = `<svg id="70:2279" width="155" height="32" viewBox="0 0 155 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="social-icon">
  <path d="M27 13.5338C27 6.06316 20.952 0 13.5 0C6.048 0 0 6.06316 0 13.5338C0 20.0842 4.644 25.5383 10.8 26.797V17.594H8.1V13.5338H10.8V10.1504C10.8 7.53835 12.9195 5.41353 15.525 5.41353H18.9V9.47368H16.2C15.4575 9.47368 14.85 10.0827 14.85 10.8271V13.5338H18.9V17.594H14.85V27C21.6675 26.3233 27 20.5579 27 13.5338Z" fill="white" fill-opacity="0.62"></path>
  <path d="M53 7.77778C51.7694 7.77778 50.5664 8.1427 49.5431 8.82641C48.5199 9.51012 47.7224 10.4819 47.2514 11.6189C46.7805 12.7558 46.6573 14.0069 46.8973 15.2139C47.1374 16.4209 47.73 17.5296 48.6002 18.3998C49.4704 19.27 50.5791 19.8626 51.7861 20.1027C52.9931 20.3428 54.2442 20.2195 55.3811 19.7486C56.5181 19.2776 57.4899 18.4801 58.1736 17.4569C58.8573 16.4336 59.2222 15.2306 59.2222 14C59.2205 12.3503 58.5644 10.7686 57.3979 9.60212C56.2314 8.4356 54.6497 7.77949 53 7.77778ZM53 17.1111C52.3847 17.1111 51.7832 16.9286 51.2716 16.5868C50.7599 16.2449 50.3612 15.7591 50.1257 15.1906C49.8902 14.6221 49.8286 13.9965 49.9487 13.3931C50.0687 12.7896 50.365 12.2352 50.8001 11.8001C51.2352 11.365 51.7896 11.0687 52.3931 10.9487C52.9965 10.8286 53.6221 10.8902 54.1906 11.1257C54.7591 11.3612 55.2449 11.7599 55.5868 12.2716C55.9286 12.7832 56.1111 13.3847 56.1111 14C56.1111 14.8251 55.7833 15.6164 55.1999 16.1999C54.6164 16.7833 53.8251 17.1111 53 17.1111ZM59.2222 0H46.7778C44.7157 0.00240153 42.7388 0.822615 41.2807 2.28071C39.8226 3.73881 39.0024 5.71572 39 7.77778V20.2222C39.0024 22.2843 39.8226 24.2612 41.2807 25.7193C42.7388 27.1774 44.7157 27.9976 46.7778 28H59.2222C61.2843 27.9976 63.2612 27.1774 64.7193 25.7193C66.1774 24.2612 66.9976 22.2843 67 20.2222V7.77778C66.9976 5.71572 66.1774 3.73881 64.7193 2.28071C63.2612 0.822615 61.2843 0.00240153 59.2222 0ZM63.8889 20.2222C63.8889 21.4599 63.3972 22.6469 62.5221 23.5221C61.6469 24.3972 60.4599 24.8889 59.2222 24.8889H46.7778C45.5401 24.8889 44.3531 24.3972 43.4779 23.5221C42.6028 22.6469 42.1111 21.4599 42.1111 20.2222V7.77778C42.1111 6.5401 42.6028 5.35312 43.4779 4.47795C44.3531 3.60278 45.5401 3.11111 46.7778 3.11111H59.2222C60.4599 3.11111 61.6469 3.60278 62.5221 4.47795C63.3972 5.35312 63.8889 6.5401 63.8889 7.77778V20.2222ZM61.8148 7.25926C61.8148 7.66947 61.6932 8.07047 61.4653 8.41155C61.2374 8.75263 60.9134 9.01847 60.5345 9.17545C60.1555 9.33244 59.7384 9.37351 59.3361 9.29348C58.9338 9.21345 58.5642 9.01591 58.2741 8.72585C57.9841 8.43579 57.7865 8.06622 57.7065 7.66389C57.6265 7.26156 57.6676 6.84453 57.8245 6.46555C57.9815 6.08656 58.2474 5.76263 58.5884 5.53473C58.9295 5.30683 59.3305 5.18518 59.7407 5.18518C60.2908 5.18518 60.8184 5.4037 61.2073 5.79267C61.5963 6.18163 61.8148 6.70918 61.8148 7.25926Z" fill="white" fill-opacity="0.62"></path>
</svg>`;

function ContactUs() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&family=Outfit:wght@300;600&family=Roboto:wght@200;300;400;500;700&display=swap"
        rel="stylesheet"
      />
      <div className="font-sans">
        {/* Navbar */}
        <div className="bg-[#fff8e5] p-0">
          <div className="max-w-[1440px] mx-auto lg:pt-[35px] lg:px-[117px] md:px-[20px] sm:px-[15px]">
            <div className="flex items-center gap-[20px] flex-wrap sm:justify-between">
              <div className="text-[#696969] text-[36px] font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>
                CHAPTER ONE
              </div>
              <div className="flex items-center gap-[10px] w-full mt-[15px] order-last sm:order-none sm:mt-0">
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-white border border-[#e1d9d9] rounded-[29px] w-[639px] md:w-full h-[58px] px-[20px]"
                />
                <button className="text-white bg-[#696969] border-0 rounded-[23px] w-[121px] h-[46px] font-[300] text-[19px]">
                  Search
                </button>
              </div>
              
            </div>
            <div className="hidden sm:flex justify-center gap-[74px] mt-[96px] pb-[18px] md:gap-[40px] md:px-[20px] md:overflow-x-auto">
              <div className="text-[#000] text-[18px] font-medium">Home</div>
              <div className="text-[#000] text-[18px] font-medium">Novel</div>
              <div className="text-[#000] text-[18px] font-medium">Kids</div>
              <div className="text-[#000] text-[18px] font-medium">Fantasy</div>
              <div className="text-[#000] text-[18px] font-medium">Romance</div>
              <div className="text-[#000] text-[18px] font-medium">Thriller</div>
              <div className="text-[#000] text-[18px] font-medium">Offer</div>
            </div>
            <div className="opacity-50 bg-[#3c2712] h-[1px] mt-[22px]"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#fff8e5] flex flex-col lg:flex-row py-[30px] px-[15px] md:py-[50px] md:px-[20px] lg:px-[117px] lg:gap-[100px]">
          {/* Address Section */}
          <div className="w-full lg:w-1/2">
            <div className="text-[#696969] mb-[40px] text-[33px]">Address</div>
            <div className="flex gap-[20px] mb-[40px]">
              <div dangerouslySetInnerHTML={{ __html: emailIconSvg }} />
              <div className="flex flex-col">
                <div className="text-[#3c2712] text-[20px] font-medium">
                  Reach us on email
                </div>
                <div className="text-[#8e4700] my-[5px] text-[16px]">
                  Our friendly team is here to help.
                </div>
                <div className="text-[#1472b2] text-[16px]">info@yourmail.com</div>
              </div>
            </div>
            <div className="flex gap-[20px] mb-[40px]">
              <div dangerouslySetInnerHTML={{ __html: phoneIconSvg }} />
              <div className="flex flex-col">
                <div className="text-[#3c2712] text-[20px] font-medium">
                  Reach us on phone
                </div>
                <div className="text-[#8e4700] my-[5px] text-[16px]">
                  Our friendly team is here to help.
                </div>
                <div className="text-[#1472b2] text-[16px]">
                  <span>9862849515</span>
                  <br />
                  <span>7856164816</span>
                </div>
              </div>
            </div>
            <div className="flex gap-[20px] mb-[40px]">
              <div dangerouslySetInnerHTML={{ __html: locationIconSvg }} />
              <div className="flex flex-col">
                <div className="text-[#3c2712] text-[20px] font-medium">Office</div>
                <div className="text-[#1472b2] text-[16px]">
                  <span>2814 Fisher Rd, 1st Floor, Opp. alex street,</span>
                  <br />
                  <span>Columbus, Ohio 43204</span>
                </div>
              </div>
            </div>
          </div>
          {/* Write Us Section */}
          <div className="flex-1">
            <div className="text-[#696969] mb-[40px] text-[33px]">Write Us</div>
            <form className="flex flex-col gap-[20px]">
              <div className="flex gap-[16px] md:flex-col">
                <input
                  type="text"
                  placeholder="Enter you name"
                  className="bg-white border-[3px] border-[#ffecbc] rounded-[25px] h-[60px] px-[37px] text-[19px] font-light"
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white border-[3px] border-[#ffecbc] rounded-[25px] h-[60px] px-[37px] text-[19px] font-light"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="bg-white border-[3px] border-[#ffecbc] rounded-[25px] w-full h-[60px] px-[37px] text-[19px] font-light"
              />
              <textarea
                placeholder="Write your review"
                className="resize-none bg-white border-[3px] border-[#ffecbc] rounded-[25px] h-[238px] pt-[23px] pb-[23px] pl-[37px] pr-[37px] text-[19px] font-light"
              ></textarea>
              <button type="submit" className="text-white bg-[#3c2712] border-0 rounded-[25px] h-[60px] mt-[14px] text-[19px]">
                Submit
              </button>
            </form>
          </div>
        </div>

        <Footer />
        
      </div>
    </>
  );
}

export default ContactUs;
