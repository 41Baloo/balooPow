package balooPow

import (
	"encoding/hex"
	"math/rand"
	"strconv"
	"sync"
	"time"

	sha256 "github.com/minio/sha256-simd"
)

// Creates a new pow pool that will hold pows that all have the given salt length. A minimum length of 10 is recommended. Pows that have not been manually deleted will be deleted after secondsValid seconds.
func NewPowPool(saltLength int, secondsValid int64) *BalooPowPool {
	pool := BalooPowPool{
		pows:       map[string]*BalooPow{},
		saltLength: saltLength,

		lastUnix:    time.Now().Unix(),
		powDuration: secondsValid,

		mutex: &sync.RWMutex{},
	}

	go pool.deleteOutdatedPows()

	return &pool
}

func (pool *BalooPowPool) deleteOutdatedPows() {
	for {
		pool.lastUnix = time.Now().Unix()

		pool.mutex.Lock()
		for identifier, pow := range pool.pows {
			if pow.Created+pool.powDuration < pool.lastUnix {
				delete(pool.pows, identifier)
			}
		}
		pool.mutex.Unlock()

		time.Sleep(5 * time.Second)
	}
}

/*
Will generate a new pow for the given identifier, add it to the pool and return the generated pow
WARNING: This will overwrite previously generated pow's with the same identifier
*/
func (pool *BalooPowPool) NewPow(identifier string, difficulty int) *BalooPow {
	salt := randStr(pool.saltLength)
	solution := rand.Intn(difficulty)
	challenge := sha256.Sum256([]byte(salt + strconv.Itoa(solution)))

	pow := &BalooPow{
		Salt:       salt,
		Solution:   solution,
		Challenge:  hex.EncodeToString(challenge[:]),
		Difficulty: difficulty,

		Created: pool.lastUnix,
	}

	pool.mutex.Lock()
	pool.pows[identifier] = pow
	pool.mutex.Unlock()

	return pow
}

// Will delete a pow from the pool via its identifier
func (pool *BalooPowPool) DeletePow(identifier string) {
	pool.mutex.Lock()
	delete(pool.pows, identifier)
	pool.mutex.Unlock()
}

// Check if a given pow exists within the pool
func (pool *BalooPowPool) DoesPowExist(identifier string) bool {
	pool.mutex.RLock()
	_, found := pool.pows[identifier]
	pool.mutex.RUnlock()

	return found
}

// Check if the provided solution is valid for the given identifier (will also return false if the identifier doesn't exist)
func (pool *BalooPowPool) IsValidSolution(identifier string, solution int) bool {
	pool.mutex.RLock()
	pow, found := pool.pows[identifier]
	pool.mutex.RUnlock()

	if !found {
		return false
	}

	if pow.Created+pool.powDuration < pool.lastUnix { // Pow expired. Nothing else to do. Our routine will clean it up
		return false
	}

	return pow.IsValidSolution(solution)
}

// Check if the provided solution is valid for the pow
func (pow *BalooPow) IsValidSolution(solution int) bool {
	return pow.Solution == solution
}
