import { AppChildProcess } from "./AppChildProcess";

export class I2pdProcess extends AppChildProcess {

    public static async isValidPath(path: string): Promise<boolean> {
        return false;
    }

    
}