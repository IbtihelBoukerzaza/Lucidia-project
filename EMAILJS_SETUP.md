# EmailJS Setup Guide

To make your contact page functional with EmailJS, follow these steps:

## 1. Create EmailJS Account
1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Create Email Service
1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Connect your email account and follow the authentication steps
5. Note your **Service ID** (it will look like: `service_123456789`)

## 3. Create Email Template
1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

**Subject:** `New Contact Form Message from {{from_name}}`

**Content:**
```
Hello,

You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{from_email}}
Company: {{company}}
Phone: {{phone}}

Message:
{{message}}

---
Sent from: {{from_email}}
```

4. Save the template and note your **Template ID** (it will look like: `template_123456789`)

## 4. Get Your Public Key
1. Go to **Account** → **API Keys**
2. Copy your **Public Key** (it will look like: `123456789ABCDEF...`)

## 5. Update Configuration
Open `src/config/emailjs.js` and replace the placeholder values:

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_actual_service_id',    // Replace with your Service ID
  TEMPLATE_ID: 'your_actual_template_id',  // Replace with your Template ID
  PUBLIC_KEY: 'your_actual_public_key'    // Replace with your Public Key
};
```

## 6. Test Your Contact Form
1. Start your development server: `npm run dev`
2. Navigate to your contact page
3. Fill out the form and submit
4. Check your email for the test message

## Important Notes
- The free EmailJS plan allows 200 emails per month
- Make sure your email template variables match the form field names
- The receiving email is set to `ibtihelpro0@gmail.com` in the configuration
- Test thoroughly before deploying to production

## Troubleshooting
- **Email not sending**: Check your EmailJS dashboard for error logs
- **Configuration errors**: Verify all IDs and keys are correct
- **Template variables**: Ensure template variables match exactly with the `templateParams` object in the code

## Security
- Your Public Key is safe to expose in frontend code
- Never share your Private Key or API Keys
- Consider adding reCAPTCHA for production use
