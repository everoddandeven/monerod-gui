export class SimpleBootstrapCard {
    public header: string;
    public content: string;
    public loading: boolean;
  
    constructor(header: string, content: string, loading: boolean = false) {
      this.header = header;
      this.content = content;
      this.loading = loading;
    }
}
