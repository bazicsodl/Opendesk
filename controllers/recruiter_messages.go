package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"opendesk/database"
	"opendesk/models"
	"opendesk/realtime"
)

// SendMessageToApplicant POST /jobs/:id/message
// body: { "to_user_id": "...", "text": "..." }
func SendMessageToApplicant(c *gin.Context) {
	jobID := c.Param("id")
	fromUserID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(fromUserID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var body struct {
		ToUserID string `json:"to_user_id"`
		Text     string `json:"text"`
	}

	if err := c.BindJSON(&body); err != nil || body.ToUserID == "" || body.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// verify job exists and ownership
	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if job.CreatedBy != fromUserID {
		// if recruiter owner, allow
		if job.RecruiterID != (uuid.UUID{}) {
			var rec models.Recruiter
			if err := database.DB.First(&rec, "id = ?", job.RecruiterID).Error; err == nil {
				if rec.UserID.String() != fromUserID {
					c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
					return
				}
			} else {
				c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
			return
		}
	}
	if !isApplicantForJob(jobID, body.ToUserID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "recipient is not an applicant for this job"})
		return
	}
	if isInteractionBlocked(fromUserID, body.ToUserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	// Save message
	msg := models.RecruiterMessage{
		JobID:      jobID,
		FromUserID: fromUserID,
		ToUserID:   body.ToUserID,
		Text:       body.Text,
		CreatedAt:  time.Now(),
	}
	database.DB.Create(&msg)

	// Send realtime notification if applicant is online
	realtime.NotificationHub.Send(body.ToUserID, gin.H{
		"event": "recruiter_message",
		"data": gin.H{
			"id":         msg.ID,
			"job_id":     msg.JobID,
			"from_user":  msg.FromUserID,
			"text":       msg.Text,
			"created_at": msg.CreatedAt,
		},
	})

	// Also create a persisted notification in DB if your app has notifications model
	// _ = CreateNotification(body.ToUserID, fromUserID, "message", msg.ID, map[string]interface{}{"snippet": msg.Text, "job_id": jobID})

	c.JSON(http.StatusOK, gin.H{"message": "sent", "id": msg.ID})
}

// GetMessagesForApplicant GET /jobs/:id/messages/:applicantId
// returns chat history between recruiter and applicant for this job
func GetMessagesForApplicant(c *gin.Context) {
	jobID := c.Param("id")
	applicantID := c.Param("applicantId")
	userID := c.GetString("user_id") // recruiter
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	// verify ownership similar to above
	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if job.CreatedBy != userID {
		// check recruiter owner...
		var rec models.Recruiter
		if err := database.DB.First(&rec, "id = ?", job.RecruiterID).Error; err != nil || rec.UserID.String() != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
			return
		}
	}
	if !isApplicantForJob(jobID, applicantID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "applicant not found for this job"})
		return
	}
	if isInteractionBlocked(userID, applicantID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	var msgs []models.RecruiterMessage
	database.DB.Where("job_id = ? AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))",
		jobID, userID, applicantID, applicantID, userID).Order("created_at ASC").Find(&msgs)

	c.JSON(http.StatusOK, msgs)
}

func isApplicantForJob(jobID, applicantID string) bool {
	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		return false
	}
	applicantUUID, err := uuid.Parse(applicantID)
	if err != nil {
		return false
	}
	var application models.JobApplication
	return database.DB.Where("job_id = ? AND applicant_id = ?", jobUUID, applicantUUID).
		First(&application).Error == nil
}
