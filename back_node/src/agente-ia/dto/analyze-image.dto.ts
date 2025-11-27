export class AnalyzeImageDto {
  imageBase64: string;
  fileName?: string;
  context?: string;

  constructor(imageBase64: string, fileName?: string, context?: string) {
    this.imageBase64 = imageBase64;
    this.fileName = fileName;
    this.context = context;
  }
}
