package main

import (
	"crypto/sha256"
	"testing"

	"github.com/minio/blake2b-simd"
	sha256simd "github.com/minio/sha256-simd"
)

func BenchmarkStandardSHA256(b *testing.B) {
	data := []byte("Hello, World!")
	for n := 0; n < b.N; n++ {
		_ = sha256.Sum256(data)
	}
}

func BenchmarkSimdSHA256(b *testing.B) {
	data := []byte("Hello, World!")
	for n := 0; n < b.N; n++ {
		_ = sha256simd.Sum256(data)
	}
}

func BenchmarkBlake2b(b *testing.B) {
	data := []byte("Hello, World!")
	for n := 0; n < b.N; n++ {
		_ = blake2b.Sum256(data)
	}
}

func main() {
	// Lmfao blake slow as fuck (i probably did something wrong)
}
