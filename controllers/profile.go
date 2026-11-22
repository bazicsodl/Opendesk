package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"net/http"
	"opendesk/database"
	"opendesk/models"
	"opendesk/utils"
	"strings"
)

func CreateOrUpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		Headline         *string  `json:"headline"`
		Bio              *string  `json:"bio"`
		Location         *string  `json:"location"`
		School           *string  `json:"school"`
		Degree           *string  `json:"degree"`
		Company          *string  `json:"company"`
		Website          *string  `json:"website"`
		CurrentRole      *string  `json:"current_role"`
		Experience       *string  `json:"experience"`
		EducationDetails *string  `json:"education_details"`
		FeaturedLinks    []string `json:"featured_links"`
		Skills           []string `json:"skills"`
		ImageURL         *string  `json:"image_url"`
		CoverImageURL    *string  `json:"cover_image_url"`
		ImageURLAlt      *string  `json:"imageUrl"`
		CoverURLAlt      *string  `json:"coverImageUrl"`
		CurrentRoleAlt   *string  `json:"currentRole"`
		EducationAlt     *string  `json:"educationDetails"`
		FeaturedLinksAlt []string `json:"featuredLinks"`
	}

	if err := c.Bind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var profile models.Profile

	res := database.DB.Where("user_id = ?", userID).First(&profile)

	// CREATE PROFILE
	if res.RowsAffected == 0 {
		headline := ""
		bio := ""
		location := ""
		school := ""
		degree := ""
		company := ""
		website := ""
		currentRole := ""
		experience := ""
		educationDetails := ""
		imageURL := ""
		coverImageURL := ""
		if body.Headline != nil {
			headline = *body.Headline
		}
		if body.Bio != nil {
			bio = *body.Bio
		}
		if body.Location != nil {
			location = *body.Location
		}
		if body.ImageURL != nil {
			imageURL = *body.ImageURL
		} else if body.ImageURLAlt != nil {
			imageURL = *body.ImageURLAlt
		}
		if body.School != nil {
			school = *body.School
		}
		if body.Degree != nil {
			degree = *body.Degree
		}
		if body.Company != nil {
			company = *body.Company
		}
		if body.Website != nil {
			website = *body.Website
		}
		if body.CurrentRole != nil {
			currentRole = *body.CurrentRole
		} else if body.CurrentRoleAlt != nil {
			currentRole = *body.CurrentRoleAlt
		}
		if body.Experience != nil {
			experience = *body.Experience
		}
		if body.EducationDetails != nil {
			educationDetails = *body.EducationDetails
		} else if body.EducationAlt != nil {
			educationDetails = *body.EducationAlt
		}
		if body.CoverImageURL != nil {
			coverImageURL = *body.CoverImageURL
		} else if body.CoverURLAlt != nil {
			coverImageURL = *body.CoverURLAlt
		}
		featuredLinks := body.FeaturedLinks
		if featuredLinks == nil && body.FeaturedLinksAlt != nil {
			featuredLinks = body.FeaturedLinksAlt
		}
		profile = models.Profile{
			UserID:           userID,
			Headline:         headline,
			Bio:              bio,
			Location:         location,
			School:           school,
			Degree:           degree,
			Company:          company,
			Website:          website,
			CurrentRole:      currentRole,
			Experience:       experience,
			EducationDetails: educationDetails,
			FeaturedLinks:    pq.StringArray(featuredLinks),
			Skills:           pq.StringArray(body.Skills),
			ImageURL:         imageURL,
			CoverImageURL:    coverImageURL,
		}

		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create profile"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Profile created"})
		return
	}

	// UPDATE PROFILE
	if body.Headline != nil {
		profile.Headline = *body.Headline
	}
	if body.Bio != nil {
		profile.Bio = *body.Bio
	}
	if body.Location != nil {
		profile.Location = *body.Location
	}
	if body.School != nil {
		profile.School = *body.School
	}
	if body.Degree != nil {
		profile.Degree = *body.Degree
	}
	if body.Company != nil {
		profile.Company = *body.Company
	}
	if body.Website != nil {
		profile.Website = *body.Website
	}
	if body.CurrentRole != nil {
		profile.CurrentRole = *body.CurrentRole
	} else if body.CurrentRoleAlt != nil {
		profile.CurrentRole = *body.CurrentRoleAlt
	}
	if body.Experience != nil {
		profile.Experience = *body.Experience
	}
	if body.EducationDetails != nil {
		profile.EducationDetails = *body.EducationDetails
	} else if body.EducationAlt != nil {
		profile.EducationDetails = *body.EducationAlt
	}
	if body.FeaturedLinks != nil {
		profile.FeaturedLinks = pq.StringArray(body.FeaturedLinks)
	} else if body.FeaturedLinksAlt != nil {
		profile.FeaturedLinks = pq.StringArray(body.FeaturedLinksAlt)
	}
	if body.Skills != nil {
		profile.Skills = pq.StringArray(body.Skills)
	}
	if body.ImageURL != nil {
		profile.ImageURL = *body.ImageURL
	} else if body.ImageURLAlt != nil {
		profile.ImageURL = *body.ImageURLAlt
	}
	if body.CoverImageURL != nil {
		profile.CoverImageURL = *body.CoverImageURL
	} else if body.CoverURLAlt != nil {
		profile.CoverImageURL = *body.CoverURLAlt
	}

	if err := database.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}

