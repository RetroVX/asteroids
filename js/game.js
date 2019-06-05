import levelScene from "./levelScene.js";
import pauseScene from "./pauseScene.js";
import phaserControls from "./../lib/phaserControlsPlugin.min.js";

const config = {
    type: Phaser.AUTO,
    parent: 'gameCanvas',
    width: 640,
    height: 480,
    transparent: true,
    pixelArt: true,
    plugins: {
        scene: [
            { key: 'phaserControls', plugin: phaserControls, mapping: 'controls' }
        ]
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [levelScene, pauseScene],
    title: 'Bullet Hell Asteroids',
    url: 'https://github.com/RetroVX/asteroids'
};

const game = new Phaser.Game(config);