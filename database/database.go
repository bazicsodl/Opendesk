package database

import (
	"fmt"
	"log"
	"opendesk/models"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	DB = db

	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto;").Error; err != nil {
		log.Println("Could not create extension:", err)
	}

	modelsToEnsure := []interface{}{
		&models.User{},
		&models.Profile{},
		&models.Post{},
		&models.Comment{},
		&models.Connection{},
		&models.Conversation{},
		&models.ConversationParticipant{},
		&models.Message{},
		&models.Attachment{},
		&models.Notification{},
		&models.PasswordReset{},
		&models.Recruiter{},
		&models.Job{},
		&models.JobSkill{},
		&models.JobApplication{},
		&models.UserSkill{},
		&models.UserPreference{},
		&models.JobAlert{},
		&models.JobMetric{},
		&models.JobEvent{},
		&models.RecruiterMessage{},
		&models.PostLike{},
		&models.Block{},
	}
	for _, m := range modelsToEnsure {
		if !db.Migrator().HasTable(m) {
			if err := db.Migrator().CreateTable(m); err != nil {
				log.Printf("Schema patch warning (create table %T): %v", m, err)
			}
		}
	}

	// Ensure high-impact tables exist even if AutoMigrate partially failed.
	if !db.Migrator().HasTable(&models.JobApplication{}) {
		if err := db.Migrator().CreateTable(&models.JobApplication{}); err != nil {
			log.Println("Schema patch warning (job_applications create):", err)
		}
	}
	if !db.Migrator().HasTable(&models.JobEvent{}) {
		if err := db.Migrator().CreateTable(&models.JobEvent{}); err != nil {
			log.Println("Schema patch warning (job_events create):", err)
		}
	}
	if !db.Migrator().HasTable(&models.JobMetric{}) {
		if err := db.Migrator().CreateTable(&models.JobMetric{}); err != nil {
			log.Println("Schema patch warning (job_metrics create):", err)
		}
	}
	if !db.Migrator().HasTable(&models.UserPreference{}) {
		if err := db.Migrator().CreateTable(&models.UserPreference{}); err != nil {
			log.Println("Schema patch warning (user_preferences create):", err)
		}
	}

	// Backward-compatible safety for older deployments where table exists but fields do not.
	ensureColumn := func(model interface{}, column string) {
		if !db.Migrator().HasColumn(model, column) {
			if err := db.Migrator().AddColumn(model, column); err != nil {
				log.Printf("Schema patch warning (add column %T.%s): %v", model, column, err)
			}
		}
	}
	ensureColumn(&models.Job{}, "Lat")
	ensureColumn(&models.Job{}, "Lng")
	ensureColumn(&models.Profile{}, "School")
	ensureColumn(&models.Profile{}, "Degree")
	ensureColumn(&models.Profile{}, "Company")
	ensureColumn(&models.Profile{}, "Website")
	ensureColumn(&models.Profile{}, "CurrentRole")
	ensureColumn(&models.Profile{}, "Experience")
	ensureColumn(&models.Profile{}, "EducationDetails")
	ensureColumn(&models.Profile{}, "FeaturedLinks")
	ensureColumn(&models.Profile{}, "ImageURL")
	ensureColumn(&models.Profile{}, "CoverImageURL")
	ensureColumn(&models.Post{}, "MediaType")
	ensureColumn(&models.Post{}, "MediaName")
	ensureColumn(&models.User{}, "VerifyExpiresAt")

	log.Println("Database connected and migrated")
}
