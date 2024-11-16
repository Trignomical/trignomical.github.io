document.addEventListener("DOMContentLoaded", function () {
    const continueButton = document.getElementById("continue-button");
    const headphonesScreen = document.getElementById("headphones-screen");
    const listeningScreen = document.getElementById("listening-screen");
    const continueListeningButton = document.getElementById("continue-listening-button");
    const reactionTestScreen = document.getElementById("reaction-test");
    const reactionButton = document.getElementById("reaction-button");
    const resultsScreen = document.getElementById("results");
    const resultsList = document.getElementById("results-list");

    let genres = ["Happy", "Sad", "Scary"];
    let currentGenreIndex = 0;
    let trialsPerGenre = 5;
    let currentTrial = 0;
    let reactionTimes = [];
    let genreReactionTimes = [];
    let isReactTime = false;
    let audio = null;
    let musicGenre = "";
    let spamClickDetected = false;

    continueButton.addEventListener("click", () => {
        headphonesScreen.classList.add("hidden");
        listeningScreen.classList.remove("hidden");
        playMusicForCurrentGenre();
    });

    continueListeningButton.addEventListener("click", () => {
        listeningScreen.classList.add("hidden");
        reactionTestScreen.classList.remove("hidden");
        currentTrial = 0;
        genreReactionTimes = [];
        startReactionTest();
    });

    function playMusicForCurrentGenre() {
        musicGenre = genres[currentGenreIndex];
        document.getElementById('listening-genre').textContent = `Listen to ${musicGenre} music for 1 minute.`;
        const filePath = `music/${musicGenre}/${Math.floor(Math.random() * 3) + 1}.mp3`;
        console.log('Playing file:', filePath);
        audio = new Audio(filePath);
    
        if (audio) {
            audio.muted = false;
            audio.play().catch(error => console.error('Playback error:', error));
        } else {
            console.error('Audio object could not be created for file:', filePath);
        }
    
        continueListeningButton.classList.add("hidden");
    
        setTimeout(() => {
            continueListeningButton.classList.remove("hidden");
        }, 60000);
    }

    function startReactionTest() {
        if (currentTrial < trialsPerGenre) {
            document.getElementById('reaction-instructions').textContent = `Genre: ${musicGenre}, Trial ${currentTrial + 1}/${trialsPerGenre}`;
            reactionButton.classList.add("wait");
            reactionButton.classList.remove("click");
            reactionButton.textContent = "Wait";
            isReactTime = false;
            spamClickDetected = false;

            setTimeout(() => {
                if (!spamClickDetected) {
                    showReactionButton();
                } else {
                    const extraDelay = Math.floor(Math.random() * 3000) + 1000;
                    setTimeout(showReactionButton, extraDelay);
                }
            }, getRandomDelay());
        } else {
            sendGenreResults();
            if (currentGenreIndex < genres.length - 1) {
                currentGenreIndex++;
                audio.pause();
                audio.currentTime = 0;
                reactionTestScreen.classList.add("hidden");
                listeningScreen.classList.remove("hidden");
                currentTrial = 0;
                genreReactionTimes = [];
                playMusicForCurrentGenre();
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
            genreReactionTimes.push(reactionTime);
            reactionTimes.push({ genre: musicGenre, time: reactionTime });
            currentTrial++;
            startReactionTest();
        } else {
            spamClickDetected = true;
        }
    });

    function getRandomDelay() {
        return Math.floor(Math.random() * 2000) + 1000;
    }

    function sendGenreResults() {
        const averageTime = Math.round(genreReactionTimes.reduce((a, b) => a + b, 0) / genreReactionTimes.length);
        sendResultsToSheet(genreReactionTimes, averageTime, musicGenre);
    }

    function displayResults() {
        resultsScreen.classList.remove("hidden");
        reactionTestScreen.classList.add("hidden");
        audio.pause();
        let timesByGenre = {};
        reactionTimes.forEach((entry) => {
            if (!timesByGenre[entry.genre]) {
                timesByGenre[entry.genre] = [];
            }
            timesByGenre[entry.genre].push(entry.time);
        });

        for (let genre in timesByGenre) {
            resultsList.innerHTML += `<h3>${genre} Genre</h3>`;
            timesByGenre[genre].forEach((time, index) => {
                resultsList.innerHTML += `<p>Trial ${index + 1}: ${time} ms</p>`;
            });
            const averageTime = Math.round(timesByGenre[genre].reduce((a, b) => a + b, 0) / timesByGenre[genre].length);
            resultsList.innerHTML += `<p>Average Reaction Time: ${averageTime} ms</p>`;
        }
    }

    function sendResultsToSheet(reactionTimes, averageTime, musicGenre) {
        fetch('https://script.google.com/macros/s/AKfycbznVjOk4LqJxUVZKcDUL8I6dl0IC2OJR93KZHE77ZQQvtGIdhkOtCjBrJcFfZVt0oXp/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reactionTimes, averageTime, musicGenre }),
            mode: 'no-cors'
        })
        .then(response => response.text())
        .then(message => console.log(message))
        .catch(error => console.error('Error:', error));
    }
});
