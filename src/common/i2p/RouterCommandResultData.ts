import { I2PData } from "./I2PData";

export class RouterCommandResultData extends I2PData {
  public message: string = "";

  public static fromWrapper(wrapper: HTMLElement): RouterCommandResultData {
    const elements = wrapper.getElementsByClassName("content");
    const content = elements.item(0);

    if (!content) {
      throw new Error("Content not found");
    }

    const data = new RouterCommandResultData();

    data.message = content.textContent ? content.textContent : 'Unknown error';

    return data;
  }
}