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

This will start both the REST service (port 3002 by default) and the consumer/processor. It will also launch an instance of mongo for the persistance and a kafka cluster to be used as the message broker. A web visualizer for the broker queues is also included in case it is needed for testing/debugging, exposed at port 8080, and a file storage visualizer in port 8081 to manage the image files inside the service.

Once you are finished with the service, to stop it simple execute: 

```bash
docker compose down -v
```

This setup has multiple volumes from the repository mounted in the containers, for configuration and persistance.

- The `app` folder (top level of the repository) is mounted in the services to avoid having to recreate the Docker images if you make a change in your code. This does not affect the dependencies, if any change is made in those, then it is required to recreate the image for those changes to take effect.
- The `docker/db/init.js` is mounted on the mongo database to execute at startup, so we can have an initial set of data to query in the service.
- The `docker/env/app.env` is not mounted as such, but is used instead as environment variables for the services.

## Example of usage

Once the service has been correctly configured (see [Local setup](#local-setup)), to use it, just make a request to the service running in port 3002 of your machine with the following command:
```bash
curl --location 'localhost:3002/tasks' \
--header 'Content-Type: application/json' \
--data '{
    "url": "https://picsum.photos/1920/1080"
}'
```
This will create a new task to download and resize the indicated image, and return a result with the summary of the task.

```json
{
  "taskId":"ffc39eed-d3d2-4826-920f-ce7858a1078a",
  "status":"pending",
  "price":48.9
}
```

If we then want to find if the state of the task, we simply execute:

```bash
curl --location 'localhost:3002/tasks/ffc39eed-d3d2-4826-920f-ce7858a1078a'
```

Where the task id contained in the url is the same returnes in the response when we created the taks in the fit place. If the task is stil pending, the response will be the same as before, otherwise, we will receive something like this:

```json
{
  "taskId":"ffc39eed-d3d2-4826-920f-ce7858a1078a",
  "status":"completed",
  "price":48.9,
  "images":[
    {
      "resolution":"original",
      "path":"/output/355-1920x1080/original/c9a0e0b416fae45f2593aeed472be3f0.jpg"
    },
    {
      "resolution":"1024",
      "path":"/output/355-1920x1080/1024/823cf8f705349f3667014cab3fe4ec8e.jpg"
    },
    {
      "resolution":"800",
      "path":"/output/355-1920x1080/800/948938cf7c8a3fee358128350a4d2a76.jpg"
    }
  ]
}
```

You can check the complete API specification in the [OpenAPI spec](./api/openapi.yaml).

## Architecture design

This repository has been design in the form of a monorepo, a group of services than can be considered as inter-dependent to achieve a big goal, but that each have a unique and specific function, while some of them sharing some common tools. To simplify the construction and deployment of this monorepo, a single docker image will be constructed, containing all the code of the services that form the monorepo, and the command invoked when starting a container with the image will determine the specific service that will run.

This is why the part of repository containing the actual code (the [app](./app) folder) contains three folders:
- The rest folder contains the code that will be used exclusively by that service.
- The processor folder also contains its own code, independent from the rest one.
- The core folder contains code that is currently being used by both the rest service and de processor/consumer. It also contains some code that could reasonably be used by other related services if they were to be added to the monorepo.
