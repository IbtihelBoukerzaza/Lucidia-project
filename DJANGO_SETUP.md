# Django Contact Form Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings:
SECRET_KEY=your-django-secret-key
DEBUG=True
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### 3. Gmail Setup (Required)
1. Enable 2-factor authentication on your Gmail
2. Go to Google Account settings → Security
3. Generate an "App Password" for Django
4. Use this app password in `EMAIL_HOST_PASSWORD`

### 4. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 5. Start Django Server
```bash
python manage.py runserver
```

## 🌐 API Endpoints

### Send Contact Email
- **URL:** `POST http://localhost:8000/api/contact/`
- **Body:** 
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "phone": "+213123456789",
  "message": "Hello, I need help with..."
}
```

### Get All Messages (Admin)
- **URL:** `GET http://localhost:8000/api/messages/`
- **Returns:** All contact messages from database

## 🗄️ Database Features

### ContactMessage Model
- Stores all form submissions
- Admin interface for managing messages
- Mark messages as read/unread
- Search and filter capabilities

### Admin Panel
- URL: `http://localhost:8000/admin/`
- Login with your superuser credentials
- View, search, and manage contact messages

## 📧 Email Configuration

### Gmail (Recommended)
1. Enable 2FA on your Gmail account
2. Generate App Password
3. Configure in `.env` file

### Other Email Providers
```python
# Outlook/Hotmail
EMAIL_HOST = 'smtp-mail.outlook.com'
EMAIL_PORT = 587

# Yahoo
EMAIL_HOST = 'smtp.mail.yahoo.com'
EMAIL_PORT = 587
```

## 🔄 Running Both Frontend & Backend

### Terminal 1 - Django Backend
```bash
cd backend
python manage.py runserver
```

### Terminal 2 - React Frontend
```bash
npm run dev
```

## ✅ Testing

1. Start both servers
2. Navigate to contact page
3. Fill out and submit form
4. Check:
   - Email received at `ibtihelpro0@gmail.com`
   - Message saved in database
   - Admin panel shows new message

## 🔒 Security Features

- CSRF protection disabled for API endpoint
- CORS configured for React development
- Form validation on backend
- SQL injection protection via Django ORM

## 🐛 Troubleshooting

### Common Issues
1. **Email not sending:** Check Gmail app password
2. **CORS errors:** Verify frontend URL in CORS settings
3. **Database errors:** Run migrations
4. **404 errors:** Check Django URLs configuration

### Debug Mode
Set `DEBUG=True` in `.env` for detailed error messages
