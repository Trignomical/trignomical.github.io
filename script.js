document.addEventListener("DOMContentLoaded", function () {
    const continueButton = document.getElementById("continue-button");
    const headphonesScreen = document.getElementById("headphones-screen");
    const listeningScreen = document.getElementById("listening-screen");
    const continueListeningButton = document.getElementById("continue-listening-button");
    const reactionTestScreen = document.getElementById("reaction-test");
    const reactionButton = document.getElementById("reaction-button");
    const resultsScreen = document.getElementById("results");
    const resultsList = document.getElementById("results-list");
    const averageTimeDisplay = document.getElementById("average-time");
    const musicGenreDisplay = document.getElementById("music-genre");

    let reactionTimes = [];
    let musicGenre = "";
    let trialsCompleted = 0;
    let isReactTime = false;
    let audio = null;

    continueButton.addEventListener("click", () => {
        headphonesScreen.classList.add("hidden");
        listeningScreen.classList.remove("hidden");
        playRandomMusic();
        setTimeout(() => {
            continueListeningButton.classList.remove("hidden");
        }, 60000);
    });

    continueListeningButton.addEventListener("click", () => {
        listeningScreen.classList.add("hidden");
        reactionTestScreen.classList.remove("hidden");
        startReactionTest();
    });

    function playRandomMusic() {
        const genres = ["Happy", "Sad", "Scary"];
        musicGenre = genres[Math.floor(Math.random() * genres.length)];

        audio = new Audio(`music/${musicGenre}/${Math.floor(Math.random() * 3) + 1}.mp3`);
        audio.play();
    }

    function startReactionTest() {
        reactionButton.classList.add("wait");
        reactionButton.classList.remove("click");
        reactionButton.textContent = "Wait";
        isReactTime = false;

        setTimeout(() => {
            reactionButton.showTime = Date.now();
            reactionButton.classList.remove("wait");
            reactionButton.classList.add("click");
            reactionButton.textContent = "Click";
            isReactTime = true;
        }, getRandomDelay());
    }

    reactionButton.addEventListener("click", () => {
        if (isReactTime) {
            const reactionTime = Date.now() - reactionButton.showTime;
            reactionTimes.push(reactionTime);

            trialsCompleted++;
            if (trialsCompleted < 5) {
                startReactionTest();
            } else {
                displayResults();
            }
        } else {
            alert("Too soon! Wait for the button to turn green.");
        }
    });

    function getRandomDelay() {
        return Math.floor(Math.random() * 2000) + 1000;
    }

    function displayResults() {
        reactionTestScreen.classList.add("hidden");
        resultsScreen.classList.remove("hidden");

        reactionTimes.forEach((time, index) => {
            resultsList.innerHTML += `<p>Trial ${index + 1}: ${time} ms</p>`;
        });

        const averageTime = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
        averageTimeDisplay.textContent = `Average Reaction Time: ${averageTime} ms`;
        musicGenreDisplay.textContent = `Music Genre Played: ${musicGenre}`;

        sendResultsToSheet(reactionTimes, averageTime, musicGenre);
    }

    function sendResultsToSheet(reactionTimes, averageTime, musicGenre) {
        fetch('https://script.google.com/macros/s/AKfycbz5xMU8YfGvAN_-Rf0cngHIlpw9503rMMwxD8goCNncfoS-rCCFrnjxRLibwjnf9LOQ/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reactionTimes, averageTime, musicGenre })
        })
        .then(response => response.text())
        .then(message => console.log(message))
        .catch(error => console.error('Error:', error));
    }
});
