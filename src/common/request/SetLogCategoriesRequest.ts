import { RPCRequest } from "./RPCRequest";

export class SetLogCategoriesRequest extends RPCRequest {
  public override readonly method: string = 'set_log_categories';
  public override readonly restricted: boolean = true;

  public readonly categories: string;

  constructor(categories: string) {
    super();
    this.categories = categories;
  }
  
  public toDictionary(): { [key: string]: any; } {
    return {
      'categories': this.categories
    }
  }
  
}