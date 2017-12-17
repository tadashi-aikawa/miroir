#!/bin/bash

function usage_exit() {
    echo "Usage: `basename $0` -b <BUCKET_NAME> -t <TABLE_NAME>" 1>&2
    echo "Ex: `basename $0` -b mamansoft-miroir -t miroir"
    exit 1
}

while getopts b:t:h opt
do
    case $opt in
        b) BUCKET=$OPTARG
            ;;
        t) TABLE=$OPTARG
            ;;
        *) usage_exit
            ;;
    esac
done

[ -z $BUCKET ] || [ -z $TABLE ] && usage_exit

echo "Create a bucket -> ${BUCKET}"
aws s3 mb s3://${BUCKET}/
cat > cors.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF
aws s3api put-bucket-cors \
      --bucket ${BUCKET} \
      --cors-configuration file://cors.json
rm -rf cors.json

echo "Create a table -> ${TABLE}"
aws dynamodb create-table \
    --table-name ${TABLE} \
    --attribute-definitions AttributeName=hashkey,AttributeType=S \
    --key-schema AttributeName=hashkey,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

