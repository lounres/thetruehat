Array.prototype.last = function() {
    console.assert(this.length >= 1, 
        "Try to get last element of empty array");
    return this[this.length - 1];
}

const DELAY_TIME = 3000;
const EXPLANATION_TIME = 20000;
const AFTERMATH_TIME = 3000;

function animate({timing, draw, duration}) {
    // Largely taken from https://learn.javascript.ru
    timing = timing || (time => time);
    console.log(timing);
    return new Promise(function(resolve) {
        let start = performance.now();
        requestAnimationFrame(function animate(time) {
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            let progress = timing(timeFraction);

            draw(progress);

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                return resolve();
            }
        });
    })
}

function timeFromSeconds(sec) {
    let min = Math.floor(sec / 60);
    sec -= 60 * min;
    if (sec < 10) sec = "0" + String(sec);
    if (min < 10) min = "0" + String(min);
    return `${min}:${sec}`
}

function el(id) {   
    return document.getElementById(id);
}

function readLocationHash() {
    if (location.hash == "") return "";
    return decodeURIComponent(location.hash.slice(1));
}

function deleteNode(node) {
    node.parentNode.removeChild(node);
}

function hide(id) {
    el(id).style.display = "none";
}

function show(id) {
    el(id).style.display = "";
}

function disable(id) {
    el(id).setAttribute("disabled", "");
}

function wordPlayers(playersCounter) {
    let word;
    if ([11, 12, 13, 14].indexOf(playersCounter % 100) != -1) {
        word = "игроков";
    } else if (playersCounter % 10 == 1) {
        word = "игрок";
    } else if ([2, 3, 4].indexOf(playersCounter % 10) != -1) {
        word = "игрока";
    } else {
        word = "игроков";
    }
    return word;
}

function template(templateName, arg) {
    switch (templateName) {
    case "preparationPage_user":
        let div = document.createElement("div");
        div.innerText = arg.username;
        div.classList.add("user-item");
        div.setAttribute("id", `user_${arg.username}`);
        return div;
        break;
    }
}

class App {
    constructor() {
        this.debug = true;

        this.socket = io.connect(`http://${document.domain}:5000`);

        this.pageLog = [];
        this.myUsername = "";
        this.myRole = "";
        this.setKey(readLocationHash());

        this.checkClipboard();

        this.setDOMEventListeners();
        this.setSocketioEventListeners();

        if (this.myRoomKey != "") {
            this.showPage("joinPage");
        } else {
            this.showPage("mainPage");
        }
    }

    showPage(page) {
        if (this.pageLog.length >= 1) {
            hide(this.pageLog.last());
        }
        el(page).style.display = "";
        this.pageLog.push(page);
    }

    goBack() {
        hide(this.pageLog.pop());
        if (this.pageLog.length == 0) this.pageLog = ["mainPage"];
        show(this.pageLog.last());
    }

    leaveRoom() {
        this.socket.emit("cLeaveRoom");
        this.goBack();
    }

    setPlayers(usernames, host) {
        el("preparationPage_users").innerHTML = "";
        el("preparationPage_playersCnt").innerText = 
            `${usernames.length} ${wordPlayers(usernames.length)}`;
        let _this = this;
        usernames.forEach(username => _this.addPlayer(username))
        if (host) {
            el(`user_${host}`).classList.add("host");
        }
    }

    addPlayer(username) {
        el("preparationPage_users").appendChild(
            template("preparationPage_user", {"username": username}));
        if (username == this.myUsername) {
            el(`user_${username}`).classList.add("you");
        }
    }

    // removePlayer(username) {
    //     deleteNode(el(`user_${username}`));
    // }

    setMyUsername(username) {
        this.myUsername = username;
    }


    setKey(value) {
        this.myRoomKey = value.toUpperCase();
        location.hash = value;
        el("joinPage_inputKey").value = this.myRoomKey;
        el("preparationPage_title").innerText = this.myRoomKey;
    }

