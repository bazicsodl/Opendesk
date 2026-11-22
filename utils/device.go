package utils

import (
	"strings"
)

type DeviceInfo struct {
	Browser string
	OS      string
	Device  string
}

// ParseUserAgent extracts browser, os, and device type
func ParseUserAgent(ua string) DeviceInfo {
	uaLower := strings.ToLower(ua)

	device := "Desktop"
	if strings.Contains(uaLower, "mobile") {
		device = "Mobile"
	} else if strings.Contains(uaLower, "tablet") {
		device = "Tablet"
	}

	// Browser detection
	browser := "Unknown"
	switch {
	case strings.Contains(uaLower, "chrome") && !strings.Contains(uaLower, "edge"):
		browser = "Chrome"
	case strings.Contains(uaLower, "safari") && !strings.Contains(uaLower, "chrome"):
		browser = "Safari"
	case strings.Contains(uaLower, "firefox"):
		browser = "Firefox"
	case strings.Contains(uaLower, "edg"):
		browser = "Edge"
	}

	// OS detection
	os := "Unknown"
	switch {
	case strings.Contains(uaLower, "windows"):
		os = "Windows"
	case strings.Contains(uaLower, "mac os"):
		os = "Mac OS"
	case strings.Contains(uaLower, "android"):
		os = "Android"
	case strings.Contains(uaLower, "iphone"):
		os = "iOS"
	case strings.Contains(uaLower, "linux"):
		os = "Linux"
	}

	return DeviceInfo{
		Browser: browser,
		OS:      os,
		Device:  device,
	}
}
