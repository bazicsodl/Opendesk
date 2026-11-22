package utils

import "fmt"

func PasswordResetHTML(username, resetURL string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f7fa; padding: 20px;">
	<div style="max-width:550px; margin:auto; background:white; padding:30px; border-radius:10px; border:1px solid #eee;">
		
		<h2 style="color:#1a73e8; text-align:center;">🔐 Reset Your Password</h2>

		<p>Hello %s,</p>

		<p>We received a request to reset your password on <strong>Opendesk</strong>.</p>
		
		<p>Click the button below to reset it:</p>

		<a href="%s" style="
			display:block;
			background:#1a73e8;
			color:white;
			text-decoration:none;
			text-align:center;
			padding:12px 20px;
			margin:20px 0;
			border-radius:6px;
			font-size:16px;">
			Reset Password
		</a>

		<p>If the button doesn’t work, copy this link:</p>
		<p style="word-break: break-all; color:#555;">%s</p>

		<p>If you didn’t request this, you can safely ignore this email.</p>

		<p style="margin-top:35px; font-size:13px; color:#888; text-align:center;">
			© Opendesk %d — All rights reserved.
		</p>

	</div>
</body>
</html>
`, username, resetURL, resetURL, 2025)
}

func EmailVerificationHTML(email, verifyURL string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:Arial; background:#f8f9fa; padding:20px;">
<div style="max-width:550px; margin:auto; background:white; padding:30px; border-radius:10px;">
	<h2 style="color:#1a73e8; text-align:center;">Verify Your Email</h2>
	<p>Hi %s,</p>
	<p>Welcome to <strong>Opendesk</strong>! Please verify your email address to activate your account.</p>

	<a href="%s" style="
		display:block;
		background:#1a73e8;
		color:white;
		text-decoration:none;
		text-align:center;
		padding:12px 20px;
		margin:20px 0;
		border-radius:6px;
		font-size:16px;">
		Verify Email
	</a>

	<p>If the button doesn't work, copy this link:</p>
	<p style="word-break: break-all;">%s</p>

	<p style="margin-top:30px; font-size:12px; text-align:center; color:#777;">© Opendesk 2025</p>
</div>
</body>
</html>
`, email, verifyURL, verifyURL)
}

func LoginSecurityAlert(name, ip string, url string, info DeviceInfo) string {
	return fmt.Sprintf(`
	<div style="font-family:Arial; padding:20px;">
		<h2 style="color:#D97706;">Security Alert</h2>

		<p>Hello %s,</p>

		<p>A login to your account was detected.</p>

		<p><b>IP Address:</b> %s<br>
		   <b>Device:</b> %s<br>
		   <b>OS:</b> %s<br>
		   <b>Browser:</b> %s</p>

		<p>If this wasn't you, change your password:</p>

		<a href="%s" style="padding:12px 18px; background:#D97706; color:white; text-decoration:none; border-radius:6px;">Reset Password</a>

		<p style="margin-top:30px; font-size:12px; color:#888;">
			Opendesk Security Team
		</p>
	</div>
	`, name, ip, info.Device, info.OS, info.Browser, url)
}

