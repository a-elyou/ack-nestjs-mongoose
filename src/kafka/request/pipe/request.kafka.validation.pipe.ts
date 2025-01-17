import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { Debugger } from 'src/debugger/debugger.decorator';
import { Logger as DebuggerService } from 'winston';
import { plainToInstance } from 'class-transformer';
import { RpcException } from '@nestjs/microservices';
import { ENUM_KAFKA_REQUEST_STATUS_CODE_ERROR } from '../kafka.request.constant';

export class RequestKafkaValidationPipe implements PipeTransform {
    constructor(
        @Debugger() private readonly debuggerService: DebuggerService
    ) {}

    async transform(
        value: Record<string, any>,
        { metatype }: ArgumentMetadata
    ): Promise<Record<string, any>> {
        const metatypeObject = metatype as Record<string, any>;
        const validation = metatypeObject.value;
        if (!validation || !this.toValidate(validation)) {
            return value;
        }

        const request: Record<string, any> = plainToInstance(
            validation,
            value.value
        );
        this.debuggerService.info('Request Kafka Data', {
            class: 'RequestKafkaValidationPipe',
            function: 'transform',
            request: request
        });

        const rawErrors: Record<string, any>[] = await validate(request);
        if (rawErrors.length > 0) {
            this.debuggerService.error('Request Kafka Errors', {
                class: 'RequestKafkaValidationPipe',
                function: 'transform',
                errors: rawErrors
            });

            throw new RpcException({
                statusCode:
                    ENUM_KAFKA_REQUEST_STATUS_CODE_ERROR.KAFKA_REQUEST_VALIDATION_ERROR,
                message: 'http.clientError.unprocessableEntity',
                errors: rawErrors
            });
        }
        return value;
    }

    private toValidate(metatype: Record<string, any>): boolean {
        const types: Record<string, any>[] = [];
        return types.includes(metatype);
    }
}
