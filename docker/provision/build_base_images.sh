#!/bin/bash

###########################################
#
# This script is used to dynamically build all Docker Images for a project
#  compose/provision/build.sh <aws profile name> <build plan name> 
#  This script must be run at the root of a project plan directory
#
###########################################

set -e

# echo "Logging into the ECR"
$(aws ecr get-login --region us-east-2)

echo "--------------------------------------"
echo "Removing old images"
echo "--------------------------------------"

     docker rm -vf $(docker ps -a -q) 2>/dev/null || echo "No more containers to remove."
     docker images -q -f "label=methodfitness=child" | while read -r image; do docker rmi -f $image; done;
     docker images -q -f "label=methodfitness=base4" | while read -r image; do docker rmi -f $image; done;
     docker images -q -f "label=methodfitness=base3" | while read -r image; do docker rmi -f $image; done;
     docker images -q -f "label=methodfitness=base2" | while read -r image; do docker rmi -f $image; done;

echo "--------------------------------------"
echo "building and pushing the base images"
echo "--------------------------------------"
         cd ../base_mf_node && docker build --no-cache -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_node:latest -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_node:$(git show -s --format=%h) .
         docker push 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_node
         cd ../base_mf_firstparty && docker build --no-cache -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_firstparty:latest -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_firstparty:$(git show -s --format=%h) .
         docker push 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_firstparty
         cd ../base_mf_thirdparty && docker build --no-cache -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_thirdparty:latest -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_thirdparty:$(git show -s --format=%h) .
         docker push 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_thirdparty
         cd ../base_mf_frontend && docker build --no-cache -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_frontend:latest -t 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_frontend:$(git show -s --format=%h) .
         docker push 709865789463.dkr.ecr.us-east-2.amazonaws.com/base_mf_frontend

echo "--------------------------------------"
echo "Build stage complete"
echo "--------------------------------------"
