from django import forms
from .models import ContactMessage


class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'company', 'phone', 'message']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'أدخل اسمك الكامل',
                'required': True
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'example@email.com',
                'required': True
            }),
            'company': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'اسم شركتك'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+213 XXX XXX XXX'
            }),
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'كيف يمكننا مساعدتك؟ أخبرنا عن احتياجاتك...',
                'rows': 5,
                'required': True
            }),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and '@' not in email:
            raise forms.ValidationError('Please enter a valid email address.')
        return email
