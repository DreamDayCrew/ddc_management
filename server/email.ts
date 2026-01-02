import emailjs from '@emailjs/nodejs';

const EMAILJS_SERVICE_ID = 'service_dsvsoaq';
const EMAILJS_TEMPLATE_ID = 'template_ufd0aek';
const EMAILJS_PUBLIC_KEY = 'ojcaaXdZZl0BcPZ5t';

export async function sendOtpEmail({ email, otp, time }: { email: string; otp: string; time: string }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      email,
      passcode: otp,
      time,
    },
    {
      publicKey: EMAILJS_PUBLIC_KEY,
    }
  );
}
