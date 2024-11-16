import AutoLaunch from "../auto-launch";

export abstract class AppMainProcess {

    private static autoLaunch: AutoLaunch = new AutoLaunch({
        name: 'monerod-gui',
        path: process.execPath,
        options: {
            launchInBackground: process.argv.includes('--hidden'),
            extraArguments: [
                '--auto-launch'
            ],
            linux: {
                comment: 'Monerod GUI startup script',
                version: '1.0.1'
            }
        }
    });

    public static get serve(): boolean {
        const args = process.argv.slice(1);

        return args.some(val => val === '--serve');
    }

    public static get autoLaunched(): boolean {
        return process.argv.includes('--auto-launch');
    }

    public static get startMinized(): boolean {
        return process.argv.includes('--hidden');
    }

    public static get isPortable(): boolean {
        return (!!process.env.APPIMAGE) || (!!process.env.PORTABLE_EXECUTABLE_DIR);
    }

    public static async isAutoLaunchEnabled(): Promise<boolean> {
        try {
            return this.autoLaunch.isEnabled();
        }
        catch {
            return false;
        }
    }

    public static async enableAutoLaunch(startMinized: boolean): Promise<void> {
        let enabled = await this.isAutoLaunchEnabled();

        if (enabled) {
            throw new Error("Auto launch already enabled");
        }

        this.autoLaunch = new AutoLaunch({
            name: 'monerod-gui',
            path: process.execPath,
            options: {
                launchInBackground: startMinized,
                extraArguments: [
                    '--auto-launch'
                ]
            }
        });

        await this.autoLaunch.enable();
        
        enabled = await this.isAutoLaunchEnabled();

        if (!enabled) {
            throw new Error("Could not enable auto launch due an unkown error");
        }
    }

    public static async disableAutoLaunch(): Promise<void> {
        let enabled = await this.isAutoLaunchEnabled();

        if (!enabled) {
            throw new Error("Auto launch already disabled");
        }

        await this.autoLaunch.disable();

        enabled = await this.isAutoLaunchEnabled();

        if (enabled) {
            throw new Error("Could not disable auto launch due an unknown error");
        }
    }

}