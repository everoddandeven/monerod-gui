
type NetworkType = 'mainnet' | 'testnet' | 'stagenet';

export abstract class MoneroUtils {
  
  public static async validateAddress(address: string, networkType: NetworkType): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      window.electronAPI.validateMoneroAddress(address, networkType, (result: { error?: string }) => {
        if (result.error !== undefined) reject(new Error(result.error));
        else resolve();
      });
    });
  }

  public static async isValidAddress(address: string, networkType: NetworkType): Promise<boolean> {
    try {
      await this.validateAddress(address, networkType);
      return true;
    } catch {
      return false;
    }
  }

};
