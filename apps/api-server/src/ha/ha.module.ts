import { Module } from '@nestjs/common';
import { HaService } from './ha.service';
import { HostModule } from '@host';
import { CmsHttpsClientModule } from '@cms-https-client/cms-https-client.module';
import { HaController } from './ha.controller';

@Module({
  imports: [HostModule, CmsHttpsClientModule],
  controllers: [HaController],
  providers: [HaService],
  exports: [HaService],
})
export class HaModule {}