(function() {
    function injectStyles() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .balooPow-challenge {
                display: flex;
                align-items: center;
                font-family: Arial, sans-serif;
                font-size: 12px;
                padding: 10px;
                background: #f9f9f9;
                border: 1px solid #ccc;
                border-radius: 5px;
                max-width: 200px;
                margin: 10px;
                position: relative;
                overflow: hidden;
                cursor: pointer;
            }
            .balooPow-button {
                appearance: none;
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                margin-right: 5px;
                border: 1px solid #ccc;
                border-radius: 50%;
                cursor: pointer;
                position: relative;
                background-color: white;
                flex-shrink: 0;
            }
            .balooPow-button.loading {
                border: 2px solid #4caf50;
                border-top: 2px solid #fff;
                animation: balooPowSpin 1s linear infinite;
            }
            @keyframes balooPowSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .balooPow-button.complete {
                height: 16px;
                border: none;
                background-color: #4caf50;
                animation: balooPowExpand 0.2s ease-out forwards, balooPowHoldShape 0.8s ease-out 0.2s forwards;
            }
            .balooPow-button.fail {
                height: 16px;
                border: none;
                background-color: red;
                animation: balooPowCross 0.2s ease-out forwards;
                position: relative;
            }
            .balooPow-button.fail::before,
            .balooPow-button.fail::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 10px;
                height: 2px;
                background-color: white;
                transform: translate(-50%, -50%) rotate(45deg);
            }
            .balooPow-button.fail::after {
                transform: translate(-50%, -50%) rotate(-45deg);
            }
            @keyframes balooPowExpand {
                0% {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                }
                1% {
                    width: 1%;
                    height: 16px;
                    border-radius: 8px;
                }
                100% {
                    width: 100%;
                    height: 16px;
                    border-radius: 8px;
                }
            }
            @keyframes balooPowHoldShape {
                0% {
                    width: 100%;
                    height: 16px;
                    border-radius: 8px;
                }
                100% {
                    width: 100%;
                    height: 16px;
                    border-radius: 8px;
                }
            }
            @keyframes balooPowCross {
                0% {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                }
                100% {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                }
            }
            .balooPow-container {
                display: flex;
                justify-content: space-between;
                width: 100%;
                position: relative;
            }
            .balooPow-right-container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-end;
                position: absolute;
                right: 0;
                height: 100%;
            }
            .balooPow-text {
                display: flex;
                align-items: center;
                cursor: default;
            }
            .fade-out {
                height: 16px;
                animation: balooPowFadeOut 0.5s forwards;
            }
            @keyframes balooPowFadeOut {
                to {
                    opacity: 0;
                }
            }
            .powered-by {
                font-size: 8px;
                text-align: right;
            }
        `;
        document.head.appendChild(style);
    }

    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = () => console.error(`Failed to load script: ${src}`);
        document.head.appendChild(script);
    }

    async function initializeChallenge(challenge) {
        let button = challenge.querySelector('button.balooPow-button');

        const poweredByDomain = challenge.getAttribute('data-powered-domain')
        const poweredByname = challenge.getAttribute('data-powered-name')

        if (!button) {
            button = document.createElement('button');
            button.className = 'balooPow-button';
            challenge.prepend(button);

            const container = document.createElement('div');
            container.className = 'balooPow-container';
            challenge.append(container);

            const verifyText = document.createElement('div');
            verifyText.className = 'balooPow-text';
            verifyText.innerText = 'Verify';
            container.prepend(verifyText);

            const rightContainer = document.createElement('div');
            rightContainer.className = 'balooPow-right-container';
            container.append(rightContainer);

            const balooText = document.createElement('div');
            balooText.className = 'balooPow-text';
            balooText.innerText = 'BalooPow';
            balooText.onclick = (event) => {
                event.stopPropagation();
                window.open('https://github.com/41Baloo/BalooPow', '_blank');
            };
            rightContainer.append(balooText);

            const poweredByText = document.createElement('div');
            poweredByText.className = 'powered-by';
            poweredByText.innerText = 'Powered by ' + (poweredByname == null ? 'bxv.gg' : poweredByname);
            rightContainer.append(poweredByText);
        }

        const customWidth = challenge.getAttribute('data-style-width');
        const customHeight = challenge.getAttribute('data-style-height');
        if (customWidth) {
            challenge.style.width = customWidth;
        }
        if (customHeight) {
            challenge.style.height = customHeight;
        }

        const shouldDisappear = challenge.getAttribute('data-delete-self') !== null

        const handleClick = (event) => {
            if (!event.target.classList.contains('balooPow-link')) {
                button.click();
            }
        };

        challenge.addEventListener('click', handleClick);
        
        const fail = (error) => {
            button.classList.remove('loading');
            document.querySelectorAll('.balooPow-text').forEach(el => {
                el.classList.add('fade-out');
            });
            document.querySelectorAll('.powered-by').forEach(el => {
                el.classList.add('fade-out');
            });
            setTimeout(() => {
                button.classList.add('fail');
                const verifyText = challenge.querySelector('.balooPow-text');
                if (verifyText) {
                    verifyText.style.opacity = 1;
                    verifyText.style.width = "100%";
                    verifyText.classList.remove('fade-out');
                    verifyText.innerText = error;
                }
                const onComplete = challenge.getAttribute('data-on-complete');
                if (onComplete && typeof window[onComplete] === 'function') {
                    window[onComplete](false);
                }
            }, 500);
        };

        const complete = () => {
            button.classList.remove('loading');
            document.querySelectorAll('.balooPow-text').forEach(el => {
                el.classList.add('fade-out');
            });
            document.querySelectorAll('.powered-by').forEach(el => {
                el.classList.add('fade-out');
            });
            setTimeout(() => {
                button.classList.add('complete');
                console.log(shouldDisappear)
                if (!shouldDisappear) { 
                    const onComplete = challenge.getAttribute('data-on-complete');
                    if (onComplete && typeof window[onComplete] === 'function') {
                        window[onComplete](true);
                    }
                    return
                }
                setTimeout(() => {
                    challenge.style.opacity = '0';
                    setTimeout(() => {
                        challenge.style.display = 'none';
                        const onComplete = challenge.getAttribute('data-on-complete');
                        if (onComplete && typeof window[onComplete] === 'function') {
                            window[onComplete](true);
                        }
                    }, 500);
                }, 1000);
            }, 500);
        };

        const start = async () => {
            button.classList.add('loading');
            const verifyText = challenge.querySelector('.balooPow-text');
            if (verifyText) {
                verifyText.innerText = 'Verifying ...';
            }

            const publicKey = challenge.getAttribute('data-public-key');
            const powResp = await fetch(`https://${(poweredByDomain == null ? 'pow-api.bxv.gg' : poweredByDomain)}/api/pow/${publicKey}`);
            if (powResp.status !== 200) {
                fail(`API Response: ${powResp.status}`);
                return;
            }
            const jsonResp = await powResp.json();
            const pow = new BalooPow(jsonResp.publicSalt, jsonResp.difficulty, jsonResp.challenge);
            const solution = await pow.Solve();
        
            if (solution == null) {
                fail("Solution Not Found");
                return;
            }


            document.cookie=`bPow_${jsonResp.identifier}=${JSON.stringify({
                solution: solution,
                checksum: jsonResp.checksum
            })}; SameSite=Lax; path=/; Secure`
        
            complete();
        };

        button.onclick = () => {
            start();
        };

        if(challenge.getAttribute('data-auto-solve') !== null){
            start();
        }
    }

    async function initBalooPowChallenge() {
        injectStyles();

        const challenges = document.querySelectorAll('.balooPow-challenge');

        challenges.forEach((challenge) => {
            initializeChallenge(challenge);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadScript('https://cdn.jsdelivr.net/gh/41Baloo/balooPow@main/balooPow.wasm.min.js', initBalooPowChallenge);
    });
})();
