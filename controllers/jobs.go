package controllers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"opendesk/database"
	"opendesk/models"
)

type jobInput struct {
	Title          string   `json:"title"`
	Company        string   `json:"company"`
	Description    string   `json:"description"`
	Location       string   `json:"location"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	EmploymentType string   `json:"employment_type"`
	RemoteType     string   `json:"remote_type"`
	SalaryMin      int      `json:"salary_min"`
	SalaryMax      int      `json:"salary_max"`
	Skills         []string `json:"skills"`
}

func validateJobInput(body *jobInput) error {
	body.Title = strings.TrimSpace(body.Title)
	body.Company = strings.TrimSpace(body.Company)
	body.Description = strings.TrimSpace(body.Description)
	body.Location = strings.TrimSpace(body.Location)
	body.EmploymentType = strings.ToLower(strings.TrimSpace(body.EmploymentType))
	body.RemoteType = strings.ToLower(strings.TrimSpace(body.RemoteType))

	if body.Title == "" || body.Company == "" || body.Description == "" {
		return fmt.Errorf("title, company, and description are required")
	}
	if len(body.Title) > 160 || len(body.Company) > 160 || len(body.Location) > 200 || len(body.Description) > 20000 {
		return fmt.Errorf("one or more job fields exceed the allowed length")
	}
	if body.EmploymentType != "" && !map[string]bool{"full-time": true, "part-time": true, "contract": true, "internship": true, "freelance": true, "temporary": true}[body.EmploymentType] {
		return fmt.Errorf("invalid employment type")
	}
	if body.RemoteType != "" && !map[string]bool{"remote": true, "hybrid": true, "onsite": true}[body.RemoteType] {
		return fmt.Errorf("invalid remote type")
	}
	if body.SalaryMin < 0 || body.SalaryMax < 0 || (body.SalaryMax > 0 && body.SalaryMin > body.SalaryMax) {
		return fmt.Errorf("salary values must be non-negative and salary maximum cannot be below salary minimum")
	}
	if body.Lat < -90 || body.Lat > 90 || body.Lng < -180 || body.Lng > 180 {
		return fmt.Errorf("invalid coordinates")
	}

	seen := make(map[string]struct{}, len(body.Skills))
	skills := make([]string, 0, len(body.Skills))
	for _, skill := range body.Skills {
		skill = strings.TrimSpace(skill)
		if skill == "" {
			continue
		}
		if len(skill) > 80 {
			return fmt.Errorf("skills must be 80 characters or fewer")
		}
		key := strings.ToLower(skill)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		skills = append(skills, skill)
	}
	if len(skills) > 30 {
		return fmt.Errorf("a job can have at most 30 skills")
	}
	body.Skills = skills
	return nil
}

// CREATE JOB --------------------------------------------------------
func CreateJob(c *gin.Context) {
	recruiterID := c.GetString("user_id") // recruiter user ID from JWT

	rec, err := getRecruiterByUserID(recruiterID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "recruiter profile required"})
		return
	}

	var body jobInput

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := validateJobInput(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	job := models.Job{
		ID:             uuid.NewString(),
		RecruiterID:    rec.ID,
		Title:          body.Title,
		Company:        body.Company,
		Description:    body.Description,
		Location:       body.Location,
		Lat:            body.Lat,
		Lng:            body.Lng,
		EmploymentType: body.EmploymentType,
		RemoteType:     body.RemoteType,
		SalaryMin:      body.SalaryMin,
		SalaryMax:      body.SalaryMax,
		CreatedBy:      recruiterID,
	}

	jobUUID, err := uuid.Parse(job.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create job"})
		return
	}
	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&job).Error; err != nil {
			return err
		}
		for _, skill := range body.Skills {
			if err := tx.Create(&models.JobSkill{JobID: jobUUID, Skill: skill}).Error; err != nil {
				return err
			}
		}
		return nil
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create job"})
		return
	}

	c.JSON(http.StatusOK, job)
}

// GET JOBS --------------------------------------------------------
func GetJobs(c *gin.Context) {
	var jobs []models.Job

	if err := database.DB.Preload("Skills").Order("created_at DESC").Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func GetJobByID(c *gin.Context) {
	jobID := c.Param("id")
	var job models.Job

	if err := database.DB.Preload("Skills").First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	c.JSON(http.StatusOK, job)
}

// APPLY FOR JOB --------------------------------------------------------
func ApplyForJob(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if job.CreatedBy == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "you cannot apply to your own job"})
		return
	}

	var body struct {
		ResumeURL   string `json:"resume_url"`
		CoverLetter string `json:"cover_letter"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	var existing models.JobApplication
	if err := database.DB.Where("job_id = ? AND applicant_id = ?", jobUUID, userUUID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "you have already applied to this job"})
		return
	}

	application := models.JobApplication{
		ID:          uuid.New(),
		JobID:       jobUUID,
		ApplicantID: userUUID,
		ResumeURL:   body.ResumeURL,
		CoverLetter: body.CoverLetter,
		Status:      "pending",
		CreatedAt:   time.Now(),
	}

	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&application).Error; err != nil {
			return err
		}
		return recordJobEvent(tx, jobID, userID, "apply", "")
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not submit application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "application submitted"})
}

