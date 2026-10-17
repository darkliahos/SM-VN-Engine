import { ImageFormatType } from '../enums';

export const SUPPORTED_PACK_FORMAT_VERSION = 1;

export interface EncryptionMetadata {
  Algorithm: string;
  Kdf: string;
  Iterations: number;
  Salt: string;
  Verifier: string;
}

export interface Metadata {
  Title: string;
  TitleScreenImageName: string;
  Author: string;
  Version: string;
  DateGenerated: Date;
  VersionHash: string;
  StartFile: string;
  ScenarioExtension: string;
  PictureFormatType: ImageFormatType;
  PackFormatVersion?: number;
  Password?: string;
  Encryption?: EncryptionMetadata;
}

/**
 * The major component of PackFormatVersion. A pack whose major version exceeds
 * what this engine supports is rejected rather than loaded on a guess.
 */
export function packFormatMajor(version: number | undefined): number {
  if (version === undefined || version === null || Number.isNaN(version)) {
    return 0;
  }
  return Math.trunc(version);
}

export function isPackFormatSupported(metadata: Metadata): boolean {
  return packFormatMajor(metadata.PackFormatVersion) <= SUPPORTED_PACK_FORMAT_VERSION;
}