func GetProfile(c *gin.Context) {
	userID := c.Param("id")

	// --- 1) Load user ---
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// --- 2) Load profile ---
	var profile models.Profile
	_ = database.DB.Where("user_id = ?", userID).First(&profile) // fine if not found

	// --- 3) Load user posts ---
	var posts []models.Post
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&posts)

	// --- 4) Load user jobs (if recruiter) ---
	var jobs []models.Job
	database.DB.Where("created_by = ?", userID).Order("created_at DESC").Find(&jobs)

	// --- 5) Load Skills (if stored as JSON/array) ---
	var skills []string
	if profile.Skills != nil {
		skills = profile.Skills
	}

	// --- 6) CONNECTION STATUS ---
	// Allow connection status even on public route by reading optional bearer token.
	senderID := c.GetString("user_id")
	if senderID == "" {
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			if uid, err := utils.VerifyToken(strings.TrimPrefix(header, "Bearer ")); err == nil {
				senderID = uid
			}
		}
	}
	connectionStatus := "none" // default
	connectionID := ""

	if senderID != "" && senderID != userID {
		if isInteractionBlocked(senderID, userID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		var conn models.Connection
		if err := database.DB.Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			senderID, userID, userID, senderID,
		).First(&conn).Error; err == nil {
			// Normalize pending direction so UI can show incoming accept/reject actions.
			if conn.Status == "pending" && conn.ReceiverID == senderID {
				connectionStatus = "incoming"
			} else {
				connectionStatus = conn.Status
			}
			connectionID = conn.ID
		}
	}

	// --- 7) Build final response ---
	var connectionsCount int64
	database.DB.Model(&models.Connection{}).
		Where("(sender_id = ? OR receiver_id = ?) AND status = 'accepted'", userID, userID).
		Count(&connectionsCount)

	var postsCount int64
	database.DB.Model(&models.Post{}).
		Where("user_id = ?", userID).
		Count(&postsCount)

	var likesCount int64
	database.DB.Model(&models.PostLike{}).
		Joins("JOIN posts ON posts.id = post_likes.post_id").
		Where("posts.user_id = ?", userID).
		Count(&likesCount)

	response := gin.H{
		"id":         user.ID,
		"name":       user.DisplayName,
		"joinedDate": user.CreatedAt,

		// PROFILE FIELDS
		"headline":          profile.Headline,
		"bio":               profile.Bio,
		"location":          profile.Location,
		"school":            profile.School,
		"degree":            profile.Degree,
		"company":           profile.Company,
		"website":           profile.Website,
		"currentRole":       profile.CurrentRole,
		"experience":        profile.Experience,
		"educationDetails":  profile.EducationDetails,
		"education_details": profile.EducationDetails,
		"featuredLinks":     profile.FeaturedLinks,
		"featured_links":    profile.FeaturedLinks,
		"imageUrl":          profile.ImageURL,
		"image_url":         profile.ImageURL,
		"coverImageUrl":     profile.CoverImageURL,
		"cover_image_url":   profile.CoverImageURL,
		"skills":            skills,

		// USER DATA
		"posts": posts,
		"jobs":  jobs,

		// CONNECTION STATUS
		"connection_status": connectionStatus,
		"connection_id":     connectionID,

		// STATS
		"connections_count": connectionsCount,
		"posts_count":       postsCount,
		"likes_count":       likesCount,
	}

	if senderID == userID {
		response["email"] = user.Email
	}

	c.JSON(http.StatusOK, response)
}

func GetMyProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	c.Params = append(c.Params, gin.Param{Key: "id", Value: userID})
	GetProfile(c)
}
