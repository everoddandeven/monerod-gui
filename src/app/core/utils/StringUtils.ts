export abstract class StringUtils {
    public static replaceAll(value: string, oldValue: string, newValue: string): string {
        let v = value;

        while(v.includes(oldValue)) {
            v = v.replace(oldValue, newValue);
        }

        return v;
    }
    
    public static generateRandomString(n: number = 16): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < n; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
}