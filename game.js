// --- 1. DEFINICIÓN DE NIVELES ---
const NIVELES = [
    {
        nombre: "SECTOR 1: LLANURA BIVALENTE",
        spawnX: 400, spawnY: 50, // Dónde nace la nave (siempre la ponemos en peligro de caer)
        fuel: 1200, // Combustible generoso para el tutorial
        pads: [
            { x: 150, y: 400, w: 100, mult: 2 }, // Zona segura y ancha
            { x: 650, y: 400, w: 100, mult: 4 }  // Zona más pequeña, mejor premio
        ],
        // Las coordenadas matemáticas que dibujan la línea blanca del suelo. 
        points: [0, 400, 100, 400, 200, 400, 300, 350, 500, 350, 600, 400, 700, 400, 800, 400]
    },
    {
        nombre: "SECTOR 2: CRÁTER DE LA MUERTE",
        spawnX: 250, spawnY: 50,
        fuel: 1000,
        pads: [
            { x: 100, y: 250, w: 60, mult: 2 },
            { x: 400, y: 550, w: 60, mult: 5 }, // El fondo del cráter
            { x: 700, y: 250, w: 60, mult: 4 }
        ],
        points: [0, 250, 70, 250, 130, 250, 370, 550, 430, 550, 670, 250, 730, 250, 800, 250]
    },
    {
        nombre: "SECTOR 3: PICOS GEMELOS",
        spawnX: 100, spawnY: 50,
        fuel: 900,
        pads: [
            { x: 250, y: 200, w: 40, mult: 6 },
            { x: 550, y: 200, w: 40, mult: 8 },
            { x: 400, y: 550, w: 80, mult: 2 }
        ],
        points: [0, 550, 150, 550, 230, 200, 270, 200, 360, 550, 440, 550, 530, 200, 570, 200, 650, 550, 800, 550]
    },
    {
        nombre: "SECTOR 4: CAÍDA EN ESCALERA",
        spawnX: 60, spawnY: 50,
        fuel: 800,
        pads: [
            { x: 150, y: 200, w: 60, mult: 2 },
            { x: 350, y: 350, w: 60, mult: 4 },
            { x: 550, y: 500, w: 60, mult: 6 }
        ],
        points: [0, 200, 120, 200, 180, 200, 180, 350, 320, 350, 380, 350, 380, 500, 520, 500, 580, 500, 580, 600, 800, 600]
    },
    {
        nombre: "SECTOR 5: LA AGUJA",
        spawnX: 100, spawnY: 50,
        fuel: 800,
        pads: [
            { x: 200, y: 550, w: 60, mult: 3 },
            { x: 400, y: 150, w: 30, mult: 10 },
            { x: 600, y: 550, w: 60, mult: 3 }
        ],
        points: [0, 550, 170, 550, 230, 550, 385, 150, 415, 150, 570, 550, 630, 550, 800, 550]
    }
];

// --- 2. CLASE DE LA NAVE 
class Lander extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'vector_ship');
        scene.add.existing(this);
        scene.physics.add.existing(this);


        this.setDamping(true);
        this.setDrag(0.97); // Simula la inercia, hace que resbale un poco en el vacío
        this.setMaxVelocity(200); // Evita que atravesemos paredes
    }

    aplicarEmpuje() {
        // Calcula hacia dónde está apuntando la nariz de la nave y empuja en esa dirección
        this.scene.physics.velocityFromRotation(this.rotation - Math.PI / 2, 250, this.body.acceleration);
    }

    detenerEmpuje() {
        this.setAcceleration(0);
    }

    girarIzquierda() {
        this.setAngularVelocity(-200);
    }

    girarDerecha() {
        this.setAngularVelocity(200);
    }

    detenerGiro() {
        this.setAngularVelocity(0);
    }
}

