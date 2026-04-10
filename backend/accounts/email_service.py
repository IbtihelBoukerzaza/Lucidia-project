from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def send_activation_email(*, recipient_email, recipient_name, activation_url):
    subject = "Activate your SentivyaDZ account"

    text_content = f"""
Hello {recipient_name or "there"},

Your SentivyaDZ account has been approved.

Please activate your account and set your password using the link below:
{activation_url}

This link will expire after 24 hours and can only be used once.

If you did not expect this email, you can ignore it.

SentivyaDZ Team
""".strip()

    html_content = f"""
<html>
  <body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:16px; padding:32px;">
      <h2 style="margin-top:0; color:#7dd3fc;">SentivyaDZ Account Activation</h2>
      <p>Hello {recipient_name or "there"},</p>
      <p>Your SentivyaDZ account has been approved.</p>
      <p>Please activate your account and set your password using the button below:</p>

      <p style="margin:32px 0;">
        <a
          href="{activation_url}"
          style="background:linear-gradient(90deg,#0ea5e9,#14b8a6,#34d399); color:#020617; text-decoration:none; padding:14px 22px; border-radius:999px; font-weight:700;"
        >
          Activate Account
        </a>
      </p>

      <p>If the button does not work, use this link:</p>
      <p><a href="{activation_url}" style="color:#7dd3fc;">{activation_url}</a></p>

      <p style="margin-top:24px;">This link will expire after 24 hours and can only be used once.</p>
      <p>If you did not expect this email, you can ignore it.</p>

      <hr style="border:none; border-top:1px solid #1f2937; margin:24px 0;" />
      <p style="color:#94a3b8; font-size:14px;">SentivyaDZ Team</p>
    </div>
  </body>
</html>
""".strip()

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)