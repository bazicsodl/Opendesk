package workers

import (
    "encoding/json"
    "fmt"
    "math"
    "time"

    "github.com/google/uuid"
    "github.com/robfig/cron/v3"

    "opendesk/database"
    "opendesk/models"
    "opendesk/utils"
)

func StartJobAlertWorker() {
    c := cron.New(cron.WithChain())
    c.AddFunc("*/15 * * * *", func() {
        processJobAlerts()
    })
    c.Start()
}

func processJobAlerts() {
    var prefs []models.UserPreference
    database.DB.Where("alert_enabled = ?", true).Find(&prefs)

    for _, pref := range prefs {
        go processUserAlerts(pref)
    }
}

func processUserAlerts(pref models.UserPreference) {
    since := time.Now().Add(-20 * time.Minute)

    query := database.DB.Preload("Skills").
        Where("created_at >= ?", since)

    // filter: work mode (remote / hybrid / onsite)
    if len(pref.WorkModes) > 0 {
        query = query.Where("remote_type = ANY(?)", pref.WorkModes)
    }

    // filter: employment types
    if len(pref.PreferredTypes) > 0 {
        query = query.Where("employment_type = ANY(?)", pref.PreferredTypes)
    }

    // filter: salary
    if pref.SalaryMin > 0 {
        query = query.Where("salary_max >= ?", pref.SalaryMin)
    }

    // Load jobs
    var jobs []models.Job
    query.Find(&jobs)
    if len(jobs) == 0 {
        return
    }

    // ------------------------------------
    // GEO LOCATION FILTERING
    // ------------------------------------
    var prefLoc struct {
        Label string  `json:"label"`
        Lat   float64 `json:"lat"`
        Lng   float64 `json:"lng"`
    }

    useGeo := false
    if len(pref.Location) > 0 && pref.RadiusKm > 0 {
        if err := json.Unmarshal(pref.Location, &prefLoc); err == nil {
            if prefLoc.Lat != 0 && prefLoc.Lng != 0 {
                useGeo = true
            }
        }
    }

    filtered := jobs

    // radius filtering
    if useGeo {
        temp := []models.Job{}
        for _, job := range jobs {

            // job must have coordinates
            if job.Lat == 0 || job.Lng == 0 {
                continue
            }

            dist := haversine(prefLoc.Lat, prefLoc.Lng, job.Lat, job.Lng)
            if int(dist) <= pref.RadiusKm {
                temp = append(temp, job)
            }
        }
        filtered = temp
    }

    if len(filtered) == 0 {
        return
    }

    // ------------------------------------
    // SEND ALERTS (avoid duplicates)
    // ------------------------------------
    for _, job := range filtered {

        // Convert job.ID (string) → uuid.UUID
        jobUUID, err := uuid.Parse(job.ID)
        if err != nil {
            continue
        }

        var existing models.JobAlert
        database.DB.
            Where("user_id = ? AND job_id = ?", pref.UserID, jobUUID).
            First(&existing)

        // already alerted
        if existing.ID != 0 {
            continue
        }

        // send email
        if err := sendAlertsForUser(pref.UserID, job); err != nil {
            fmt.Println("job alert send error:", err)
            continue
        }

        // save new alert
        database.DB.Create(&models.JobAlert{
            UserID: pref.UserID,
            JobID:  jobUUID,
            SentAt: time.Now(),
        })
    }
}

func sendAlertsForUser(userID string, job models.Job) error {
    var user models.User
    if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
        return err
    }

    subject := "New job match on Opendesk: " + job.Title

    body := fmt.Sprintf(`
        <h2>%s</h2>
        <p>%s</p>
        <p><strong>%s</strong> — %s</p>
        <p><a href="%s/jobs/%s">View job</a></p>
    `,
        job.Title,
        job.Description,
        job.Company,
        job.Location,
        utils.GetFrontendURL(),
        job.ID,
    )

    return utils.SendEmail(user.Email, user.DisplayName, subject, body)
}

// Haversine distance in KM
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
    const R = 6371
    dLat := (lat2 - lat1) * math.Pi / 180
    dLon := (lon2 - lon1) * math.Pi / 180

    a := math.Sin(dLat/2)*math.Sin(dLat/2) +
        math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
            math.Sin(dLon/2)*math.Sin(dLon/2)

    c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
    return R * c
}
