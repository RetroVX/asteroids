import Player from "./player.js";

/**
 * level Scene
 */
export default class levelScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'levelScene'
        });
    }

    preload() {
        this.load.image("ship", "../assets/ship.png");
        this.load.image("bullets", "../assets/ball.png");
        this.load.image("orangeBall", "../assets/orangeBall.png");
        this.load.image("redBall", "../assets/redBall.png");
        this.load.image("ship", "../assets/ship.png");
        this.load.image("asteroid", "../assets/ball.png");
        this.load.atlas('particles', '../assets/particles.png', '../assets/particles.json');
        this.load.scenePlugin('WeaponPlugin', '../lib/WeaponPlugin.js', null, 'weapons');
    }

    create() {

        // localstorage for high scores
        this.storage = {
            fetch: function () {
                // start high scores table data if localstorage is not set
                const startData = [{
                        value: '000000',
                        multiplier: 0,
                        score: 0
                    },
                    {
                        value: '000000',
                        multiplier: 0,
                        score: 0
                    },
                    {
                        value: '000000',
                        multiplier: 0,
                        score: 0
                    },
                    {
                        value: '000000',
                        multiplier: 0,
                        score: 0
                    },
                    {
                        value: '000000',
                        multiplier: 0,
                        score: 0
                    }
                ];

                let scores;

                if (!window.localStorage.bhAsteroids || window.localStorage.bhAsteroids === undefined) {
                    scores = startData;
                } 
                else {
                    scores = JSON.parse(window.localStorage.getItem('bhAsteroids'));
                }

                return scores;
            },
            save: function (scores) {
                window.localStorage.setItem('bhAsteroids', JSON.stringify(scores));
            }
        }

        // start vue, display ui and top 5 highscores
        this.vm = new Vue({
            el: '#infoPanel',
            data: {
                score: 0,
                multiplier: 0,
                lives: 3,
                highScores: this.storage.fetch(),
            },
            methods: {
                // when the animation is complete, remove the css class
                removeClass(score) {
                    score.newScore = false;
                }
            }
        })

        // camera
        this.cam = this.cameras.main;
        this.cam.flash();

        // create controls (using phaserControlsPlugin)
        this.controls.add({
            name: 'cursorCustom',
            active: true,
            controls: {
                up: 'UP',
                down: 'DOWN',
                left: 'LEFT',
                right: 'RIGHT',
                space: 'SPACE',
                pause: 'P',
                autofire: 'F'
            }
        });
        this.controls.createWasdKeys();

        // add player and asteroid groups to store sprites
        this.playerGroup = this.physics.add.group();
        this.asteroidGroup = this.physics.add.group();

        // create player ship
        this.player = new Player(this, 320, 240);

        // create scores/lives/multipliers
        this.score = 0;
        this.highScore = 0;
        this.multiplier = 0;

        // start spawning asteroids
        this.createTimer();


        this.particles = this.add.particles('particles');
        this.explosionEmitter = this.particles.createEmitter({
            frame: ['redBall', 'yellowBall'],
            speed: 150,
            scale: {
                start: 0.05,
                end: 0
            },
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: 5000,
            on: false
        });

        // collide player ship and asteroids and player ship bullets and asteroids
        this.physics.add.collider(this.asteroidGroup, this.playerGroup, this.playerHit, null, this);
        this.physics.add.collider(this.asteroidGroup, this.player.sprite.weapon.bullets, this.bulletHitAsteroid, null, this);

        // pause the scene once everythings loaded so player can start when ready
        this.scene.pause();
        this.scene.launch('pauseScene');

    }

    /**
     * Spawn asteroids on a timer of every 10 seconds  
     * Create between 2/10 asteroids with varying scale
     */
    createTimer() {
        this.spawnAsteroidsTimer = this.time.addEvent({
            delay: 10000,
            callback: function () {
                for (let i = 0; i < Phaser.Math.Between(2, 10); i++) {
                    if (this.asteroidGroup.getChildren().length < 50) {
                        let scale = Phaser.Math.Between(3, 7);
                        this.createAsteroid(Phaser.Math.Between(0, 640), Phaser.Math.Between(0, 480), (scale / 10), scale, 'big', true);
                    }
                }
            },
            repeat: -1,
            callbackScope: this
        });
    }

    /**
     * Create an asteroid  
     * Either a big asteroid or small asteroids
     * @param {number} x - x coordinate to place asteroid
     * @param {number} y - y coordinate to place asteroid
     * @param {number} scale - size of the asteroid
     * @param {number} health - how much health the asteroid has (tied to scale)
     * @param {string} type - big asteroid or small asteroid
     * @param {boolean} fadeIn - bool, fade in asteroid?
     */
    createAsteroid(x, y, scale, health, type, fadeIn) {
        let key;
        // if type is small, select a red or orange ball as the key, else big asteroid
        if (type === 'small') {
            // 'randomly' pick asteroid color
            if (Math.random() > 0.55) {
                key = 'redBall'
            } 
            else {
                key = 'orangeBall'
            }
        } 
        else {
            key = 'asteroid';
        }
        this.asteroid = this.asteroidGroup.create(x, y, key).setOrigin(0.5, 0.5);
        this.asteroid.setScale(scale);
        this.asteroid.setImmovable(true);
        this.asteroid.scaleDefault = 0.25;
        this.asteroid.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
        this.asteroid.setMaxVelocity(100);
        this.asteroid.setMass(1);
        this.asteroid.setCircle(32);
        this.asteroid.type = type;
        this.asteroid.score = 100;
        this.asteroid.health = health;
        this.asteroid.timeAlive = 0;
        if (fadeIn) {
            this.asteroid.setAlpha(0.2)
            this.asteroid.startTween = this.tweens.add({
                targets: this.asteroid,
                alpha: 1,
                duration: 1500,
                ease: 'Power1',
            });
        }
    }

    update(time, delta) {
        this.player.update();
        // wrap the player and asteroids 
        this.physics.world.wrap(this.player.sprite, 16);
        this.physics.world.wrap(this.asteroidGroup, 16);

        // pause the game
        if (Phaser.Input.Keyboard.JustDown(this.controls.keys.pause)) {
            this.scene.launch('pauseScene');
            this.scene.pause();
        }

        // count up timeAlive parameter of asteroid
        // this is so the player doesnt immediately lose a life if the asteroid spawns in on top of them
        this.asteroidGroup.children.each(function (asteroid) {
            if (asteroid.active) {
                asteroid.timeAlive++;
            }
        });


    }

    /**
     * Player bullets hit an asteroid, destroy the asteroid.
     * increases score and multiplier 
     * @param {object} bullet - player bullet
     * @param {object} asteroid - asteroid thats been hit
     */
    bulletHitAsteroid(bullet, asteroid) {
        // kill bullet
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
        bullet.kill();

        // take away asteroid health
        asteroid.health--;

        // small particle explosion and screen shake to register the hit
        this.explosionEmitter.setPosition(asteroid.x, asteroid.y);
        this.explosionEmitter.explode(5);
        this.cam.shake(50, 0.006);

        // when asteroid blows up
        if (asteroid.health <= 0) {
            asteroid.setActive(false).setVisible(false);
            asteroid.body.enable = false;
            // if the asteroid is a standard big one that spawns via the timer
            // then create a bunch of smaller asteroids based on how big the asteroid was
            if (asteroid.type === 'big') {
                let num = ((asteroid.scaleX * 10) * 4)
                for (let i = 0; i < num; i++) {
                    this.createAsteroid(asteroid.x, asteroid.y, 0.2, 1, 'small', false);
                }
                // asteroid explodes
                this.explosionEmitter.setPosition(asteroid.x, asteroid.y);
                this.explosionEmitter.explode(20);
                this.cam.flash();
            }

            // increase multplier if asteroidGroup children are a multiple of 5
            if (this.asteroidGroup.getChildren().length % 5 === 0) {
                this.multiplier++;
                this.vm.multiplier = 'x' + this.multiplier;
            }

            // the bigger the asteroid, the bigger the score
            this.score += (asteroid.scaleX * 1000) * this.multiplier;
            this.vm.score = this.numberCommas(this.score);

            // destroy asteroid
            asteroid.destroy();

        }
    }

    /**
     * @param {object} asteroid - the asteroid that has collided with the player
     * @param {object} player - player that has been hit
     */
    playerHit(asteroid, player) {
        // only hit the player if the asteroid has been alive for a couple of seconds
        if(asteroid.timeAlive > 100) {
            // register hit with flash, screen shake and particle explosion
            this.cam.flash();
            this.cam.shake(100, 0.01);
            this.explosionEmitter.setPosition(player.x, player.y);
            this.explosionEmitter.explode(75);
            // lose a life and reset multipler, update vue
            player.lives--;
            this.vm.lives = player.lives;
            this.multiplier = 0;
            this.vm.multiplier = this.multiplier;

            // player flashes when hit
            player.hitTween.play();

            // destroy any active asteroids
            this.asteroidGroup.children.each(function (asteroid) {
                asteroid.destroy();
            });

            // game over
            if(player.lives <= 0) {
                // set player to inactive, also disables player controls
                player.setActive(false).setVisible(false);
                player.emitter.on = false;
                // start camera fade out
                this.cam.fadeOut(3500, 255, 255, 255);

                // destroy the timer and any asteroids that are active
                this.spawnAsteroidsTimer.destroy();
                this.asteroidGroup.children.each(function (asteroid) {
                    asteroid.destroy();
                });

                // check to see if this score is higher than any current top 5 high score
                const length = this.vm.highScores.length;
                if(this.score > this.vm.highScores[length - 1].score) {
                    // push score to vue highScores array to update dom
                    const score = {
                        value: this.numberCommas(this.score),
                        multiplier: this.multiplier,
                        score: this.score,
                        newScore: true
                    };
                    this.vm.highScores.push(score);
                    // sort the array with highest score first
                    this.vm.highScores.sort(function (a, b) {
                        return b.score - a.score;
                    });
                    // remove last score
                    this.vm.highScores.pop();
                    // save to localStorage
                    this.storage.save(this.vm.highScores);


                }
                // reset scores and multiplers, update vue dom
                this.score = 0;
                this.vm.score = this.score;
                this.multiplier = 0;
                this.vm.multiplier = this.multiplier;

                // restart game
                this.time.addEvent({
                    delay: 4000,
                    callback: function () {
                        // start timer, reset lives and player
                        this.createTimer();
                        player.lives = 3;
                        this.vm.lives = player.lives;
                        this.cam.fadeIn(1000, 255, 255, 255);
                        player.setActive(true).setVisible(true);
                    },
                    callbackScope: this
                });
            }
        }
    }

    /**
     * adds commas to numbers
     * @param {*} x - the number to convert
     */
    numberCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}