package controllers

import (
	"net/http"
	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetRecruiterJobs(c *gin.Context) {
	userID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var jobs []models.Job
	if err := database.DB.
		Preload("Skills").
		Where("created_by = ?", userID).
		Order("created_at DESC").
		Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]gin.H, 0, len(jobs))
	for _, job := range jobs {
		var applicantsCount int64
		_ = database.DB.Model(&models.JobApplication{}).Where("job_id = ?", job.ID).Count(&applicantsCount).Error
		resp = append(resp, gin.H{
			"id":               job.ID,
			"title":            job.Title,
			"company":          job.Company,
			"description":      job.Description,
			"location":         job.Location,
			"employment_type":  job.EmploymentType,
			"remote_type":      job.RemoteType,
			"salary_min":       job.SalaryMin,
			"salary_max":       job.SalaryMax,
			"skills":           job.Skills,
			"created_at":       job.CreatedAt,
			"boost_score":      job.BoostScore,
			"applicants_count": applicantsCount,
		})
	}

	c.JSON(http.StatusOK, resp)
}

func GetRecruiterJobByID(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var job models.Job
	if err := database.DB.Preload("Skills").First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if !isJobOwner(userID, job) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	var applicantsCount int64
	_ = database.DB.Model(&models.JobApplication{}).Where("job_id = ?", job.ID).Count(&applicantsCount).Error

	var metric models.JobMetric
	_ = database.DB.Where("job_id = ?", job.ID).First(&metric).Error

	c.JSON(http.StatusOK, gin.H{
		"id":               job.ID,
		"title":            job.Title,
		"company":          job.Company,
		"description":      job.Description,
		"location":         job.Location,
		"employment_type":  job.EmploymentType,
		"remote_type":      job.RemoteType,
		"salary_min":       job.SalaryMin,
		"salary_max":       job.SalaryMax,
		"skills":           job.Skills,
		"created_at":       job.CreatedAt,
		"boost_score":      job.BoostScore,
		"applicants_count": applicantsCount,
		"views":            metric.Views,
		"clicks":           metric.Clicks,
		"applications":     metric.Applications,
	})
}

func GetRecruiterJobApplicants(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if !isJobOwner(userID, job) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}

	var apps []models.JobApplication
	if err := database.DB.Where("job_id = ?", jobUUID).Order("created_at DESC").Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]gin.H, 0, len(apps))
	for _, app := range apps {
		applicantID := app.ApplicantID.String()
		var u models.User
		var p models.Profile
		_ = database.DB.First(&u, "id = ?", applicantID).Error
		_ = database.DB.Where("user_id = ?", applicantID).First(&p).Error

		resp = append(resp, gin.H{
			"id":         app.ID,
			"user_id":    applicantID,
			"status":     app.Status,
			"created_at": app.CreatedAt,
			"user": gin.H{
				"name":     u.DisplayName,
				"headline": p.Headline,
				"location": p.Location,
				"skills":   p.Skills,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func GetRecruiterApplicant(c *gin.Context) {
	appID := c.Param("id")
	userID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var app models.JobApplication
	if err := database.DB.First(&app, "id = ?", appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	jobID := app.JobID.String()
	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if !isJobOwner(userID, job) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	applicantID := app.ApplicantID.String()
	var u models.User
	var p models.Profile
	_ = database.DB.First(&u, "id = ?", applicantID).Error
	_ = database.DB.Where("user_id = ?", applicantID).First(&p).Error

	c.JSON(http.StatusOK, gin.H{
		"id":         app.ID,
		"status":     app.Status,
		"applied_at": app.CreatedAt,
		"user": gin.H{
			"id":         u.ID,
			"name":       u.DisplayName,
			"headline":   p.Headline,
			"bio":        p.Bio,
			"location":   p.Location,
			"skills":     p.Skills,
			"experience": []gin.H{},
			"education":  []gin.H{},
			"cv_url":     app.ResumeURL,
		},
	})
}

func RecruiterReviewApplication(c *gin.Context) {
	userID := c.GetString("user_id")
	if _, err := getRecruiterByUserID(userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}
	appID := c.Param("id")
	action := c.Param("action")

	status := ""
	switch action {
	case "accept":
		status = "accepted"
	case "reject":
		status = "rejected"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
		return
	}

	var app models.JobApplication
	if err := database.DB.First(&app, "id = ?", appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	var job models.Job
	if err := database.DB.First(&job, "id = ?", app.JobID.String()).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if !isJobOwner(userID, job) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	if err := database.DB.Model(&app).Update("status", status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "application updated", "status": status})
}
