package balooPow

import "sync"

type BalooPow struct {
	Salt       string
	Solution   int
	Challenge  string
	Difficulty int

	Created int64
}

type BalooPowPool struct {
	saltLength int
	pows       map[string]*BalooPow

	lastUnix    int64
	powDuration int64
	mutex       *sync.RWMutex
}
