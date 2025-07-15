class Config {
    constructor() {

    }

    static getConfig() {
        if(window.config) {
            return Promise.resolve(window.config);
        }else {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const tryConfig = () => {
                    attempts += 1;
                    if(window.config) {
                        resolve(window.config);
                    } else {
                        if(attempts < 10) {
                            setTimeout(tryConfig, 2000);
                        } else {
                            reject('No Config Found');
                        }

                    }
                };

                setTimeout(tryConfig, 2000);
            })
        }
    }
}

export default Config;