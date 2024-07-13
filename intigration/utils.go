package balooPow

import "math/rand"

const (
	chars       = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	charsLength = len(chars)
)

func randStr(length int) string {
	result := make([]byte, length)
	for i := range result {
		result[i] = chars[rand.Intn(charsLength)]
	}
	return string(result)
}
