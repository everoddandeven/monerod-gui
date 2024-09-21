export class GeneratedBlocks {
    public readonly blocks: string[];
    public readonly height: number;
    public readonly status: string;
    public readonly untrusted: boolean;

    constructor(blocks: string[], height: number, status: string, untrusted: boolean) {
        this.blocks = blocks;
        this.height = height;
        this.status = status;
        this.untrusted = untrusted;
    }

    public static parse(generatedBlocks: any): GeneratedBlocks {
        const blocks: string[] = generatedBlocks.blocks;
        const height: number = generatedBlocks.height;
        const status: string = generatedBlocks.status;
        const untrusted: boolean = generatedBlocks.untrusted;

        return new GeneratedBlocks(blocks, height, status, untrusted);
    }
}