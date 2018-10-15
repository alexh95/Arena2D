import {V3} from './Math.js';

const Keys = Object.freeze({
	A: 65,
	D: 68,
	G: 71,
	P: 80,
	S: 83,
	W: 87,
});

export class Controller {

    constructor() {
        this.left = false;
        this.right = false;
        this.down = false;
        this.right = false;
        this.debugInfoToggle = false;
        this.debugGridToggle = false;

        this.mouse = {
            screenPosition: new V3(),
            position: new V3(),
            left: false,
            middle: false,
            right: false
        };
    }

    setKey(keyCode, value) {
        switch (keyCode) {
            case Keys.A: {
                this.left = value;
            } break;
            case Keys.D: {
                this.right = value;
            } break;
            case Keys.G: {
                this.debugInfoToggle = value;
            } break;
            case Keys.P: {
                this.debugGridToggle = value;
            } break;
            case Keys.S: {
                this.down = value;
            } break;
            case Keys.W: {
                this.up = value;
            } break;
        }
    }

}
