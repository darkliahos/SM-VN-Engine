export enum ImageFormatType {
  Bitmap = 0,
  JPEG = 1,
  PNG = 2,
}

export function imageFormatToExtension(format: ImageFormatType): string {
  switch (format) {
    case ImageFormatType.Bitmap:
      return 'bmp';
    case ImageFormatType.JPEG:
      return 'jpg';
    case ImageFormatType.PNG:
      return 'png';
    default:
      return 'png';
  }
}
