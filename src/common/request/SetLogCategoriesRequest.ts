import { RPCRequest } from "./RPCRequest";

export class SetLogCategoriesRequest extends RPCRequest {
  public override readonly method: 'set_log_categories' = 'set_log_categories';
  public override readonly restricted: true = true;

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