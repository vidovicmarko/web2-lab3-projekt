//Postavljanje canvas-a
const canvas = document.getElementById('gameBreakout');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 8; // Postavljenje širine, -8px kako bih mogao prikazati obrub
canvas.height = window.innerHeight - 8; // Postavljanje visine. -8px kako bih mogao prikazati obrub

//Svojstva za palicu (platform) o koju se odbija loptica 
const platformHeight = 10;
const platformWidth = 200;
let platformX = (canvas.width - platformWidth) / 2;

// Svojstva loptice
let ballRadius = 10;
//Postavljanje početne lokacije loptice iznad same palice 
let x = canvas.width / 2;
let y = canvas.height - 20;
let dx = 8; //"Default" horizontalna brzina loptice
let dy = -8; //"Default" vertijalna brzina loptice

//Svojstva za cigle
let brickRowCount = 5; //"Default" broj redova cigli
let brickColumnCount = 10; //"Default" broj stupaca cigli
let brickWidth = (canvas.width - (brickColumnCount + 1) * 10) / brickColumnCount; // Postavljanje širine cigle 
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30; //Offset kako bi se mogao vidjeti score i highscore

let score = 0;
let highScore = localStorage.getItem('highScore') || 0; // Najveći pohranjeni rezultat unutar localStorage (Web Storage API)

// Zvukovi za igru
const loseSound = new Audio('sounds/lose.mp3');
const winSound = new Audio('sounds/win.mp3');

//Tipka za pocetak igre i početni zaslon
const startButton = document.getElementById('startButton');
const startScreen = document.getElementById('startScreen');
//Dohvaćanje elemenata za postavke igre na početnom prikazu
const startSpeedSlider = document.getElementById('startSpeedSlider');
const startRowSlider = document.getElementById('startRowSlider');
const startColSlider = document.getElementById('startColSlider');
const startSpeedValue = document.getElementById('startSpeedValue');
const startRowValue = document.getElementById('startRowValue');
const startColValue = document.getElementById('startColValue');

//Ažuriranje prikaza vrijdnosti na klizaču
startSpeedSlider.oninput = () => {
    startSpeedValue.textContent = startSpeedSlider.value; // Ažuriranje za brzinu loptice
};
startRowSlider.oninput = () => {
    startRowValue.textContent = startRowSlider.value; //Ažuriranje za broj redova
};
startColSlider.oninput = () => {
    startColValue.textContent = startColSlider.value;//Ažuriranje za broj stupaca
};

//Dohvaćanje elemenata za postavke igre na "GAME OVER" i "YOU WIN" prozoru
const speedSlider = document.getElementById('speedSlider');
const rowSlider = document.getElementById('rowSlider');
const colSlider = document.getElementById('colSlider');
const speedValue = document.getElementById('speedValue');
const rowValue = document.getElementById('rowValue');
const colValue = document.getElementById('colValue');

speedSlider.oninput = () => {
    speedValue.textContent = speedSlider.value;  //Ažuriranje za brzinu loptice
};
rowSlider.oninput = () => {
    rowValue.textContent = rowSlider.value; // Ažuriranje za broj redova
};
colSlider.oninput = () => {
    colValue.textContent = colSlider.value; //Ažuriranje za broj stupaca
};

let gameRunning = false; // Oznaka koja govori jel igra u tijeku


/**
 * Funkcija startButton.addEventListener('click', () =>
 * Ova funkcija se poziva kada korisnik pritisne gumb za pokretanje igre, cilj je da se odaberu postavke, sakrije početni ekran i započne igra
 */

startButton.addEventListener('click', () => {
    let startSpeed = parseInt(startSpeedSlider.value);  //Dohvaća početnu brzinu s klizača i pretvara je u cijeli broj

    // Generiranje kuta između 30 i 60 ili između -30 i -60 stupnjeva kako bi se loptica odbila pod nasumičnim kutem
    let angle;
    if (Math.random() < 0.5) {
        angle = (Math.random() * 30 + 30) * (Math.PI / 180); // Kut između 30 i 60 stupnjeva
    } else {
        angle = -(Math.random() * 30 + 30) * (Math.PI / 180);// Kut između -30 i -60 stupnjeva
    }

    //Postavlja početne horizontalne i vertikalne brzine i smjer loptice s nasumičnim kutom
    dx = Math.cos(angle) * startSpeed; //Horizontalna brzina loptice na temelju kuta i početne brzine
    dy = -Math.abs(Math.sin(angle) * startSpeed); //Vertikalna brzina loptice na temelju kuta i početne brzine

    //Dohvaća trenutni broj redova i stupaca cigli s klizača
    brickRowCount = parseInt(startRowSlider.value);
    brickColumnCount = parseInt(startColSlider.value);

    startScreen.style.display = 'none'; //Sakriva početni ekran s postavkama igre
    resetBricks(); //Inicijalizira cigle sa novim postavkama
    gameRunning = true; // Započinje igru
    draw(); 
});

