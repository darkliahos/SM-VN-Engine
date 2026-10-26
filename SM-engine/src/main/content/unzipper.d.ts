declare module 'unzipper' {
  import { Readable } from 'stream';

  /** One central directory record, as parsed by unzipper. */
  export interface UnzipperEntry {
    path: string;
    type: 'File' | 'Directory';
    /** General purpose bit flag. Bit 0 is the encryption bit, bit 11 is UTF-8 names. */
    flags: number;
    compressionMethod: number;
    crc32: number;
    compressedSize: number;
    uncompressedSize: number;
    isUnicode?: boolean;
    /** Throws MISSING_PASSWORD / BAD_PASSWORD for encrypted entries. */
    stream(password?: string): Readable;
    buffer(password?: string): NodeJS.ReadableStream;
  }

  export interface UnzipperDirectory {
    files: UnzipperEntry[];
    comment?: string;
    extract(opts: { path: string; password?: string }): Promise<number>;
  }

  export interface UnzipperOpenOptions {
    password?: string;
    tailSize?: number;
  }

  export const Open: {
    file(filename: string, options?: UnzipperOpenOptions): Promise<UnzipperDirectory>;
    buffer(buffer: Buffer, options?: UnzipperOpenOptions): Promise<UnzipperDirectory>;
  };
}