    generateKey() {
        fetch("/getFreeKey")
            .then(response => response.json())
            .then(result => el("joinPage_inputKey").value = result.key)
    }

    copyKey() {
        navigator.clipboard.writeText(this.myRoomKey);
    }

    copyLink() {
        navigator.clipboard.writeText(`http://${document.domain}:5000/#${
            this.myRoomKey}`);
    }

    pasteKey() {
        navigator.clipboard.readText().then(clipText => {
            el("joinPage_inputKey").value = clipText;
        })
    }

    checkClipboard() {
        if (!(navigator.clipboard && navigator.clipboard.readText)) {
            // el("joinPage_pasteKey").style.display = "none";
            disable("joinPage_pasteKey")
        }
    }

    showStartAction(host) {
        if (host != this.myUsername) {
            hide("preparationPage_start");
            show("preparationPage_startLabel");
        } else {
            show("preparationPage_start");
            hide("preparationPage_startLabel");
        }
    }

    enterRoom() {
        if (this.myRoomKey == "") {
            console.log("Empty room key");
            return;
        }
        fetch(`/getRoomInfo?key=${this.myRoomKey}`)
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                console.log("Invalid room key");
                return;
            };
            switch(result.state) {
            case "wait":
            case "play":
                this.socket.emit("cJoinRoom", 
                    {"username": this.myUsername, 
                     "key": this.myRoomKey
                });
                break; 
            case "end":
                console.log("Results in MVP-next.");
                break;
            }
        })
    }

    setGameState(state, data) {
        switch(state) {
        case "wait":
            this.hideAllGameActions()
            switch (this.myUsername) {
            case data.listener:
                show("gamePage_listenerReadyBox");
                this.myRole = "listener";
                break;
            case data.speaker:
                show("gamePage_speakerReadyBox");
                this.myRole = "speaker";
                break;
            default:
                show("gamePage_observerReadyBox");
                this.myRole = "observer";
                break;
            }
            show("gamePage_speakerListener");
            el("gamePage_speaker").innerText = data.speaker;
            el("gamePage_listener").innerText = data.listener;
            break;
        case "explanation":
        console.log(data.startTime - (new Date()).getTime());
            setTimeout(() => {
                console.log("timeout", this);
                if (this.myRole == "") {
                    console.log("WARN: empty role");
                    return;
                }
                this.hideAllGameActions()
                if (this.myRole == 'speaker') {
                    show("gamePage_explanationDelayBox");
                    this.animateDelay().then(() => {
                        hide("gamePage_explanationDelayBox");
                        show("gamePage_explanationBox");
                        this.animateTimer().then(() => {
                            el("gamePage_explanationTimer").innerText = "00:00";
                        })
                    })
                }
            }, data.startTime - (new Date()).getTime() - DELAY_TIME);
            break;
        }
    }

    animateDelay() {
        return animate({
            duration: DELAY_TIME,
            draw: (progress) => {
                el("gamePage_explanationDelayTimer").innerText = 
                    Math.floor((1 - progress) / 1000 * DELAY_TIME) + 1;
            }
        })
    }

    animateTimer() {
        return animate({
            duration: EXPLANATION_TIME,
            draw: (progress) => {
                el("gamePage_explanationTimer").innerText = 
                    timeFromSeconds(Math.floor(
                    (1 - progress) / 1000 * EXPLANATION_TIME) + 1);
            }
        })
    }

    hideAllGameActions() {
        hide("gamePage_speakerListener");
        hide("gamePage_speakerReadyBox");
        hide("gamePage_listenerReadyBox");
        hide("gamePage_observerReadyBox");
        hide("gamePage_observerBox");
        hide("gamePage_explanationBox");
    }

    listenerReady() {
        this.socket.emit("cListenerReady");
        disable("gamePage_listenerReadyButton");
        el("gamePage_listenerReadyButton").innerText = "Подожди напарника"
    }

    speakerReady() {
        this.socket.emit("cSpeakerReady");
        disable("gamePage_speakerReadyButton");
        el("gamePage_speakerReadyButton").innerText = "Подожди напарника"
    }

    setSocketioEventListeners() {
        let _this = this;

        if (this.debug) {
            let events = ["sPlayerJoined", "sPlayerLeft", "sFailure",
            "sYouJoined", "sGameStarted", "sExplanationStarted",
            "sExplanationEnded", "sNextTurn", "sNewWord", "sWordExplanationEnded",
            "sWordsToEdit", "sGameEnded"];
            events.forEach((event) => {
                _this.socket.on(event, function(data) {
                    console.log(event, data);
                })
            })
        }

        this.socket.on("sPlayerJoined", function(data) {
            _this.setPlayers(data.playerList.filter(user => user.online)
                .map(user => user.username), data.host);
            _this.showStartAction(data.host);
        })
        this.socket.on("sPlayerLeft", function(data) {
            _this.setPlayers(data.playerList.filter(user => user.online)
                .map(user => user.username), data.host);
            _this.showStartAction(data.host);
        })
        this.socket.on("sYouJoined", function(data) {
            switch (data.state) {
            case "wait":
                _this.setPlayers(data.playerList.filter(user => user.online)
                    .map(user => user.username), data.host);
                _this.showStartAction(data.host);
                _this.showPage("preparationPage");
                break;
            case "play":
                if (data.state == "play") {
                    this.myRole = (data.from == this.myUsername) ? "speaker" :
                        (data.to == this.myUsername) ? "listener" : "observer";
                }
                _this.setGameState(data.substate, data);
                _this.showPage("gamePage");
                break;
            }
        })
        this.socket.on("sGameStarted", function(data) {
            _this.setGameState("wait", {
                "speaker": data.from,
                "listener": data.to
            })
            _this.showPage("gamePage");
        })
        this.socket.on("sExplanationStarted", function(data) {
            _this.setGameState("explanation", data);
        })
    }

    setDOMEventListeners() {
        el("mainPage_createRoom").onclick = () => {
            this.generateKey();
            this.showPage('joinPage');
        }
        el("mainPage_joinRoom").onclick = () => {
            el("joinPage_inputKey").value = this.myRoomKey;
            this.showPage('joinPage');
        }
        el("mainPage_viewRules").onclick = () => this.showPage('rulesPage');
        el("joinPage_goBack").onclick = () => this.goBack();
        el("joinPage_viewRules").onclick = () => this.showPage('rulesPage');
        el("joinPage_pasteKey").onclick = () => this.pasteKey();
        el("joinPage_generateKey").onclick = () => this.generateKey();
        el("joinPage_go").onclick = () => {
            this.setKey(el("joinPage_inputKey").value);
            this.setMyUsername(el("joinPage_inputName").value);
            this.enterRoom();
        }
        el("rulesPage_goBack").onclick = () => this.goBack();
        el("preparationPage_viewRules").onclick = () => this.showPage('rulesPage');
        el("preparationPage_goBack").onclick = () => this.leaveRoom();
        el("preparationPage_start").onclick = () => this.socket.emit("cStartGame");
        el("preparationPage_copyKey").onclick = () => this.copyKey();
        el("preparationPage_copyLink").onclick = () => this.copyLink();
        el("gamePage_listenerReadyButton").onclick = () => this.listenerReady();
        el("gamePage_speakerReadyButton").onclick = () => this.speakerReady();
        el("gamePage_explanationSuccess").onclick = () => this.socket.emit(
            "cEndWordExplanation", {"cause": "explained"});
        el("gamePage_explanationFailed").onclick = () => this.socket.emit(
            "cEndWordExplanation", {"cause": "notExplained"});
        el("gamePage_explanationMistake").onclick = () => this.socket.emit(
            "cEndWordExplanation", {"cause": "mistake"});
    }
}

let app;
window.onload = function() {
    app = new App();
}