// --- 3. CLASE DE LA ESCENA PRINCIPAL ---

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 0;
        this.score = 0;
        this.timeElapsed = 0;
    }

    preload() {
        // Cargamos los efectos de sonido 
        this.load.audio('sonidoMotor', 'assets/motor.mp3');
        this.load.audio('sonidoExplosion', 'assets/explosion.mp3');
        this.load.audio('sonidoExito', 'assets/exito.mp3');
    }

    create() {
        // Se ejecuta cada vez que arranca un nivel nuevo o reiniciamos.
        // Limpiamos la mesa para empezar frescos.
        this.gameOver = false;
        this.levelComplete = false;
        this.terrainLines = [];

        let datosNivel = NIVELES[this.currentLevel];

        // Le llenamos el tanque a la nave basándonos en lo que dice el nivel actual
        this.fuel = datosNivel.fuel;
        this.fuelAlEmpezarNivel = this.fuel;

        // Preparamos los sonidos
        this.motorSound = this.sound.add('sonidoMotor', { volume: 0.5, loop: true }) || { play: () => { }, stop: () => { }, isPlaying: false };
        this.explosionSound = this.sound.add('sonidoExplosion', { volume: 0.8 }) || { play: () => { } };
        this.exitoSound = this.sound.add('sonidoExito', { volume: 0.8 }) || { play: () => { } };

        // Construimos todo lo visual
        this.crearTexturaNave();
        this.construirNivel(datosNivel);
        this.configurarUI(datosNivel);
        this.configurarControles();


        this.timeEvent = this.time.addEvent({
            delay: 1000,
            callback: () => { if (!this.gameOver && !this.levelComplete) this.timeElapsed++; },
            loop: true
        });
    }

    crearTexturaNave() {

        if (this.textures.exists('vector_ship')) return;
        let shipGfx = this.make.graphics({ x: 0, y: 0, add: false });
        shipGfx.lineStyle(1.5, 0xffffff);
        shipGfx.strokeRect(10, 5, 12, 12); // Cabina
        shipGfx.moveTo(10, 5); shipGfx.lineTo(16, 0); shipGfx.lineTo(22, 5); // Punta
        shipGfx.moveTo(10, 17); shipGfx.lineTo(4, 28); shipGfx.lineTo(8, 28); // Pata izquierda
        shipGfx.moveTo(22, 17); shipGfx.lineTo(28, 28); shipGfx.lineTo(24, 28); // Pata derecha
        shipGfx.moveTo(13, 17); shipGfx.lineTo(11, 21); shipGfx.lineTo(21, 21); shipGfx.lineTo(19, 17); // Tobera
        shipGfx.strokePath();
        shipGfx.generateTexture('vector_ship', 32, 32);
    }

    construirNivel(datosNivel) {
        // Soltamos la nave en las coordenadas indicadas
        this.lander = new Lander(this, datosNivel.spawnX, datosNivel.spawnY);

        let terrainGfx = this.add.graphics();
        let pts = datosNivel.points;

        terrainGfx.lineStyle(1.5, 0xffffff);
        terrainGfx.beginPath();
        terrainGfx.moveTo(pts[0], pts[1]);

        // Ciclo para dibujar las montañas línea por línea
        for (let i = 0; i < pts.length - 2; i += 2) {
            let x1 = pts[i], y1 = pts[i + 1];
            let x2 = pts[i + 2], y2 = pts[i + 3];

            terrainGfx.lineTo(x2, y2);

            // Verificamos si esta línea que acabamos de dibujar es un hueco para una plataforma.
            // Si NO es una plataforma, la guardamos en terrainLines como un "muro mortal".
            let esPlataforma = false;
            for (let p of datosNivel.pads) {
                if (y1 === p.y && y2 === p.y && x1 === (p.x - p.w / 2) && x2 === (p.x + p.w / 2)) {
                    esPlataforma = true; break;
                }
            }
            if (!esPlataforma) {
                this.terrainLines.push(new Phaser.Geom.Line(x1, y1, x2, y2));
            }
        }
        terrainGfx.strokePath();

        // Ahora rellenamos los huecos con nuestras zonas de aterrizaje interactivas
        this.padsGroup = this.physics.add.staticGroup();
        let padGfx = this.add.graphics();

        for (let p of datosNivel.pads) {
            let nuevoPad = this.padsGroup.create(p.x, p.y, null).setSize(p.w, 10).setVisible(false);
            nuevoPad.multiplicador = p.mult; // Le inyectamos cuánto vale esta plataforma

            // Le damos color a la zona dependiendo de qué tan codiciosa es la recompensa
            let padColor = 0x44ff44; // Verde (tranqui)
            if (p.mult >= 4 && p.mult <= 6) padColor = 0xffff44; // Amarillo (cuidado)
            if (p.mult > 6) padColor = 0xff4444; // Rojo (sudores fríos)

            padGfx.lineStyle(3, padColor);
            padGfx.beginPath();
            padGfx.moveTo(p.x - p.w / 2, p.y);
            padGfx.lineTo(p.x + p.w / 2, p.y);
            padGfx.strokePath();

            // Dibujamos el texto del multiplicador justo debajo de la zona
            this.add.text(p.x, p.y + 12, p.mult + 'X', { fontFamily: 'Courier', fontSize: '14px', fill: '#ffffff' }).setOrigin(0.5, 0);
        }

        // Activamos el sensor: Si la nave toca alguna plataforma, avísale a checkLanding()
        this.physics.add.collider(this.lander, this.padsGroup, this.checkLanding, null, this);
    }

    configurarUI(datosNivel) {

        let fontStyle = { fontFamily: 'Courier', fontSize: '16px', fill: '#00ffcc' };
        this.textLeft = this.add.text(10, 10, '', fontStyle);
        this.textRight = this.add.text(560, 10, '', fontStyle);

        this.levelNameText = this.add.text(400, 80, datosNivel.nombre, { fontFamily: 'Courier', fontSize: '18px', fill: '#aaaaaa' }).setOrigin(0.5);
        this.messageText = this.add.text(400, 250, '', { fontFamily: 'Courier', fontSize: '24px', fill: '#ffffff', align: 'center' }).setOrigin(0.5);
    }

    configurarControles() {

        this.cursors = this.input.keyboard.createCursorKeys();
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    }

    update() {

        if (this.gameOver) {
            if (this.motorSound && this.motorSound.isPlaying) this.motorSound.stop();
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.scene.restart();
            }
            return;
        }

        // Si ya ganamos, esperamos que presiones [N] para avanzar
        if (this.levelComplete) {
            if (this.motorSound && this.motorSound.isPlaying) this.motorSound.stop();
            if (Phaser.Input.Keyboard.JustDown(this.nextKey)) {
                this.currentLevel++;
                this.scene.restart();
            }
            return;
        }

        // Escuchamos las flechas direccionales y le decimos a la nave qué hacer
        if (this.cursors.left.isDown) this.lander.girarIzquierda();
        else if (this.cursors.right.isDown) this.lander.girarDerecha();
        else this.lander.detenerGiro();

        if (this.cursors.up.isDown && this.fuel > 0) {
            this.lander.aplicarEmpuje();
            this.fuel -= 1; // Quemamos 1 de combustible por cada frame
            if (this.motorSound && !this.motorSound.isPlaying) this.motorSound.play();
        } else {
            this.lander.detenerEmpuje();
            if (this.motorSound && this.motorSound.isPlaying) this.motorSound.stop();
        }

        this.verificarColisionesTerreno();
        this.actualizarTelemetria();
    }

    verificarColisionesTerreno() {
        // hitbox de la nave
        let hitboxNave = new Phaser.Geom.Circle(this.lander.x, this.lander.y, 12);

        // Comprobamos si ese círculo está tocando 
        for (let lineaMontaña of this.terrainLines) {
            if (Phaser.Geom.Intersects.LineToCircle(lineaMontaña, hitboxNave)) {
                this.crashShip(); // ¡Bum!
                break;
            }
        }

        // También te mueres si te sales de la pantalla
        if (this.lander.y > 590 || this.lander.x < 5 || this.lander.x > 795) {
            this.crashShip();
        }
    }

    actualizarTelemetria() {

        let vSpeed = Math.round(this.lander.body.velocity.y);
        let hSpeed = Math.round(this.lander.body.velocity.x);
        let alt = Math.max(0, Math.round(600 - this.lander.y));

        let mins = Math.floor(this.timeElapsed / 60);
        let secs = this.timeElapsed % 60;
        let timeFormatted = mins + ':' + (secs < 10 ? '0' : '') + secs;

        this.textLeft.setText(
            'PUNTOS      ' + this.score.toString().padStart(4, '0') + '\n' +
            'TIEMPO      ' + timeFormatted + '\n' +
            'COMBUSTIBLE ' + this.fuel.toString().padStart(4, '0')
        );

        this.textRight.setText(
            'ALTITUD    ' + alt.toString().padStart(4, '0') + '\n' +
            'VEL HORIZ  ' + Math.abs(hSpeed).toString().padStart(3, '0') + '\n' +
            'VEL VERT   ' + Math.abs(vSpeed).toString().padStart(3, '0')
        );
    }

    checkLanding(lander, padTouched) {
        // El juez de aterrizaje. Esta función solo se dispara si tocaste la línea verde/amarilla/roja
        if (this.gameOver || this.levelComplete) return;

        let vSpeed = lander.body.velocity.y;
        let hSpeed = Math.abs(lander.body.velocity.x);
        let angle = Math.abs(lander.angle);

        // Tolerancias amigables: No puedes ir muy rápido hacia abajo, ni derrapando, ni de cabeza.
        if (vSpeed < 80 && hSpeed < 40 && angle < 25) {
            this.physics.pause(); // Congelamos todo, lograste aterrizar

            // Calculamos los puntos
            let mult = padTouched.multiplicador;
            let puntosObtenidos = 50 * mult;
            this.score += puntosObtenidos + Math.floor(this.fuel / 10); // Bono por ahorrar gasolina

            if (this.exitoSound) this.exitoSound.play();
            this.levelComplete = true;
            this.actualizarTelemetria();

            // Mostramos los mensajes de victoria
            if (this.currentLevel < NIVELES.length - 1) {
                this.messageText.setText('ZONA ' + mult + 'X ASEGURADA\n+' + puntosObtenidos + ' PTS\n\nPRESIONA [N] PARA DESPEGAR');
                this.messageText.setColor('#44ff44');
            } else {
                this.messageText.setText('¡MISIÓN CUMPLIDA!\nHAS SOBREVIVIDO A LOS 5 SECTORES\n\nPUNTAJE FINAL: ' + this.score);
                this.messageText.setColor('#ffff44');
            }
        } else {
            // Tocaste la plataforma, pero ibas demasiado rápido. Destrucción inminente.
            this.crashShip();
        }
    }

    crashShip() {
        if (this.gameOver || this.levelComplete) return;
        this.physics.pause();
        if (this.explosionSound) this.explosionSound.play();

        // Creamos un efecto visual rápido para que la nave parpadee cuando explota
        this.time.addEvent({
            delay: 100, repeat: 5, callback: () => { this.lander.setVisible(!this.lander.visible); }
        });

        this.messageText.setText('ANOMALÍA CATASTRÓFICA\nVEHÍCULO DESTRUIDO\n\nPRESIONA [R] PARA REINTENTAR');
        this.messageText.setColor('#ff4444');
        this.gameOver = true;
    }
}

// --- 4. CONFIGURACIÓN DEL JUEGO ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#050505',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 100 }, debug: false }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);