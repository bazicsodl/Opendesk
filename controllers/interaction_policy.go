package controllers

import (
	"opendesk/database"
	"opendesk/models"
)

// isInteractionBlocked is the shared policy for direct person-to-person
// actions. It is deliberately fail-closed if the relationship cannot be read.
func isInteractionBlocked(firstUserID, secondUserID string) bool {
	if firstUserID == "" || secondUserID == "" || firstUserID == secondUserID {
		return false
	}

	var count int64
	err := database.DB.Model(&models.Block{}).Where(
		"(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
		firstUserID, secondUserID, secondUserID, firstUserID,
	).Count(&count).Error
	return err != nil || count > 0
}

func userExists(userID string) bool {
	var count int64
	return database.DB.Model(&models.User{}).Where("id = ?", userID).Count(&count).Error == nil && count == 1
}
