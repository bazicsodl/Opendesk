package controllers

import (
	"net/http"
	"sort"
	"strings"

	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type suggestedUser struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Headline    string   `json:"headline"`
	ImageURL    string   `json:"image_url"`
	Location    string   `json:"location"`
	School      string   `json:"school"`
	Company     string   `json:"company"`
	MutualCount int      `json:"mutual_count"`
	MatchScore  float64  `json:"match_score"`
	Reasons     []string `json:"reasons"`
}

func toSet(values []string) map[string]struct{} {
	out := make(map[string]struct{}, len(values))
	for _, v := range values {
		v = strings.TrimSpace(strings.ToLower(v))
		if v != "" {
			out[v] = struct{}{}
		}
	}
	return out
}

func GetSuggestedUsers(c *gin.Context) {
	userID := c.GetString("user_id")
	limit := 10
	if l := strings.TrimSpace(c.Query("limit")); l == "20" || l == "30" || l == "50" {
		if l == "20" {
			limit = 20
		} else if l == "30" {
			limit = 30
		} else {
			limit = 50
		}
	}

	var meProfile models.Profile
	database.DB.Where("user_id = ?", userID).Limit(1).Find(&meProfile)

	var prefs models.UserPreference
	database.DB.Where("user_id = ?", userID).Limit(1).Find(&prefs)

	mySkills := toSet(meProfile.Skills)
	myTitles := toSet(prefs.JobTitles)
	myLoc := strings.ToLower(strings.TrimSpace(meProfile.Location))

	connectedSet := map[string]struct{}{}
	var myConnections []models.Connection
	database.DB.Where("(sender_id = ? OR receiver_id = ?) AND status = 'accepted'", userID, userID).Find(&myConnections)
	for _, conn := range myConnections {
		other := conn.SenderID
		if other == userID {
			other = conn.ReceiverID
		}
		connectedSet[other] = struct{}{}
	}

	type candidateRow struct {
		ID          string
		DisplayName string
		Headline    string
		ImageURL    string
		Location    string
		School      string
		Company     string
		Skills      pq.StringArray
	}
	var candidates []candidateRow
	database.DB.Table("users").
		Select("users.id, users.display_name, profiles.headline, profiles.image_url, profiles.location, profiles.school, profiles.company, profiles.skills").
		Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
		Where("users.id <> ? AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocks.user_id = ? AND blocks.blocked_id = users.id) OR (blocks.user_id = users.id AND blocks.blocked_id = ?))", userID, userID, userID).
		Limit(150).
		Scan(&candidates)

	output := make([]suggestedUser, 0, len(candidates))

	for _, cand := range candidates {
		if _, connected := connectedSet[cand.ID]; connected {
			continue
		}

		score := 0.0
		reasons := []string{}
		sharedSkills := 0

		for _, s := range cand.Skills {
			if _, ok := mySkills[strings.ToLower(strings.TrimSpace(s))]; ok {
				sharedSkills++
			}
		}
		if sharedSkills > 0 {
			score += float64(sharedSkills) * 4
			reasons = append(reasons, "Shared skills")
		}

		if myLoc != "" && strings.Contains(strings.ToLower(cand.Location), myLoc) {
			score += 2
			reasons = append(reasons, "Similar location")
		}

		if len(myTitles) > 0 {
			h := strings.ToLower(cand.Headline + " " + cand.Company)
			for t := range myTitles {
				if t != "" && strings.Contains(h, t) {
					score += 3
					reasons = append(reasons, "Matches your role interests")
					break
				}
			}
		}

		// interaction signal: messages between you and candidate
		var convoCount int64
		database.DB.Model(&models.Conversation{}).
			Where("(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)", userID, cand.ID, cand.ID, userID).
			Count(&convoCount)
		if convoCount > 0 {
			score += 1.5
			reasons = append(reasons, "Recent interaction")
		}

		// engagement signal: likes between both users' posts
		var engagement int64
		database.DB.Raw(`
			SELECT COUNT(*)
			FROM post_likes pl
			JOIN posts p ON p.id = pl.post_id
			WHERE (pl.user_id = ? AND p.user_id = ?) OR (pl.user_id = ? AND p.user_id = ?)`,
			userID, cand.ID, cand.ID, userID,
		).Scan(&engagement)
		if engagement > 0 {
			score += float64(engagement) * 0.7
			reasons = append(reasons, "Content engagement overlap")
		}

		// mutual connections
		var candConnections []models.Connection
		database.DB.Where("(sender_id = ? OR receiver_id = ?) AND status = 'accepted'", cand.ID, cand.ID).Find(&candConnections)
		mutual := 0
		for _, cc := range candConnections {
			other := cc.SenderID
			if other == cand.ID {
				other = cc.ReceiverID
			}
			if _, ok := connectedSet[other]; ok {
				mutual++
			}
		}
		if mutual > 0 {
			score += float64(mutual) * 2
			reasons = append(reasons, "Mutual connections")
		}

		if score <= 0 {
			continue
		}
		if len(reasons) == 0 {
			reasons = append(reasons, "Profile similarity")
		}

		output = append(output, suggestedUser{
			ID:          cand.ID,
			Name:        cand.DisplayName,
			Headline:    cand.Headline,
			ImageURL:    cand.ImageURL,
			Location:    cand.Location,
			School:      cand.School,
			Company:     cand.Company,
			MutualCount: mutual,
			MatchScore:  score,
			Reasons:     reasons,
		})
	}

	sort.Slice(output, func(i, j int) bool {
		return output[i].MatchScore > output[j].MatchScore
	})
	if len(output) > limit {
		output = output[:limit]
	}

	c.JSON(http.StatusOK, output)
}
