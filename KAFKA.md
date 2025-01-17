# Kafka Documentation

Kafka documentation is optional and just in case if we want to use kafka.

## Prerequisites

Alright, we need to know some knowledge before next section.

* Follow [README](README.md) Documentation.
* Understood [Kafka Fundamental](kafka-url). It will help we to know how kafka works and why we need kafka in real project.

As we mention in `Readme` at section `Features`, we can switch kafka on/of. We just need change value `KAFKA_ACTIVE` in `.env` file. This useful when you don't need kafka anymore after implementation.

```env
...
...

AUTH_BASIC_TOKEN_CLIENT_SECRET=1234567890

KAFKA_ACTIVE=true // <<<<----- change this
KAFKA_CONSUMER_GROUP=nestjs.ack
KAFKA_BROKERS=localhost:9092

AWS_CREDENTIAL_KEY=awskey12345

...
...
...
```
## Build With

Main packages and Main Tools

* [NestJs-Microservice](nestjs-microservice-url) v8.2.4
* [KafkaJs](kafka-js-url) v1.15.0
* [Kafka](kafka-url) v3.0.0

## Getting start

We need to install [Kafka Apache](kafka-url) before we start. See their official document.

> NOTE : For Windows User, **do not install kafka on your Windows OS**. There are has a unsolved issue, while delete topic on Windows OS. [See this issue for more information](kafka-issue)
> Go install kafka with virtual machine or docker.

#### Make sure we don't get any error after installation

    ```sh
    kafka-topics --version

    # will return 
    # 3.0.0 (Commit:8cb0a5e9d3441962
    ```

#### Installation

1. Install dependencies `@nestjs/microservices` and `kafkajs`.

    ```sh
    yarn add @nestjs/microservices kafkajs
    ```

    Or with npm

    ```sh
    npm i @nestjs/microservices kafkajs
    ```

2. Our environment will be a little different. We will use `.env.kafka`

    ```sh
    cp .env.kafka .env
    ```

    and then we need to adjust with our env

    ```env
    APP_ENV=development
    APP_HOST=localhost
    APP_PORT= 3000
    APP_LANGUAGE=en
    APP_DEBUG=false
    APP_TZ=Asia/Jakarta

    DATABASE_HOST=localhost:27017
    DATABASE_NAME=ack
    DATABASE_USER=
    DATABASE_PASSWORD=
    DATABASE_ADMIN=false
    DATABASE_SRV=false
    DATABASE_DEBUG=false
    DATABASE_SSL=false
    DATABASE_OPTIONS=

    AUTH_JWT_ACCESS_TOKEN_SECRET_KEY=123456

    AUTH_JWT_REFRESH_TOKEN_SECRET_KEY=01001231

    AUTH_BASIC_TOKEN_CLIENT_ID=asdzxc
    AUTH_BASIC_TOKEN_CLIENT_SECRET=1234567890

    KAFKA_ACTIVE=true
    KAFKA_CONSUMER_GROUP=nestjs.ack
    KAFKA_BROKERS=localhost:9092

    AWS_CREDENTIAL_KEY=awskey12345
    AWS_CREDENTIAL_SECRET=awssecret12345
    AWS_S3_REGION=us-east-2
    AWS_S3_BUCKET=acks3
    ```

3. In `src/main.ts`, Add This Code below `app.listenAsync(port, host)`.

    ```ts
    // src/main.ts

    ...
    ...
    ...

    const env: string = configService.get<string>('app.env');

    await app.listenAsync(port, host);
    
    const kafkaActive: boolean = configService.get<boolean>('kafka.active');
    if (kafkaActive && env !== 'testing') {
         await kafka(app, configService, logger);
    }

    ...
    ...
    ...

    ```

4. In `src/app/app.module.ts`, we need to import `KafkaAdminModule`, `KafkaProducerModule`, `KafkaConsumerModule`.

    - `KafkaAdminModule` use to create custom kafka topics.
    - `KafkaProducerModule` use to produce message to some topic
    - `KafkaConsumerModule` consume for topics.

        ```ts
        // src/app/app.module.ts

        ...
        ...
        ...

        import { KafkaAdminModule } from 'src/kafka/admin/kafka.admin.module';
        import { KafkaProducerModule } from 'src/kafka/producer/producer.module';
        import { KafkaConsumerModule } from 'src/kafka/consumer/consumer.module';

        @Module({
        controllers: [AppController],
        providers: [],
        imports: [
            ...
            ...
            ...

            
            SeedsModule.register({ env: process.env.APP_ENV }),
            KafkaAdminModule.register({
                env: process.env.APP_ENV,
                active: process.env.KAFKA_ACTIVE === 'true' || false
            }),
            KafkaConsumerModule.register({
                env: process.env.APP_ENV,
                active: process.env.KAFKA_ACTIVE === 'true' || false
            }),
            KafkaProducerModule.register({
                env: process.env.APP_ENV,
                active: process.env.KAFKA_ACTIVE === 'true' || false
            }),

            AuthModule,
            UserModule,

            ...
            ...
            ...
        ]
        })
        export class AppModule {}

        ```

