package balooPow

import (
	"math/rand"
	"strconv"

	sha256 "github.com/minio/sha256-simd"
)

// Creates a new pow pool that will hold pows that all have the given salt length. A minimum length of 10 is recommended
func NewPowPool(saltLength int) *BalooPowPool {
	pool := BalooPowPool{
		pows:       map[string]BalooPow{},
		saltLength: saltLength,
	}

	return &pool
}

/*
Will generate a new pow for the given identifier, add it to the pool and return the generated pow
WARNING: This will overwrite previously generated pow's with the same identifier
*/
func (pool *BalooPowPool) NewPow(identifier string, difficulty int) BalooPow {
	salt := randStr(pool.saltLength)
	solution := rand.Intn(difficulty)
	challenge := sha256.Sum256([]byte(salt + strconv.Itoa(solution)))

	pow := BalooPow{
		Salt:       salt,
		Solution:   solution,
		Challenge:  string(challenge[:]),
		Difficulty: difficulty,
	}

	pool.pows[identifier] = pow
	return pow
}

// Will delete a pow from the pool via its identifier
func (pool *BalooPowPool) DeletePow(identifier string) {
	delete(pool.pows, identifier)
}

// Check if a given pow exists within the pool
func (pool *BalooPowPool) DoesPowExist(identifier string) bool {
	_, found := pool.pows[identifier]
	return found
}

// Check if the provided solution is valid for the given identifier (will also return false if the identifier doesn't exist)
func (pool *BalooPowPool) IsValidSolution(identifier string, solution int) bool {
	pow, found := pool.pows[identifier]
	if !found {
		return false
	}
	return pow.IsValidSolution(solution)
}

// Check if the provided solution is valid for the pow
func (pow *BalooPow) IsValidSolution(solution int) bool {
	return pow.Solution == solution
}
