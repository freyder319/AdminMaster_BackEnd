export class TempImageDto {
  imageData: string;
  sessionId: string;
  fileName?: string;

  constructor(imageData: string, sessionId: string, fileName?: string) {
    this.imageData = imageData;
    this.sessionId = sessionId;
    this.fileName = fileName;
  }
}
