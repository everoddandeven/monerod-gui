import { I2PData } from "./I2PData";


export class LocalDestinationsData extends I2PData {
  public destinations: string[] = [];

  public static fromWrapper(wrapper: HTMLElement): LocalDestinationsData {
    const items = wrapper.getElementsByClassName('listitem');
    const dests = new LocalDestinationsData();

    for(let i = 0; i < items.length; i++) {
      const item = items.item(i);

      if (!item || !item.textContent || item.textContent == '') continue;

      dests.destinations.push(item.textContent);
    }

    return dests;
  }
}