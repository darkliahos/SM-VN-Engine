declare module 'yazl' {
  interface ZipFileEntryOptions {
    /** false stores the entry uncompressed. */
    compress?: boolean;
    compressionLevel?: number;
    mtime?: Date;
    mode?: number;
    forceDosTimestamp?: boolean;
  }

  interface ZipFileEndOptions {
    forceZip64Format?: boolean;
  }

  export class ZipFile {
    readonly outputStream: NodeJS.WritableStream;
    addBuffer(buffer: Buffer, metadataPath: string, options?: ZipFileEntryOptions): void;
    addFile(realPath: string, metadataPath: string, options?: ZipFileEntryOptions): void;
    addDirectory(metadataPath: string, options?: ZipFileEntryOptions): void;
    end(options?: ZipFileEndOptions, finalSizeCallback?: (size: number) => void): void;
  }
}