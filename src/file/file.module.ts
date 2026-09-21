import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HttpClientModule } from '../httpclient/httpclient.module';
import { UsersModule } from '../users/users.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [UsersModule, HttpClientModule, AuthModule],
  controllers: [FileController],
  providers: [FileService]
})
export class FileModule {}