let brickOffsetLeft = 0; //Udaljenost od lijevog ruba

/**
 * Funkcija resetBricks
 * Resetira i ponovno inicijalizira cigle na temelju trenutnih postavki broja redova i stupaca
 */

let bricks = [];
function resetBricks() {
    bricks = [];
    // brickWidth - računa širinu svake cigle na temelju širine canvas elementa, broja stupaca cigli i razmaka između cigli
    brickWidth = (canvas.width - (brickColumnCount - 1) * brickPadding) / brickColumnCount; 
    // brickOffsetLeft -  Računa "offset" kako bi se cigle centrirale unutar canvas-a
    brickOffsetLeft = (canvas.width - (brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding)) / 2;
    
    if (brickOffsetLeft < 0) brickOffsetLeft = 0; //Provjera da cigle nisu izvan ruba canvas-a

    // Stvara se dvodimenzionalni niz bricks, gdje svaki element ima x, y i status
    for (let i = 0; i < brickColumnCount; i++) {
        bricks[i] = [];
        for (let j = 0; j < brickRowCount; j++) {
            bricks[i][j] = { x: 0, y: 0, status: 1 };
        }
    }
}

let rightPressed = false;
let leftPressed = false;

//Dodavanje "Event Listener-a" koji prate jel su tipke pritisnute
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

/**
 * Funkcije keyDownHandler i keyUpHandler
 * Postavlja zastavicu "rightPressed" ili "leftPressed" na "true"/"false" ovisno o pritisnutoj/otpuštenoj tipki
 */

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;// Pritisak desne tipke
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true; // Pritisak lijeve tipke
    }
}
function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false; //Otpuštanje desne tipke
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false; //Otpuštanje lijeve tipke
    }
}

/**
 * Funkcija drawBall
 * Crta lopticu na platnu na trenutnoj poziciji "x" i "y".
 */
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.closePath();
}

/**
 * Funkcija drawPlatform
 * Crta palicu na platnu na trenutnoj poziciji "platformX".
 */
function drawPlatform() {
    ctx.beginPath();
    ctx.rect(platformX, canvas.height - platformHeight, platformWidth, platformHeight); // Pravokutnik
    ctx.shadowBlur = 20; //Sjena
    ctx.shadowColor = '#000';
    ctx.fillStyle = '#7a1111';
    ctx.fill();
    ctx.closePath();
}

/**
 * Funkcija drawBricks
 * Crta cigle na platnu na temelju trenutnih pozicija u "bricks" nizu.
 */
function drawBricks() {
    for (let i = 0; i < brickColumnCount; i++) {
        for (let j = 0; j < brickRowCount; j++) {
            if (bricks[i][j].status == 1) { // Provjerava je li cigla postoji (status 1)
                // Izračunava x i y poziciju za ciglu
                let brickX = i * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = j * (brickHeight + brickPadding) + brickOffsetTop;
                //Postavlja izračunate x i y koordinate za svaku ciglu u nizu bricks
                bricks[i][j].x = brickX;
                bricks[i][j].y = brickY;
                ctx.shadowBlur = 20; //Sjena
                ctx.shadowColor = '#000'; 
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);//Crta ciglu koristeći sliku
            }
        }
    }
}

/**
 * Funkcija collisionDetection
 * Provjerava sudare između loptice i cigli te prilagođava smjer loptice i status cigli
 */
function collisionDetection() {
    //Petlja koja provjerava status svake cigle
    for (let i = 0; i < brickColumnCount; i++) {
        for (let j = 0; j < brickRowCount; j++) {
            let b = bricks[i][j];

            if (b.status == 1) { //Ako cigla postoji
                if ( //Provjerava je li loptica unutar granice cigle, ako je onda se detektira sudar
                    /**
                    * x - trenutna kordinata središta loptice
                    * ballRadius - polumjer loptice
                    * x + ballRadius - desna strana loptice
                    * b.x - lijevi rub cigle
                    * x + ballRadius > b.x - provjerava je li desna strana loptice (x + ballRadius) prošla lijevu stranu cigle (b.x)
                    * i tako dalje za ostale linije
                    */
                    x + ballRadius > b.x &&  // Desna strana loptice je unutar granice cigle
                    x - ballRadius < b.x + brickWidth && // Lijeva strana loptice je unutar granice cigle
                    y + ballRadius > b.y && // Donja strana loptice je unutar granice cigle
                    y - ballRadius < b.y + brickHeight // Gornja strana loptice je unutar granice cigle
                ) {
                    dy = -dy; // Promjena smjera vertikalne brzine loptice (odbijanje)
                    b.status = 0; //Označava da cigla više ne postoji
                    score++; // Povećanje rezultata

                    if (score > highScore) { //Provjera za novi high score
                        highScore = score;
                        localStorage.setItem('highScore', highScore); // Pohrana novog high score-a
            
                    }
                    if (score == brickRowCount * brickColumnCount) {
                        showEndScreen('YOU WIN');// Prikaz ekrana "YOU WIN"
                        winSound.play(); //Zvuk za pobjedu
                        gameRunning = false;// Zaustavljanje igre

                    }
                }
            }

        }
    }
}

