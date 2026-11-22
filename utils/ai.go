// utils/ai.go (stub)
package utils

// You will implement using OpenAI embeddings or any embedding provider.
// Example flow:
// 1) Create text for job: job.Title + job.Description + job.Skills
// 2) Create text for user: user.ProfileText + userSkills
// 3) Get embeddings for both and compute cosine similarity
// 4) Return similarity float64

func ComputeEmbeddingScore(jobText, userText string) (float64, error) {
    // TODO: call embedding provider -> return cosine similarity
    return 0.0, nil
}
