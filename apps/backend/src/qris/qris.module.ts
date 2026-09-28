import { Global, Module } from '@nestjs/common';
import { QrisService } from './qris.service.js';

@Global()
@Module({
  providers: [QrisService],
  exports: [QrisService],
})
export class QrisModule {}
