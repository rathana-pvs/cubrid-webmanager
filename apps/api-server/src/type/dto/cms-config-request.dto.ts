import { IsArray, IsString } from 'class-validator';

/**
 * Validated request body for CmsConfigController's broker-set-param
 * endpoint. Mirrors BrokerSetParamClientRequest (libs/api-interfaces).
 *
 * @category DTOs
 * @since 1.0.0
 */
export class BrokerSetParamDto {
  @IsArray()
  @IsString({ each: true })
  confdata: string[];
}
