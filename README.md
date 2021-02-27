# Topcoder Skills ETL tool

## Prerequisites

1. NodeJs 14
2. Docker
3. JDK 1.8

## Setting up the dev environment

It's recommended to use docker to run the demo Informix and DynamoDB instances, which also create the required databases
and tables.

Run the following command to start the databases in docker:

Note: Since dynamodb connection uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, you should set them. Your local instance or your docker based instance, either will then use the same user for connecting.

```
docker-compose -f local/db-docker-compose.yaml up -d
```

Beside Informix and DynamoDB local, the above command will also create a container to initialize the DynamoDB:

1. Create three tables: `MemberEnteredSkills`, `Externals.Stackoverflow`, and `MemberAggregatedSkills`.
2. Insert sample data into the `MemberEnteredSkills` and `Externals.Stackoverflow` tables.

Before moving on to the next step, you should run `docker-compose -f local/db-docker-compose.yaml ps` to verify the exit
code for that container is 0, which means DynamoDB is initialized successfully.

## Deploy etl tool locally

1. Install NPM dependencies

```
npm install
```

2. Initialize DynamoDB (again), because for some reason the tables created by the docker container was only visible to
   other containers.

```
node scripts/init-dynamodb.js
```

3. Run the ETL tool

```
node index.js
```

4. List the results

```
node scripts/list-aggregated-skills.js
```

## Deploy etl tool in docker

1. Run the ETL tool in docker (note we are using a different docker-compose file)

```
docker-compose -f local/etl-docker-compose.yaml up etl-app
```

2. List the results

```
docker-compose -f local/etl-docker-compose.yaml up list-results
```

Note: You may see a warning about orphan containers, and you can ignore them. They are the database containers started
with another docker-compose file.

If you want to run the etl tool without `docker-compose`, assuming the database containers are started
with `docker-compose -f local/db-docker-compose.yaml up -d` and connected to the `local_default` network:

```
# 1. build the docker image
docker build -t topcoder-skills-etl:latest .
# 2. run etl
docker run -it --network local_default \
 -e INFORMIX_HOST=informix \
 -e DYNAMODB_ENDPOINT=http://dynamo:8000 \
 -e AWS_ACCESS_KEY_ID=fake_access_key_id \
 -e AWS_SECRET_ACCESS_KEY=fake_secret_access_key \
 topcoder-skills-etl:latest /app/index.js
# 3. list results
docker run -it --network local_default \
 -e INFORMIX_HOST=informix \
 -e DYNAMODB_ENDPOINT=http://dynamo:8000 \
 -e AWS_ACCESS_KEY_ID=fake_access_key_id \
 -e AWS_SECRET_ACCESS_KEY=fake_secret_access_key \
 topcoder-skills-etl:latest /app/scripts/list-aggregated-skills.js
```

## Running lint

```
npm run lint
npm run lint:fix
```

## Environment Variables

- `LOG_LEVEL` - log level, default: `debug`

- `INFORMIX_HOST` - hostname for informix database: default: `localhost`
- `INFORMIX_PORT` - port number for informix database, default: `9088`
- `INFORMIX_USER` - informix database username, default: `informix`
- `INFORMIX_PASSWORD` - informix database password, default: `in4mix`
- `INFORMIX_DATABASE` - informix database name, default: `tcs_dw`
- `INFORMIX_SERVER` - added by sushil : default :`informix`
- `MINPOOL` - min pool size, default: `1`
- `MAXPOOL` - max pool size, default: `60`
- `MAXSIZE` - max active connection number, default: `0` (unlimited)
- `IDLETIMEOUT` - connection idle time in seconds, default: `3600`
- `TIMEOUT` - connection timeout in seconds, default: `30000`

- `DYNAMODB_ENDPOINT` - dynamodb endpoint, default: `http://localhost:8000`
- `AWS_REGION` - aws region, default: `fake-region`
- `AWS_ACCESS_KEY_ID` - aws access key id.
- `AWS_SECRET_ACCESS_KEY` - aws secret access key.
- `S3_BUCKET` - s3 bucket of tags map file, default: `skills-etl`
- `S3_TAGS_MAP_KEY` - s3 key of tags map file, default: `tagsMap.txt`
- `MAX_DAYS_FOR_CHALLENGE_SKILLS` - max days in the past to query for the challenge skills, default: `2`

## Implementation Note [confirmed in Forum](https://discussions.topcoder.com/discussion/2638/approach-confirmation)

The hadoop app loads and transforms three sources of data into one aggregated table. It seems all three sources are treated equally, and we are basically rewriting it into a single nodejs app, which may not work well with a larger dataset.

The requirement to only extract skills from no more than two days ago may help with this situation. The problem is, the other two sources do not have a timestamp limit.

In this implementation, the etl tool first load the skills from Informix, then query the other DynamoDB tables to update the skills. Possible drawback is the app essentially will miss skills that exist in the DynamoDB tables but not in Informix.
