import emailjs from '@emailjs/nodejs';

const EMAILJS_SERVICE_ID = 'service_dsvsoaq';
const EMAILJS_TEMPLATE_ID = 'template_ufd0aek';
const EMAILJS_PUBLIC_KEY = 'ojcaaXdZZl0BcPZ5t';
// For Node.js, you might need a private key - check your EmailJS dashboard under "Account" > "API Keys"
// If you have a private key, add it here: 
const EMAILJS_PRIVATE_KEY = 'aKTdIcVcyeJz7xER5ojxY';

export async function sendOtpEmail({ email, otp, time }: { email: string; otp: string; time: string }) {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email, // EmailJS template variable
        email: email,     // Backup
        passcode: otp,
        time: time,
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY,
      }
    );
    console.log('✅ OTP Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ EmailJS Error:', error);
    throw error;
  }
}