5. `Partition` default value is 3 or we can set Partition in config file `src/config/kafka.config.ts`, and `Replication Factor` default value is `count of our brokers`.

    ```ts
    // src/config/kafka.config.ts

    import { registerAs } from '@nestjs/config';

    export default registerAs(
        'kafka',
        (): Record<string, any> => ({
            brokers: process.env.KAFKA_BROKERS
                ? process.env.KAFKA_BROKERS.split(',')
                : ['localhost:9092'],
            consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'nestjs.ack',
            clientId: 'KAFKA_ACK_CLIENT_ID',

            admin: {
                clientId: 'KAFKA_ADMIN_ACK_CLIENT_ID',
                defaultPartition: 3 // <<<---- change this value
            }
        })
    );

    ```

    Add `KafkaConfig` into into `src/config/index.ts`

    ```ts
    // src/config/index.ts

    import AppConfig from 'src/config/app.config';
    import AuthConfig from 'src/config/auth.config';
    import DatabaseConfig from 'src/config/database.config';
    import HelperConfig from 'src/config/helper.config';
    import MiddlewareConfig from 'src/config/middleware.config';
    import AwsConfig from 'src/config/aws.config';
    import KafkaConfig from 'src/config/kafka.config';
    import UserConfig from './user.config';

    export default [
        AppConfig,
        AuthConfig,
        DatabaseConfig,
        HelperConfig,
        MiddlewareConfig,
        AwsConfig,
        KafkaConfig, // <<<---- add this config
        UserConfig
    ];
    ```

6. Make sure our topics was created or we can use auto create topics with `KafkaAdminModule`.

    ```ts
    // src/kafka/kafka.constant.ts

    export const KAFKA_TOPICS = [
        'nestjs.ack.success', // <<<---- Add for auto create topics
        'nestjs.ack.error'
    ]; 

    ```

7. After all configuration, we need to test. We can test `KafkaProducerModule` and `KafkaConsumerModule` with manual hit `/kafka/produce` endpoint. [see this instruction](ack-endpoint-url).

#### Run project

Run project with yarn

```sh
yarn start:dev
```

Or run project with npm

```sh
npm run start:dev
```


#### Run with Docker ---- \*\*\*\* Read Carefully \*\*\*\*

This Instruction will little bit difference.

> `docker-compose.yml` FILE WILL DIFFERENT BETWEEN `kafka` and `non kafka`. The file will put in `docker/docker-compose.kafka.yml`

1. Before we start, we need to install `docker` and `docker compose`.

    - Docker official Documentation, [here](docker-url)
    - Docker Compose official Documentation, [here](docker-compose-url)

2. Check `docker` is running or not

    ```sh
    docker --version

    # will return 
    # Docker version 20.10.12, build e91ed5707e
    ```

    and check `docker-compose`

    ```sh

    # will return
    # docker-compose version 1.27.4, build 40524192
    ```

3. We will use `.env.docker` and combine with `.env.kafka`

    ```env
    APP_ENV=development
    APP_HOST=0.0.0.0
    APP_PORT= 3000
    APP_LANGUAGE=en
    APP_DEBUG=false
    APP_TZ=Asia/Jakarta

    DATABASE_HOST=mongodb:27017
    DATABASE_NAME=ack
    DATABASE_USER=root
    DATABASE_PASSWORD=123456
    DATABASE_ADMIN=true
    DATABASE_SRV=false
    DATABASE_DEBUG=false
    DATABASE_SSL=false
    DATABASE_OPTIONS=

    AUTH_JWT_ACCESS_TOKEN_SECRET_KEY=123456

    AUTH_JWT_REFRESH_TOKEN_SECRET_KEY=01001231

    AUTH_BASIC_TOKEN_CLIENT_ID=asdzxc
    AUTH_BASIC_TOKEN_CLIENT_SECRET=1234567890

    KAFKA_ACTIVE=true
    KAFKA_CONSUMER_GROUP=nestjs.ack
    KAFKA_BROKERS=kafka:9092

    AWS_CREDENTIAL_KEY=awskey12345
    AWS_CREDENTIAL_SECRET=awssecret12345
    AWS_S3_REGION=us-east-2
    AWS_S3_BUCKET=acks3
    ```

4. Run docker compose

    ```sh
    docker-compose -f docker/docker-compose.kafka.yml up -d
    ```

## OPTIONAL, if we want delete kafka

1. Delete `kafka folder` in `src/kafka`

2. Delete `kafka config` in `src/config/kafka.config.ts`,

3. Remove kafka config in `src/config/index.ts`.

```ts
// src/config/index.ts

import AppConfig from 'src/config/app.config';
import AuthConfig from 'src/config/auth.config';
import DatabaseConfig from 'src/config/database.config';
import HelperConfig from 'src/config/helper.config';
import MiddlewareConfig from 'src/config/middleware.config';
import AwsConfig from 'src/config/aws.config';
import UserConfig from './user.config';

export default [
    AppConfig,
    AuthConfig,
    DatabaseConfig,
    HelperConfig,
    MiddlewareConfig,
    AwsConfig,
    UserConfig
];
```

4. Remove dependencies `@nestjs/microservices` and `kafkajs`.

```sh
yarn remove @nestjs/microservices kafkajs
```

Or remove with npm

```sh
npm uninstall @nestjs/microservices kafkajs
```


[ack-endpoint-url]: https://github.com/andrechristikan/ack-nestjs-mongoose#endpoints
[nestjs-microservice-url]: https://docs.nestjs.com/microservices/kafka
[kafka-js-url]: https://kafka.js.org/docs/getting-started
[kafka-url]: https://kafka.apache.org/quickstart
[kafka-issue]: https://issues.apache.org/jira/browse/KAFKA-1194