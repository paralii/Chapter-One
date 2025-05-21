import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email Address - OTP Inside",
    text: `Hello,

Thank you for signing up!

To complete your registration, please verify your email address using the One-Time Password (OTP) provided below:

OTP: ${otp}

This OTP is valid for 2 minutes. Please do not share it with anyone.

If you did not attempt to sign up, you can safely ignore this email.

Best regards,  
The Team CHAPTER ONE`,
  };

  return transporter.sendMail(mailOptions);
};

export const resendOtpForVerifyEmail = async (email, newOtp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Resend: Verify Your Email Address",
    text: `Hello,

You're almost there!

To verify your email address, please use the One-Time Password (OTP) provided below:

OTP: ${newOtp}

This OTP is valid for 2 minutes. Please do not share it with anyone.

If you did not request this verification, you can safely ignore this email.

Best regards,  
Team CHAPTER ONE`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendForgotPasswordOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password - OTP Inside",
    text: `Hello,

We received a request to reset the password for your account.

To proceed, please use the One-Time Password (OTP) below:

OTP: ${otp}

This OTP is valid for 2 minutes. Please do not share it with anyone.

If you did not request a password reset, you can safely ignore this email.

Best regards,  
Team CHAPTER ONE`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendChangeEmail = async (NewEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: NewEmail,
    subject: "Verify Your New Email Address",
    text: `Hello,

We received a request to associate this email address with an existing account.

To verify that you own this email, please use the One-Time Password (OTP) below:

OTP: ${otp}

This OTP is valid for 2 minutes. Please do not share it with anyone.

If you did not request this, you can safely ignore this email.

Best regards,  
The Team CHAPTER ONE`,
  };

  return transporter.sendMail(mailOptions);
};

