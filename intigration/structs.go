package balooPow

type BalooPow struct {
	Salt       string
	Solution   int
	Challenge  string
	Difficulty int
}

type BalooPowPool struct {
	saltLength int
	pows       map[string]BalooPow
}
