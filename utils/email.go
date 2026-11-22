package utils

import (
	"fmt"
	"net/smtp"
	"opendesk/models" // ADD THIS IMPORT
	"os"
	"strings"
)

func SendEmail(toEmail, toName, subject, htmlContent string) error {
	// SMTP settings from environment
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASS")

	from := os.Getenv("SMTP_FROM")
	if host == "" || port == "" || username == "" || password == "" {
		return fmt.Errorf("smtp not configured: check SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS")
	}
	if from == "" {
		from = username
	}
	if strings.Contains(strings.ToLower(host), "gmail") {
		from = username
	}

	// Build the full SMTP address
	addr := host + ":" + port

	// Authentication
	auth := smtp.PlainAuth("", username, password, host)

	// Full MIME email (HTML supported)
	msg := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-version: 1.0;\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\";\r\n\r\n"+
			"%s",
		from, toEmail, subject, htmlContent,
	))

	// Send email
	err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg)
	return err
}

func SendJobAlertEmail(user models.User, job models.Job) {
	subject := "New job match for you!"
	body := fmt.Sprintf(`
        <h2>New Recommended Job</h2>
        <p><strong>%s</strong></p>
        <p>%s</p>
        <p>Location: %s</p>
        <a href="https://yourfrontend.com/job/%s">View Job</a>
    `, job.Title, job.Description, job.Location, job.ID)

	// FIX SendEmail call (now passes 4 arguments)
	SendEmail(user.Email, user.DisplayName, subject, body)
}
