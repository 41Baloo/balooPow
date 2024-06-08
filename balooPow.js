class BalooPow {
	constructor(publicSalt, difficulty, challenge) {

		this.workers = [];
		this.challenge = challenge;
		this.difficulty = difficulty;
		this.publicSalt = publicSalt;
		this.navigatorData = this.cloneObject(navigator, 0);
		this.workerScript = `
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js');

      self.onmessage = function(e) {
        function compareObj(obj1, obj2, iteration) {
          if (iteration > 4) {
            return true;
          }
          for (let key in obj1) {
		  	if (key == "rtt") {
			  return true;
			}
            if (typeof obj1[key] === "function") {
              return true;
            }
            if (typeof obj1[key] === "object" && obj1[key] !== null) {
              if (!compareObj(obj1[key], obj2[key], iteration + 1)) {
                return false;
              }
            } else {
              if (obj1[key] !== obj2[key]) {
                return false;
              }
            }
          }
          return true;
        }

        const { publicSalt, challenge, start, end, navigator: clientNavigator } = e.data;
        let resp = {
          match: compareObj(navigator, clientNavigator, 0),
          solution: "",
          access: ""
        };

        for (let i = start; i <= end; i++) {
          if (CryptoJS.SHA256(publicSalt + i).toString() === challenge) {
            resp.solution = i;
            resp.access = CryptoJS.SHA256(i.toString() + publicSalt).toString();
            self.postMessage(resp);
            self.close();
            return;
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
			return clone
		}
		for (var i in obj) {
			if (typeof obj[i] == "object" && obj[i] != null && !(obj[i] instanceof Function))
				clone[i] = this.cloneObject(obj[i], iteration + 1);
			else if (typeof obj[i] !== 'function' && !(obj[i] instanceof HTMLElement))
				clone[i] = obj[i];
		}
		return clone;
	}

	spawnWorker(start, end, resolve, reject) {
		const blob = new Blob([this.workerScript], {
			type: 'text/javascript'
		});
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);

		this.workers.push(worker)

		worker.onmessage = (e) => {
			const res = e.data;
			if (res.match && res.solution != "") {
				console.log("💀 Solution found, terminating all workers")
				this.workers.forEach(w => {
					w.terminate();
				});
				resolve(res);
			} else {
				console.log("❌ This worker didn't find a solution")
				reject("No solution found");
			}
		};

		worker.postMessage({
			challenge: this.challenge,
			navigator: this.navigatorData,
			publicSalt: this.publicSalt,
			start,
			end
		});
	}

	async Solve() {
		let numWorkers = navigator.hardwareConcurrency || 2;
		numWorkers = Math.min(numWorkers, 8);
		const divided = Math.ceil(this.difficulty / numWorkers);
		const workers = [];

		for (let i = 0; i < this.difficulty; i += divided) {
			workers.push(new Promise((resolve, reject) => {
				this.spawnWorker(i, Math.min(i + divided - 1, this.difficulty - 1), resolve, reject);
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