/**
 * Funkcija draw
 * Crta i ažurira stanje igre na canvas-u
 */
function draw() {
    if (!gameRunning) return; //Pauza ako igra nije aktivna

    ctx.clearRect(0, 0, canvas.width, canvas.height); //Čišćenje canvasa
    //Poziva funkcije za crtanje cigli, loptice, palice i rezultata
    drawBricks();
    drawBall();
    drawPlatform();
    drawScore();

    collisionDetection();//Funkcija provjere sudara
    updatePlatformPosition();// Funkcija za ažuriranje pozicije palice

    // Detekcija sudara s rubovima canvas-a
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx; //Promjena smjera horizontalne brzine, ako loptica udari lijevi ili desni rub
    }
    if (y + dy < ballRadius) {
        dy = -dy; // Promjena smjera vertikalne brzine, ako loptica udari u gornji rub

    } else if (y + dy > canvas.height - ballRadius) {
        if (x > platformX && x < platformX + platformWidth) {
             // Izračun pozicije udara loptice o palicu
            let hitPosition = (x - (platformX + platformWidth / 2)) / (platformWidth / 2);

            // Postavljenje kuta odbijanja ovisno gdje se odbije
            let angle = hitPosition * Math.PI / 4; // Kut odbijanja (maksimalno 45 stupnjeva)

            let speed = Math.sqrt(dx * dx + dy * dy); // Održavanje konstantne brzine
            dx = Math.sin(angle) * speed;
            dy = -Math.cos(angle) * speed; //Krece se prema gore

        } else { //Ako udari donji rub i nije na palici, igra završava
            showEndScreen('GAME OVER'); // Prikaz ekrana za kraj igre
            loseSound.play(); //Zvuk za poraz
            gameRunning = false; //Zaustavlja igu
        }
    }

    //Ažuriranje pozicije loptice
    x += dx;
    y += dy;

    requestAnimationFrame(draw); //Zadržavanje petlje
}



// Funkcija za prikaz rezultata
function drawScore() {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + score, canvas.width - 150, 20);
    ctx.fillText('High Score: ' + highScore, canvas.width - 10, 20);
}

// Ažuriranje pozicije palice
function updatePlatformPosition() {
    if (rightPressed && platformX < canvas.width - platformWidth) {
        platformX += 12; //Pomicanje desno (brzina ovisi o vrijednosti)
    }
    if (leftPressed && platformX > 0) {
        platformX -= 12; //Pomicanje lijevo (brzina ovisi o vrijednosti)
    }
}

//Funkcija za prikaz ekrana za kraj igre
function showEndScreen(message) {
    document.getElementById('gameMessage').textContent = message; //String koji se prikazuje kao poruka "GAME OVER" ili "YOU WIN"
    document.getElementById('scoreDisplay').textContent = 'Your Score: ' + score;
    document.getElementById('highScoreDisplay').textContent = 'High Score: ' + highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Ponovno pokretanje igre
document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    resetGame(); // Resetiranje igre
});

// Funkcija za resetiranje stanja igre
function resetGame() {
    let startSpeed = parseInt(speedSlider.value);
    let newRowCount = parseInt(rowSlider.value);
    let newColCount = parseInt(colSlider.value);

    brickRowCount = newRowCount;// Postavljanje novog (traženog) broja redova
    brickColumnCount = newColCount; // Postavljanje novog (traženog) broja stupaca

    score = 0; // Resetiranje rezultata
    x = canvas.width / 2; //Početna x pozicija loptice
    y = canvas.height - 20;//Početna y pozicija loptice

    // Generiranje kuta između 30 i 60 ili između -30 i -60 stupnjeva kako bi se loptica odbila pod nasumičnim kutem
    let angle;
    if (Math.random() < 0.5) {
        angle = (Math.random() * 30 + 30) * (Math.PI / 180); //Kut između 30 i 60 stupnjeva
    } else {
        angle = -(Math.random() * 30 + 30) * (Math.PI / 180); //Kut između -30 i -60 stupnjeva
    }

    //Postavlja početne horizontalne i vertikalne brzine i smjer loptice s nasumičnim kutom
    dx = Math.cos(angle) * startSpeed; // Horizontalna brzina loptice
    dy = -Math.abs(Math.sin(angle) * startSpeed); //Vertikalna brzina loptice

    platformX = (canvas.width - platformWidth) / 2; // Resetiranje pozicije palice
    gameRunning = true; //Pokretanje igre
    resetBricks(); // Ponovo postavljanje cigli
    draw(); 
}
// Pokretanje igre prilikom učitavanja stranice
window.onload = () => {
    startScreen.style.display = 'flex';
};
