import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_fckws12', // Your EmailJS service ID
  TEMPLATE_ID: 'template_yp5phog', // Your EmailJS template ID
  PUBLIC_KEY: '8J_9kWhZVjWhHWzgU' // Your EmailJS public key
};

// Initialize EmailJS with public key
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

export const sendEmail = async (formData) => {
  try {
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      company: formData.company,
      phone: formData.phone,
      message: formData.message,
      to_email: 'ibtihelpro0@gmail.com' // Your receiving email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    return {
      success: true,
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت.'
    };
  } catch (error) {
    console.error('EmailJS Error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.'
    };
  }
};

export default emailjs;
