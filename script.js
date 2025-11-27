document.addEventListener("DOMContentLoaded", function () {
    const continueButton = document.getElementById("continue-button");
    const headphonesScreen = document.getElementById("headphones-screen");
    const listeningScreen = document.getElementById("listening-screen");
    const continueListeningButton = document.getElementById("continue-listening-button");
    const reactionTestScreen = document.getElementById("reaction-test");
    const reactionButton = document.getElementById("reaction-button");
    const resultsScreen = document.getElementById("results");
    const resultsList = document.getElementById("results-list");

    let bpms = ["40 BPM", "60 BPM", "90 BPM", "120 BPM", "180 BPM"];
    let currentBPMIndex = 0;
    let trialsPerBPM = 5;
    let currentTrial = 0;
    let reactionTimes = [];
    let bpmReactionTimes = [];
    let isReactTime = false;
    let audio = null;
    let musicBPM = "";
    let spamClickDetected = false;

    const DEBUG = false;

    continueButton.addEventListener("click", () => {
        headphonesScreen.classList.add("hidden");
        listeningScreen.classList.remove("hidden");
        playMusicForCurrentBPM();
    });

    continueListeningButton.addEventListener("click", () => {
        listeningScreen.classList.add("hidden");
        reactionTestScreen.classList.remove("hidden");
        currentTrial = 0;
        bpmReactionTimes = [];
        startReactionTest();
    });

    function playMusicForCurrentBPM() {
        musicBPM = bpms[currentBPMIndex];
        document.getElementById('listening-genre').textContent = `Listen to music at ${musicBPM} for 1 minute.`;
        const filePath = `music/${musicBPM.split(' ')[0]}bpm/${musicBPM.split(' ')[0]}bpm.mp3`;
        console.log('Playing file:', filePath);
        audio = new Audio(filePath);

        if (audio) {
            audio.muted = false;
            audio.play().catch(error => console.error('Playback error:', error));
        }

        continueListeningButton.classList.add("hidden");
        setTimeout(() => continueListeningButton.classList.remove("hidden"), 60000);
    }

    function startReactionTest() {
        if (currentTrial < trialsPerBPM) {
            document.getElementById('reaction-instructions').textContent = `BPM: ${musicBPM}, Trial ${currentTrial + 1}/${trialsPerBPM}`;
            reactionButton.classList.add("wait");
            reactionButton.classList.remove("click");
            reactionButton.textContent = "Wait";
            isReactTime = false;
            spamClickDetected = false;

            setTimeout(() => {
                if (!spamClickDetected) showReactionButton();
                else setTimeout(showReactionButton, 2000);
            }, 1500);
        } else {
            sendBPMResults();
            if (currentBPMIndex < bpms.length - 1) {
                currentBPMIndex++;
                audio.pause();
                audio.currentTime = 0;
                reactionTestScreen.classList.add("hidden");
                listeningScreen.classList.remove("hidden");
                currentTrial = 0;
                bpmReactionTimes = [];
                playMusicForCurrentBPM();
            } else {
                displayResults();
            }
        }
    }

    function showReactionButton() {
        reactionButton.showTime = Date.now();
        reactionButton.classList.remove("wait");
        reactionButton.classList.add("click");
        reactionButton.textContent = "Click";
        isReactTime = true;
    }

    reactionButton.addEventListener("click", () => {
        if (isReactTime) {
            const reactionTime = Date.now() - reactionButton.showTime;
            bpmReactionTimes.push(reactionTime);
            reactionTimes.push({ bpm: musicBPM, time: reactionTime });
            currentTrial++;
            startReactionTest();
        } else {
            spamClickDetected = true;
        }
    });

    function sendBPMResults() {
        const averageTime = Math.round(bpmReactionTimes.reduce((a, b) => a + b, 0) / bpmReactionTimes.length);
        sendResultsToSheet(bpmReactionTimes, averageTime, musicBPM);
    }

    function displayResults() {
        resultsScreen.classList.remove("hidden");
        reactionTestScreen.classList.add("hidden");
        audio.pause();
        let timesByBPM = {};
        reactionTimes.forEach(entry => {
            if (!timesByBPM[entry.bpm]) timesByBPM[entry.bpm] = [];
            timesByBPM[entry.bpm].push(entry.time);
        });

        for (let bpm in timesByBPM) {
            resultsList.innerHTML += `<h3>${bpm}</h3>`;
            timesByBPM[bpm].forEach((time, index) => {
                resultsList.innerHTML += `<p>Trial ${index + 1}: ${time} ms</p>`;
            });
            const avg = Math.round(timesByBPM[bpm].reduce((a, b) => a + b, 0) / timesByBPM[bpm].length);
            resultsList.innerHTML += `<p>Average Reaction Time: ${avg} ms</p>`;
        }
    }

    function sendResultsToSheet(reactionTimes, averageTime, musicBPM) {
        if (DEBUG) {
            console.log({ reactionTimes, averageTime, musicBPM });
            return;
        }
        fetch('https://script.google.com/macros/s/AKfycbww7aBZTdkscdySmNXPp3fTiOI8Ky8k5A2gfzWS3j6yWwdxwz4SjJc3WZ1KS7MzJzJR/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reactionTimes, averageTime, musicBPM }),
            mode: 'no-cors'
        });
    }
});