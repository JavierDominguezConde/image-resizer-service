# Resizer Service

This project contains a project that allows a user to resize images to specific sizes and store them in an structured format. The project is implemented in NodeJS with Express, and uses Sharp as the library to handle the image operations.

## Functionality

- Create tasks to resize images.
- Use local images or links to an image from the internet.
- The task are handled asynchronously.
- Check the status of the tasks at any time.
- The tasks have their status updated as they are processed.
- Has support for `jpg` and `png` images.

## Ecosystem

This monorepo is made up of two main pieces:

- The REST service handles the user requests to create new tasks or check the status of existing ones (see [OpenAPI](./api/openapi.yaml)).
- The Consumer/Processor performs the processing of the tasks and updates the entries in the database accordingly.

When a new task is created, the REST service notifies the processor through a queue in a message broker. This way the processor can handle the tasks at its own pace, without slowing down down the service that handles the user requests. If needed, the processor could be scaled up horizontally, adding more replicas, to parallelize the workload. Or if the user requests are to many for a single REST server, that one could be scaled as well independently from the processor.

## Development framework

This project uses the following tools:

- `Node v24` with direct `Typescript` execution (no transpiling libraries needed, it uses Node's default) and EcmaScript Modules.
- `Sharp` as the tool used to perform the resizing operations on the images.
- `Express` as the REST framework.
- `Kafka` for the message broker and `Confluent's Javascript Adapter`.
- `Mongoose` on top of `MongoDB` as the database.
- `Jest` for testing using the experimental Typescript + ESM support.
- `Docker` for lightweight virtualization of the whole infrastructure.

## Local setup

To launch the project in a local environment, a docker-compose file is provided. It contains all the tools that are needed to execute the services. The command to launch the compose is the following:

```bash
docker compose up -d
```

This will start both the REST service (port 3002 by default) and the consumer/processor. It will also launch an instance of mongo for the persistance and a kafka cluster to be used as the message broker. A web visualizer for the broker queues is also included in case it is needed for testing/debugging, exposed at port 8080.

> **Note**: By default, the services startup wait for the broker to be already started, but due to race condition, depending on your machine they could get stuck at startup. To solve this problem, just retart both the service and the consumer by executing `docker compose restart rest processor`.

Once you are finished with the service, to stop it simple execute: 

```bash
docker compose down -v
```

This setup has multiple volumes from the repository mounted in the containers, for configuration and persistance.

- The `data` folder (top level of the repository) will store all the images that the processor will be able to see and process. This also helps when you want to visualize whether the service is working correctly or not. On startup this folder will be created if it does not eist already.
- The `app` folder (top level of the repository) is mounted in the services to avoid having to recreate the Docker images if you make a change in your code. This does not affect the dependencies, if any change is made in those, then it is required to recreate the image for those changes to take effect.
- The `docker/db/init.js` is mounted on the mongo database to execute at startup, so we can have an initial set of data to query in the service.
- The `docker/env/app.env` is not mounted as such, but is used instead as environment variables for the services.
