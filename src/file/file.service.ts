import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const ALLOWED_EXTENSION = /^\.[a-z0-9]{1,8}$/i;

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    if (file.startsWith('/')) {
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      file = path.resolve(process.cwd(), file);

      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    }
  }

  async saveFile(requestedName: string, content: string | Buffer) {
    const extension = this.getSafeExtension(requestedName);
    const target = path.join(UPLOADS_DIR, `${crypto.randomUUID()}${extension}`);

    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(target, content, { flag: 'wx' });

    this.logger.log(`Stored uploaded file: ${target}`);

    return path.relative(process.cwd(), target);
  }

  private getSafeExtension(requestedName: string): string {
    if (typeof requestedName !== 'string' || !requestedName.length) {
      throw new BadRequestException("Invalid parameter 'path'");
    }

    const extension = path.extname(path.basename(requestedName));

    if (extension && !ALLOWED_EXTENSION.test(extension)) {
      throw new BadRequestException("Invalid parameter 'path'");
    }

    return extension.toLowerCase();
  }

  async deleteFile(file: string): Promise<boolean> {
    if (file.startsWith('/')) {
      throw new Error('cannot delete file from this location');
    } else if (file.startsWith('http')) {
      throw new Error('cannot delete file from this location');
    } else {
      file = path.resolve(process.cwd(), file);
      await fs.promises.unlink(file);
      return true;
    }
  }
}
