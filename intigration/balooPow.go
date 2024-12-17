package balooPow

import (
	"encoding/hex"
	"math/rand"
	"strconv"
	"time"

	"github.com/cespare/xxhash/v2"
	sha256 "github.com/minio/sha256-simd"
)

// Creates a new pow pool that will hold pows that all have the given salt length. A minimum length of 10 is recommended. Pows that have not been manually deleted will be deleted after secondsValid seconds.
func NewPowPool(saltLength int, secondsValid int64, numShards int) *BalooPowPool {
	pool := BalooPowPool{
		saltLength: saltLength,

		lastUnix:    uint32(time.Now().Unix()),
		powDuration: uint32(secondsValid), // try to be at least a little backwards compatible

		numShards: uint32(numShards),
		shards:    make([]*shard, numShards),
	}

	for i := 0; i < numShards; i++ {
		pool.shards[i] = &shard{
			data: make(map[string]*BalooPow),
		}
	}

	go pool.deleteOutdatedPows()

	return &pool
}

// Hash function to determine the shard
func (pool *BalooPowPool) getShardIndex(key string) uint32 {
	return uint32(xxhash.Sum64String(key)) % pool.numShards
}

func (pool *BalooPowPool) getShard(key string) *shard {
	return pool.shards[pool.getShardIndex(key)]
}

// Deletes outdated Pows from all shards
func (pool *BalooPowPool) deleteOutdatedPows() {
	for {
		pool.lastUnix = uint32(time.Now().Unix())
		for _, shard := range pool.shards {
			shard.mutex.Lock()
			for key, pow := range shard.data {
				if uint32(pow.Created+pool.powDuration) < pool.lastUnix {
					delete(shard.data, key)
				}
			}
			shard.mutex.Unlock()
		}
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
		Created:    pool.lastUnix,
	}

	shard := pool.getShard(identifier)
	shard.mutex.Lock()
	shard.data[identifier] = pow
	shard.mutex.Unlock()

	return pow
}

// Will delete a pow from the pool via its identifier
func (pool *BalooPowPool) DeletePow(identifier string) {
	shard := pool.getShard(identifier)

	shard.mutex.Lock()
	delete(shard.data, identifier)
	shard.mutex.Unlock()
}

// Check if a given pow exists within the pool
func (pool *BalooPowPool) DoesPowExist(identifier string) bool {
	shard := pool.getShard(identifier)

	shard.mutex.RLock()
	_, found := shard.data[identifier]
	shard.mutex.RUnlock()
	return found
}

func (pool *BalooPowPool) GetPow(identifier string) (*BalooPow, bool) {
	shard := pool.getShard(identifier)

	shard.mutex.RLock()
	pow, found := shard.data[identifier]
	shard.mutex.RUnlock()

	return pow, found
}

// Check if the provided solution is valid for the given identifier (will also return false if the identifier doesn't exist)
func (pool *BalooPowPool) IsValidSolution(identifier string, solution int) bool {
	shard := pool.getShard(identifier)

	shard.mutex.RLock()
	pow, found := shard.data[identifier]
	shard.mutex.RUnlock()

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
