package balooPow

import "sync"

type shard struct {
	data  map[string]*BalooPow
	mutex sync.RWMutex
}

type BalooPow struct {
	Salt       string
	Solution   int
	Challenge  string
	Difficulty int
	Created    uint32
}

type BalooPowPool struct {
	saltLength int

	shards    []*shard
	numShards uint32

	lastUnix    uint32
	powDuration uint32
}
