import { I2PData } from "./I2PData";

export class TokenData extends I2PData {
  public token: string = "";

  public static fromWrapper(wrapper: HTMLElement): TokenData {
    const collection = wrapper.getElementsByTagName("input");

    for(let i = 0; i < collection.length; i++) {
      const element = collection.item(i);
      if (!element) continue;
      if (element.name === 'token') {
        const data = new TokenData();
        data.token = element.value;
        return data;
      }
    }

    throw new Error("Token data not found in wrapper");
  }
}