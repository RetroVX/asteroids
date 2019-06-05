/**
 * Pause Menu
 */
export default class pauseScene extends Phaser.Scene {
    constructor() {
      super({ key: 'pauseScene' });
    }

    create() {

      const text = "Game Paused\nPress ENTER or 'P' to play";
      this.startText = this.add.text(320, 200, text, { font: '24px gameFont', fill: '#424340', align: 'center' });
      this.startText.setOrigin(0.5, 0.5).setScrollFactor(0);

      this.controls.add({
        name: 'cursorCustom1',
        active: true,
        controls: {
          pause: 'P',
          pause2: 'ENTER',
        }
      });
    }

    update() {
      if(Phaser.Input.Keyboard.JustDown(this.controls.keys.pause) || Phaser.Input.Keyboard.JustDown(this.controls.keys.pause2)) {
        this.startText.setText('');
        this.scene.resume('levelScene');
      }
    }
  
  }