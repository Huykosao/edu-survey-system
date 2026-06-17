"""
services/email.py
─────────────────
Dịch vụ gửi email sử dụng SMTP để gửi thông tin tài khoản và mật khẩu mới cho người dùng.
Hỗ trợ gửi email thực tế và giả lập (in ra console) khi chưa cấu hình SMTP.
"""

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from loguru import logger
from src.config import env

def send_email(subject: str, recipient: str, html_content: str) -> bool:
    """
    Gửi email bằng HTML qua giao thức SMTP.
    Nếu cấu hình SMTP trống, chương trình sẽ tự động in nội dung email ra console để phát triển.
    """
    if not env.SMTP_HOST or not env.SMTP_USERNAME or not env.SMTP_PASSWORD:
        logger.warning("SMTP chưa được cấu hình đầy đủ. Hệ thống sẽ GIẢ LẬP gửi email qua console.")
        print("\n" + "="*80)
        print(f"[SIMULATED EMAIL TO {recipient}]")
        print(f"Subject: {subject}")
        print("-" * 80)
        # Clean plain text logging for console preview
        import re
        plain_text = re.sub('<[^<]+?>', '', html_content)
        plain_text = "\n".join([line.strip() for line in plain_text.splitlines() if line.strip()])
        print(plain_text[:1000]) # Limit length on console
        print("="*80 + "\n")
        return True

    try:
        # Khởi tạo message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = env.SMTP_SENDER
        msg["To"] = recipient

        # Đính kèm nội dung HTML dạng UTF-8
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Gửi qua SSL hoặc STARTTLS tùy cấu hình
        if env.SMTP_USE_SSL:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(env.SMTP_HOST, env.SMTP_PORT, context=context, timeout=10) as server:
                server.login(env.SMTP_USERNAME, env.SMTP_PASSWORD)
                server.sendmail(env.SMTP_SENDER, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(env.SMTP_HOST, env.SMTP_PORT, timeout=10) as server:
                if env.SMTP_USE_TLS:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                server.login(env.SMTP_USERNAME, env.SMTP_PASSWORD)
                server.sendmail(env.SMTP_SENDER, [recipient], msg.as_string())

        logger.info(f"Đã gửi email thành công tới {recipient} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Lỗi khi gửi email tới {recipient}: {str(e)}")
        return False


def send_password_reset_email(email: str, new_password: str) -> bool:
    """Gửi email thông báo đặt lại mật khẩu với giao diện thiết kế chuyên nghiệp."""
    subject = "EduSurvey - Đặt lại mật khẩu thành công"
    login_url = f"{env.FRONTEND_URL}/login"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f4f6f9;
                color: #1e293b;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
                padding: 32px 24px;
                text-align: center;
            }}
            .logo {{
                color: #ffffff;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.025em;
                margin: 0;
                text-transform: uppercase;
            }}
            .content {{
                padding: 40px 32px;
            }}
            h1 {{
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
                margin-top: 0;
                margin-bottom: 16px;
            }}
            p {{
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
                margin-top: 0;
                margin-bottom: 24px;
            }}
            .credential-card {{
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 32px;
            }}
            .credential-row {{
                display: flex;
                margin-bottom: 12px;
                font-size: 15px;
            }}
            .credential-row:last-child {{
                margin-bottom: 0;
            }}
            .label {{
                font-weight: 600;
                color: #64748b;
                width: 140px;
                min-width: 140px;
            }}
            .value {{
                color: #0f172a;
                font-weight: 500;
            }}
            .value-pwd {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 16px;
                font-weight: 700;
                color: #4f46e5;
                background-color: #e0e7ff;
                padding: 4px 8px;
                border-radius: 6px;
            }}
            .btn-container {{
                text-align: center;
                margin-top: 32px;
            }}
            .btn {{
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                display: inline-block;
                transition: background-color 0.2s;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            }}
            .warning {{
                font-size: 13px;
                color: #ef4444;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px dashed #e2e8f0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }}
            .footer-text {{
                font-size: 12px;
                color: #94a3b8;
                margin: 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduSurvey</div>
            </div>
            <div class="content">
                <h1>Yêu Cầu Đặt Lại Mật Khẩu</h1>
                <p>Xin chào,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống EduSurvey. Mật khẩu tạm thời mới của bạn đã được tạo thành công bên dưới:</p>
                
                <div class="credential-card">
                    <div class="credential-row">
                        <span class="label">Email:</span>
                        <span class="value">{email}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">Mật khẩu mới:</span>
                        <span class="value-pwd">{new_password}</span>
                    </div>
                </div>

                <div class="btn-container">
                    <a href="{login_url}" class="btn" target="_blank">Đăng Nhập Ngay</a>
                </div>

                <p class="warning">
                    ⚠️ <strong>Lưu ý quan trọng:</strong> Vì lý do bảo mật, vui lòng đăng nhập và thay đổi mật khẩu này ngay sau khi đăng nhập thành công.
                </p>
            </div>
            <div class="footer">
                <p class="footer-text">Hệ thống khảo sát ý kiến phản hồi người học EduSurvey</p>
                <p class="footer-text" style="margin-top: 4px;">Đây là email tự động. Vui lòng không trả lời trực tiếp thư này.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(subject, email, html_content)


def send_account_creation_email(email: str, password: str, full_name: str) -> bool:
    """Gửi email chào mừng và tài khoản mới cho thành viên do Admin tạo."""
    subject = "Tài khoản hệ thống khảo sát EduSurvey của bạn đã được tạo"
    login_url = f"{env.FRONTEND_URL}/login"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f4f6f9;
                color: #1e293b;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
                padding: 32px 24px;
                text-align: center;
            }}
            .logo {{
                color: #ffffff;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.025em;
                margin: 0;
                text-transform: uppercase;
            }}
            .content {{
                padding: 40px 32px;
            }}
            h1 {{
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
                margin-top: 0;
                margin-bottom: 16px;
            }}
            p {{
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
                margin-top: 0;
                margin-bottom: 24px;
            }}
            .credential-card {{
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 32px;
            }}
            .credential-row {{
                display: flex;
                margin-bottom: 12px;
                font-size: 15px;
            }}
            .credential-row:last-child {{
                margin-bottom: 0;
            }}
            .label {{
                font-weight: 600;
                color: #64748b;
                width: 140px;
                min-width: 140px;
            }}
            .value {{
                color: #0f172a;
                font-weight: 500;
            }}
            .value-pwd {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 16px;
                font-weight: 700;
                color: #4f46e5;
                background-color: #e0e7ff;
                padding: 4px 8px;
                border-radius: 6px;
            }}
            .btn-container {{
                text-align: center;
                margin-top: 32px;
            }}
            .btn {{
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                display: inline-block;
                transition: background-color 0.2s;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            }}
            .warning {{
                font-size: 13px;
                color: #ef4444;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px dashed #e2e8f0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }}
            .footer-text {{
                font-size: 12px;
                color: #94a3b8;
                margin: 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduSurvey</div>
            </div>
            <div class="content">
                <h1>Chào Mừng Bạn Đến Với EduSurvey</h1>
                <p>Xin chào <strong>{full_name}</strong>,</p>
                <p>Một tài khoản mới đã được tạo cho bạn trên hệ thống EduSurvey để tham gia khảo sát và quản lý thông tin. Dưới đây là thông tin tài khoản đăng nhập của bạn:</p>
                
                <div class="credential-card">
                    <div class="credential-row">
                        <span class="label">Email đăng nhập:</span>
                        <span class="value">{email}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">Mật khẩu:</span>
                        <span class="value-pwd">{password}</span>
                    </div>
                </div>

                <div class="btn-container">
                    <a href="{login_url}" class="btn" target="_blank">Đăng Nhập Ngay</a>
                </div>

                <p class="warning">
                    ⚠️ <strong>Lưu ý bảo mật:</strong> Để bảo vệ tài khoản, vui lòng thay đổi mật khẩu này ngay sau khi đăng nhập lần đầu tiên.
                </p>
            </div>
            <div class="footer">
                <p class="footer-text">Hệ thống khảo sát ý kiến phản hồi người học EduSurvey</p>
                <p class="footer-text" style="margin-top: 4px;">Đây là email tự động. Vui lòng không trả lời trực tiếp thư này.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(subject, email, html_content)
