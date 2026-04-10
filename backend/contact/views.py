from django.shortcuts import render
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
from .models import ContactMessage
from .forms import ContactForm


@csrf_exempt
@require_http_methods(["POST"])
def send_contact_email(request):
    try:
        # Parse JSON data
        data = json.loads(request.body)
        
        # Validate form data
        form = ContactForm(data)
        if not form.is_valid():
            return JsonResponse({
                'success': False,
                'message': 'Validation failed',
                'errors': form.errors
            }, status=400)
        
        # Save contact message to database
        contact_message = form.save()
        
        # Send email
        subject = f"New Contact Form Message from {data['name']}"
        message_body = f"""
You have received a new message from your website contact form:

Name: {data['name']}
Email: {data['email']}
Company: {data.get('company', 'Not provided')}
Phone: {data.get('phone', 'Not provided')}

Message:
{data['message']}

---
Sent from: {data['email']}
Time: {contact_message.created_at.strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        send_mail(
            subject=subject,
            message=message_body,
            from_email='noreply@lucidia-dz.com',
            recipient_list=['ibtihelpro0@gmail.com'],
            fail_silently=False,
        )
        
        return JsonResponse({
            'success': True,
            'message': 'تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت.'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.'
        }, status=500)


@require_http_methods(["GET"])
def get_contact_messages(request):
    messages = ContactMessage.objects.all()
    data = [
        {
            'id': msg.id,
            'name': msg.name,
            'email': msg.email,
            'company': msg.company,
            'phone': msg.phone,
            'message': msg.message,
            'created_at': msg.created_at.isoformat(),
            'is_read': msg.is_read
        }
        for msg in messages
    ]
    return JsonResponse({'messages': data})
