class Settings {

    constructor() {
        this.isAndroid = window.navigator.userAgent.toLowerCase().indexOf('android') > 0;

        this.fps = 0.0;
        this.debugInfoOn = true;
        this.debugGridOn = false;
    }

}

export const settings = new Settings();
