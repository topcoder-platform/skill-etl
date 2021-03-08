#!/bin/bash
set -eo pipefail

# Builds Docker image of Community App application.
# This script expects a single argument: NODE_CONFIG_ENV, which must be either
# "development" or "production".
# Builds Docker image of the app.
TAG="skills-etl:latest"

docker build -t $TAG \
  --build-arg INFORMIX_HOST=$INFORMIX_HOST \
  --build-arg INFORMIX_PORT=$INFORMIX_PORT \
  --build-arg INFORMIX_USER=$INFORMIX_USER \
  --build-arg INFORMIX_PASSWORD=$INFORMIX_PASSWORD \
  --build-arg INFORMIX_DATABASE=$INFORMIX_DATABASE \
  --build-arg INFORMIX_SERVER=$INFORMIX_SERVER \
  --build-arg MINPOOL=$MINPOOL \
  --build-arg MAXPOOL=$MAXPOOL \
  --build-arg MAXSIZE=$MAXSIZE \
  --build-arg IDLETIMEOUT=$IDLETIMEOUT \
  --build-arg TIMEOUT=$TIMEOUT \
  --build-arg DYNAMODB_ENDPOINT=$DYNAMODB_ENDPOINT \
  --build-arg MAX_DAYS_FOR_CHALLENGE_SKILLS=$MAX_DAYS_FOR_CHALLENGE_SKILLS \
  --build-arg TAGS_API_V3=$API_TAGS_API_V3 .
  
# Copies "node_modules" from the created image, if necessary for caching.
docker create --name app $TAG

if [ -d node_modules ]
then
  # If "node_modules" directory already exists, we should compare
  # "package-lock.json" from the code and from the container to decide,
  # whether we need to re-cache, and thus to copy "node_modules" from
  # the Docker container.
  mv package-lock.json old-package-lock.json
  docker cp app:/app/package-lock.json package-lock.json
  set +eo pipefail
  UPDATE_CACHE=$(cmp package-lock.json old-package-lock.json)
  set -eo pipefail
else
  # If "node_modules" does not exist, then cache must be created.
  UPDATE_CACHE=1
fi

if [ "$UPDATE_CACHE" == 1 ]
then
  docker cp app:/app/node_modules .
fi