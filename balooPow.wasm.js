class BalooPow {
    constructor(publicSalt, difficulty, challenge, numeric = true) {
        this.workers = [];
        this.challenge = challenge;
        this.difficulty = difficulty;
        this.publicSalt = publicSalt;
        this.navigatorData = this.cloneObject(navigator, 0);
        this.numeric = numeric;
        this.workerScript = `

        import init, { find_solution } from 'https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/wasm/baloo_pow/pkg/baloo_pow.js'

        self.onmessage = async function(e) {

            function compareObj(obj1, obj2, iteration) {
                if (iteration > 4) {
                    return "";
                }
                for (let key in obj1) {
                    if (key == "rtt") {
                        return "";
                    }
                    if (typeof obj1[key] === "function") {
                        return "";
                    }
                    if (typeof obj1[key] === "object" && obj1[key] !== null) {
                        return compareObj(obj1[key], obj2[key], iteration + 1)
                    } else {
                        if (obj1[key] !== obj2[key]) {
                            return key+", ";
                        }
                    }
                }
                return "";
            }

            await init('https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/wasm/baloo_pow/pkg/baloo_pow_bg.wasm');

            const {
                publicSalt,
                challenge,
                start,
                end,
                numeric,
                difficulty,
                clientNavigator
            } = e.data;

            const result = find_solution(publicSalt, challenge, start, end, numeric, difficulty);
            result.match = compareObj(navigator, clientNavigator, 0),
            self.postMessage(result);
            self.close();
        };
        `;
    }

    cloneObject(obj, iteration) {
        var clone = {};
        if (iteration > 4) {
            return clone;
        }
        for (var i in obj) {
            if (typeof obj[i] == "object" && obj[i] != null && !(obj[i] instanceof Function))
                clone[i] = this.cloneObject(obj[i], iteration + 1);
            else if (typeof obj[i] !== 'function' && !(obj[i] instanceof HTMLElement))
                clone[i] = obj[i];
        }
        return clone;
    }

    spawnWorker(url, start, end, resolve, reject) {
        const worker = new Worker(url, {
            type: 'module'
        });

        this.workers.push(worker);

        worker.onmessage = (e) => {

            const res = e.data;
            if ((res.match == "" || navigator.brave != undefined) && res.solution !== "") {
                console.log("💀 Solution found, terminating all workers");
                this.workers.forEach(w => {
                    w.terminate();
                });
                resolve(res);
            } else {
                console.log("❌ This worker didn't find a solution. Match: ", res.match);
                reject("No solution found");
            }
        };

        worker.postMessage({
            challenge: this.challenge,
            publicSalt: this.publicSalt,
            start,
            end,
            numeric: this.numeric,
            difficulty: this.difficulty,
            clientNavigator: this.navigatorData
        });
    }

    async Solve() {
        let numWorkers = navigator.hardwareConcurrency || 2;
        numWorkers = Math.min(numWorkers, 16);
        console.log(`🤔 Starting solve with ${numWorkers} workers`)
        const divided = this.numeric ? Math.ceil(this.difficulty / numWorkers) : Math.ceil(Math.pow(16, this.difficulty) / numWorkers);
        const workers = [];

        const blob = new Blob([this.workerScript], {
            type: 'text/javascript'
        });
        const url = URL.createObjectURL(blob);
        for (let i = 0; i < (this.numeric ? this.difficulty : Math.pow(16, this.difficulty)); i += divided) {
            workers.push(new Promise((resolve, reject) => {
                this.spawnWorker(url, i, Math.min(i + divided - 1, this.numeric ? this.difficulty - 1 : Math.pow(16, this.difficulty) - 1), resolve, reject);
            }));
        }

        try {
            const startDate = new Date();
            const result = await Promise.any(workers);
            const endDate = new Date();
            console.log("🥳 Heureka", result);
            console.log("Solved In:", (endDate.getTime() - startDate.getTime()) / 1000);
            return result;
        } catch (e) {
            console.log("🕵️ Something's wrong", e);
            return null;
        }
    }
}
