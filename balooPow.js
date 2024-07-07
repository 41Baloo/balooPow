class BalooPow {
    constructor(publicSalt, difficulty, challenge, numeric = true) {
        this.workers = [];
        this.challenge = challenge;
        this.difficulty = difficulty;
        this.publicSalt = publicSalt;
        this.navigatorData = this.cloneObject(navigator, 0);
        this.numeric = numeric;
        this.workerScript = `
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js');

        self.onmessage = function(e) {
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

            function incrementHexString(str) {
                const chars = '0123456789abcdef';
                let carry = 1;
                let res = '';
                for (let i = str.length - 1; i >= 0; i--) {
                    let index = chars.indexOf(str[i]) + carry;
                    if (index >= chars.length) {
                        index = 0;
                        carry = 1;
                    } else {
                        carry = 0;
                    }
                    res = chars[index] + res;
                }
                return carry ? '0' + res : res;
            }

            function getStringByIndex(index, length) {
                const chars = '0123456789abcdef';
                let res = '';
                for (let i = 0; i < length; i++) {
                    res = chars[index % chars.length] + res;
                    index = Math.floor(index / chars.length);
                }
                return res.padStart(length, '0');
            }

            const {
                publicSalt,
                challenge,
                start,
                end,
                numeric,
                difficulty,
                clientNavigator
            } = e.data;
            let resp = {
                match: compareObj(navigator, clientNavigator, 0),
                solution: "",
                access: ""
            };

            if (numeric) {
                for (let i = start; i <= end; i++) {
                    if (CryptoJS.SHA256(publicSalt + i).toString() === challenge) {
                        resp.solution = i;
                        resp.access = CryptoJS.SHA256(i.toString() + publicSalt).toString();
                        self.postMessage(resp);
                        self.close();
                        return;
                    }
                }
            } else {
                for (let i = start; i <= end; i++) {
                    let current = getStringByIndex(i, difficulty);
                    if (CryptoJS.SHA256(publicSalt + current).toString() === challenge) {
                        resp.solution = current;
                        resp.access = CryptoJS.SHA256(current + publicSalt).toString();
                        self.postMessage(resp);
                        self.close();
                        return;
                    }
                }
            }

            self.postMessage(resp);
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
        const worker = new Worker(url);

        this.workers.push(worker);

        worker.onmessage = (e) => {
            const res = e.data;
            if (res.match == "" && res.solution !== "") {
                console.log("💀 Solution found, terminating all workers");
                this.workers.forEach(w => {
                    w.terminate();
                });
                resolve(res);
            } else {
                console.log("❌ This worker didn't find a solution. Matched: ", res.match);
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