// GET JOB APPLICATIONS --------------------------------------------------------
func GetJobApplications(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
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

	var apps []models.JobApplication
	if err := database.DB.Where("job_id = ?", jobUUID).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, apps)
}

// SIMPLE RECOMMENDER --------------------------------------------------------
func GetRecommendedJobs(c *gin.Context) {
	userID := c.GetString("user_id")

	var userSkills []models.UserSkill
	database.DB.Where("user_id = ?", userID).Find(&userSkills)

	if len(userSkills) == 0 {
		var jobs []models.Job
		database.DB.Preload("Skills").Order("created_at DESC").Limit(10).Find(&jobs)
		c.JSON(http.StatusOK, jobs)
		return
	}

	skillStrings := []string{}
	for _, s := range userSkills {
		skillStrings = append(skillStrings, s.Skill)
	}

	var jobs []models.Job
	database.DB.
		Joins("LEFT JOIN job_skills ON job_skills.job_id = jobs.id").
		Where("job_skills.skill IN ?", skillStrings).
		Preload("Skills").
		Order("created_at DESC").
		Find(&jobs)

	c.JSON(http.StatusOK, jobs)
}

// HAVERSINE --------------------------------------------------------
func haversineKm(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	return 2 * R * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

// SCORE FUNCTION --------------------------------------------------------
func scoreJob(job models.Job, userSkills []string, preferredTitles []string, userLat, userLng float64) float64 {
	score := 0.0

	m := map[string]bool{}
	for _, s := range userSkills {
		m[strings.ToLower(s)] = true
	}

	cs := 0
	for _, s := range job.Skills {
		if m[strings.ToLower(s.Skill)] {
			cs++
		}
	}
	score += float64(cs) * 8

	if len(preferredTitles) > 0 {
		title := strings.ToLower(job.Title + " " + job.Description)
		for _, t := range preferredTitles {
			t = strings.TrimSpace(strings.ToLower(t))
			if t != "" && strings.Contains(title, t) {
				score += 12
				break
			}
		}
	}

	if userLat != 0 && userLng != 0 && job.Lat != 0 && job.Lng != 0 {
		dist := haversineKm(userLat, userLng, job.Lat, job.Lng)
		score += math.Max(0, 30-(dist/5))
	}

	if strings.ToLower(job.RemoteType) == "remote" {
		score += 10
	} else if strings.ToLower(job.RemoteType) == "hybrid" {
		score += 5
	}

	score += float64(job.BoostScore)
	return score
}

// ADVANCED RECOMMENDATION --------------------------------------------------------
func GetRecommendedJobsAdvanced(c *gin.Context) {
	userID := c.GetString("user_id")

	var userSkills []models.UserSkill
	database.DB.Where("user_id = ?", userID).Find(&userSkills)

	skills := []string{}
	for _, s := range userSkills {
		skills = append(skills, s.Skill)
	}

	var myProfile models.Profile
	if err := database.DB.Where("user_id = ?", userID).First(&myProfile).Error; err == nil {
		for _, s := range myProfile.Skills {
			skills = append(skills, s)
		}
	}

	var prefs models.UserPreference
	database.DB.Where("user_id = ?", userID).Limit(1).Find(&prefs)

	var prefLoc struct {
		Label string  `json:"label"`
		Lat   float64 `json:"lat"`
		Lng   float64 `json:"lng"`
	}

	if len(prefs.Location) > 0 {
		_ = json.Unmarshal(prefs.Location, &prefLoc)
	}

	var jobs []models.Job
	database.DB.Preload("Skills").Order("created_at DESC").Limit(500).Find(&jobs)

	type scoredJob struct {
		Job   models.Job
		Score float64
	}

	var results []scoredJob

	for _, j := range jobs {

		if prefs.RadiusKm > 0 &&
			prefLoc.Lat != 0 && prefLoc.Lng != 0 &&
			j.Lat != 0 && j.Lng != 0 {
			dist := haversineKm(prefLoc.Lat, prefLoc.Lng, j.Lat, j.Lng)
			if int(dist) > prefs.RadiusKm {
				continue
			}
		}

		score := scoreJob(j, skills, prefs.JobTitles, prefLoc.Lat, prefLoc.Lng)
		results = append(results, scoredJob{Job: j, Score: score})
	}

	sort.Slice(results, func(i, k int) bool {
		return results[i].Score > results[k].Score
	})

	limit := 20
	if len(results) < limit {
		limit = len(results)
	}

	final := []models.Job{}
	for i := 0; i < limit; i++ {
		final = append(final, results[i].Job)
	}

	c.JSON(http.StatusOK, final)
}

// POST /users/preferences
func UpsertUserPreference(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		JobTitles      []string               `json:"job_titles"`
		PreferredTypes []string               `json:"preferred_types"`
		WorkModes      []string               `json:"work_modes"`
		Location       map[string]interface{} `json:"location"` // label, lat, lng
		SalaryMin      int                    `json:"salary_min"`
		RadiusKm       int                    `json:"radius_km"`
		AlertEnabled   bool                   `json:"alert_enabled"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	locationJSON, _ := json.Marshal(body.Location)

	var pref models.UserPreference
	err := database.DB.Where("user_id = ?", userID).First(&pref).Error

	if err != nil {
		// Create new
		pref = models.UserPreference{
			UserID:         userID,
			JobTitles:      body.JobTitles,
			PreferredTypes: body.PreferredTypes,
			WorkModes:      body.WorkModes,
			Location:       locationJSON,
			SalaryMin:      body.SalaryMin,
			RadiusKm:       body.RadiusKm,
			AlertEnabled:   body.AlertEnabled,
		}
		database.DB.Create(&pref)
	} else {
		// Update existing
		database.DB.Model(&pref).Updates(map[string]interface{}{
			"job_titles":      body.JobTitles,
			"preferred_types": body.PreferredTypes,
			"work_modes":      body.WorkModes,
			"location":        locationJSON,
			"salary_min":      body.SalaryMin,
			"radius_km":       body.RadiusKm,
			"alert_enabled":   body.AlertEnabled,
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "preferences saved"})
}

// GET /users/preferences
func GetUserPreference(c *gin.Context) {
	userID := c.GetString("user_id")

	var pref models.UserPreference
	if err := database.DB.Where("user_id = ?", userID).First(&pref).Error; err != nil {
		// return defaults if nothing exists
		c.JSON(http.StatusOK, gin.H{
			"job_titles":      []string{},
			"preferred_types": []string{},
			"work_modes":      []string{},
			"location":        nil,
			"salary_min":      0,
			"radius_km":       0,
			"alert_enabled":   false,
		})
		return
	}

	// Convert Location JSON → map
	var loc map[string]interface{}
	if len(pref.Location) > 0 {
		_ = json.Unmarshal(pref.Location, &loc)
	}

	c.JSON(http.StatusOK, gin.H{
		"job_titles":      pref.JobTitles,
		"preferred_types": pref.PreferredTypes,
		"work_modes":      pref.WorkModes,
		"location":        loc,
		"salary_min":      pref.SalaryMin,
		"radius_km":       pref.RadiusKm,
		"alert_enabled":   pref.AlertEnabled,
	})
}

// PEOPLE ALSO APPLIED --------------------------------------------------------
func PeopleAlsoApplied(c *gin.Context) {
	jobID := c.Param("id")

	type Row struct {
		JobID string
		Cnt   int
	}

	var rows []Row
	database.DB.Raw(`
        SELECT ja2.job_id, COUNT(*) as cnt
        FROM job_applications ja1
        JOIN job_applications ja2 ON ja1.applicant_id = ja2.applicant_id
        WHERE ja1.job_id = ? AND ja2.job_id != ?
        GROUP BY ja2.job_id
        ORDER BY cnt DESC
        LIMIT 10
    `, jobID, jobID).Scan(&rows)

	ids := []string{}
	for _, r := range rows {
		ids = append(ids, r.JobID)
	}

	var jobs []models.Job
	database.DB.Where("id IN ?", ids).Preload("Skills").Find(&jobs)

	c.JSON(http.StatusOK, jobs)
}

// SET JOB BOOST --------------------------------------------------------
func SetJobBoost(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	var body struct {
		Boost float64 `json:"boost"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
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

	job.BoostScore = body.Boost
	database.DB.Save(&job)

	c.JSON(http.StatusOK, gin.H{"message": "boost updated"})
}

// REVIEW APPLICATION --------------------------------------------------------
func ReviewApplication(c *gin.Context) {
	userID := c.GetString("user_id")
	appID := c.Param("id")

	var body struct {
		Status string `json:"status"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if body.Status != "accepted" && body.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	var app models.JobApplication
	if err := database.DB.First(&app, "id = ?", appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	// app.JobID is uuid.UUID; Job.ID is string -> convert
	jobIDStr := app.JobID.String()

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobIDStr).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	if job.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	database.DB.Model(&app).Updates(map[string]interface{}{
		"status":      body.Status,
		"reviewed_at": time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// TRACK JOB EVENTS --------------------------------------------------------
func TrackJobEvent(c *gin.Context) {
	jobID := c.Param("id")
	if _, err := uuid.Parse(jobID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}
	var job models.Job
	if err := database.DB.Select("id").First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	var body struct {
		Event string `json:"event"`
		Meta  string `json:"meta"`
	}

	_ = c.BindJSON(&body)

	if body.Event != "view" && body.Event != "click" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event must be view or click"})
		return
	}
	if len(body.Meta) > 2000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event metadata is too large"})
		return
	}

	userID := c.GetString("user_id")

	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		return recordJobEvent(tx, jobID, userID, body.Event, body.Meta)
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not record job event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func recordJobEvent(tx *gorm.DB, jobID, userID, eventType, meta string) error {
	event := models.JobEvent{
		ID:        uuid.NewString(),
		JobID:     jobID,
		UserID:    userID,
		EventType: eventType,
		Meta:      meta,
		CreatedAt: time.Now(),
	}
	if err := tx.Create(&event).Error; err != nil {
		return err
	}

	views, clicks, applications := 0, 0, 0
	switch eventType {
	case "view":
		views = 1
	case "click":
		clicks = 1
	case "apply":
		applications = 1
	default:
		return fmt.Errorf("unsupported job event")
	}

	return tx.Exec(`
		INSERT INTO job_metrics (job_id, views, clicks, applications, last_updated)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (job_id) DO UPDATE SET
			views = job_metrics.views + EXCLUDED.views,
			clicks = job_metrics.clicks + EXCLUDED.clicks,
			applications = job_metrics.applications + EXCLUDED.applications,
			last_updated = EXCLUDED.last_updated
	`, jobID, views, clicks, applications, time.Now()).Error
}

// GET JOB METRICS --------------------------------------------------------
func GetJobMetrics(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	if job.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	var metric models.JobMetric
	if err := database.DB.First(&metric, "job_id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"views":              0,
			"clicks":             0,
			"applications":       0,
			"ctr_percent":        0,
			"conversion_percent": 0,
		})
		return
	}

	ctr := 0.0
	if metric.Views > 0 {
		ctr = (float64(metric.Clicks) / float64(metric.Views)) * 100
	}

	conv := 0.0
	if metric.Clicks > 0 {
		conv = (float64(metric.Applications) / float64(metric.Clicks)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"views":              metric.Views,
		"clicks":             metric.Clicks,
		"applications":       metric.Applications,
		"ctr_percent":        ctr,
		"conversion_percent": conv,
	})
}

func isJobOwner(userID string, job models.Job) bool {
	if job.CreatedBy == userID {
		return true
	}
	if job.RecruiterID != (uuid.UUID{}) {
		var rec models.Recruiter
		if err := database.DB.First(&rec, "id = ?", job.RecruiterID).Error; err == nil {
			return rec.UserID.String() == userID
		}
	}
	return false
}

// EDIT JOB --------------------------------------------------------
func EditJob(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if !isJobOwner(userID, job) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not owner"})
		return
	}

	var body jobInput

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := validateJobInput(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"title":           body.Title,
		"company":         body.Company,
		"description":     body.Description,
		"location":        body.Location,
		"lat":             body.Lat,
		"lng":             body.Lng,
		"employment_type": body.EmploymentType,
		"remote_type":     body.RemoteType,
		"salary_min":      body.SalaryMin,
		"salary_max":      body.SalaryMax,
	}

	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}
	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Job{}).Where("id = ?", jobID).Updates(updates).Error; err != nil {
			return err
		}
		if err := tx.Where("job_id = ?", jobUUID).Delete(&models.JobSkill{}).Error; err != nil {
			return err
		}
		for _, skill := range body.Skills {
			if err := tx.Create(&models.JobSkill{JobID: jobUUID, Skill: skill}).Error; err != nil {
				return err
			}
		}
		return nil
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "job updated"})
}

// DeleteJob DELETE /jobs/:id
func DeleteJob(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetString("user_id")

	var job models.Job
	if err := database.DB.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	// permission check same as EditJob
	if job.CreatedBy != userID {
		if job.RecruiterID != (uuid.UUID{}) {
			var rec models.Recruiter
			if err := database.DB.First(&rec, "id = ?", job.RecruiterID).Error; err == nil {
				if rec.UserID.String() != userID {
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

	// cascade delete: job skills, job applications, job events/metrics
	// JobSkill.JobID is uuid.UUID so convert
	jobUUID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}
	database.DB.Where("job_id = ?", jobUUID).Delete(&models.JobSkill{})

	database.DB.Where("job_id = ?", jobID).Delete(&models.JobApplication{}) // job_applications.job_id is uuid in DB; GORM will handle string/uuid
	database.DB.Where("job_id = ?", jobID).Delete(&models.JobEvent{})
	database.DB.Where("job_id = ?", jobID).Delete(&models.JobMetric{})

	database.DB.Delete(&job)
	c.JSON(http.StatusOK, gin.H{"message": "job deleted"})
}
