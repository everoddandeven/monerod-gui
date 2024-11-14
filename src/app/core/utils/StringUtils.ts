export abstract class StringUtils {
    public static replaceAll(value: string, oldValue: string, newValue: string): string {
        let v = value;

        while(v.includes(oldValue)) {
            v = v.replace(oldValue, newValue);
        }

        return v;
    }
}