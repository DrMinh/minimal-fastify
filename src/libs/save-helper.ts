import https from 'https';
import sharp from 'sharp';
import fs from 'fs/promises';

export class SaveHelper {

  static async fetchAndSave(
    url: string,
    savePath: string,
    filename: string,
    typeFilter: string,
    allowExtensions: string[] = ['png', 'jpeg', 'jpg', 'webp']
  ) {
    let res: Response;

    try {
      res = await fetch(url, {
        method: 'GET',
        // Node fetch uses system TLS by default (rejectUnauthorized = true)
        // To customize, you'd need a custom dispatcher (undici), but default is already safe
      });
    } catch (e) {
      console.log(e);
      throw 'Can not fetch file: ' + url;
    }

    if (!res.ok) {
      throw `Request failed: ${res.status} ${res.statusText}`;
    }

    const contentType = res.headers.get('content-type') || '';

    if (
      !res ||
      (typeFilter.length > 0 && !contentType.startsWith(typeFilter))
    ) {
      console.log('content type', contentType);
      throw 'Can not fetch file: ' + url;
    }

    // Convert to buffer
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sharpImage = sharp(buffer, { failOn: 'none' });
    const imageMeta = await sharpImage.metadata();

    const extFrame = allowExtensions.includes(imageMeta.format || '')
      ? imageMeta.format
      : allowExtensions[0];

    const filePath = `${savePath}/${filename}.${extFrame}`;

    // Ensure directory exists
    await fs.mkdir(savePath, { recursive: true });

    await sharpImage.rotate().toFile(filePath);

    return filePath;
  }
}