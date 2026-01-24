#!/bin/bash

# Fetch OCI details and store them in cloud_context.json

echo "Fetching OCI Tenancy details..."
TENANCY_ID=$(grep tenancy ~/.oci/config | cut -d '=' -f 2 | tr -d ' ')
REGION=$(grep region ~/.oci/config | cut -d '=' -f 2 | tr -d ' ')

if [ -z "$TENANCY_ID" ]; then
    echo "Error: Tenancy ID not found in ~/.oci/config"
    exit 1
fi

echo "Tenancy ID: $TENANCY_ID"
echo "Region: $REGION"

# Try to fetch compartments
COMPARTMENTS=$(oci iam compartment list --all --compartment-id-in-subtree true --access-level ACCESSIBLE --query "data[*].{Name:name, OCID:id}" --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Warning: Failed to fetch compartments. Using Tenancy ID as root compartment."
    COMPARTMENTS="[{\"Name\": \"Root\", \"OCID\": \"$TENANCY_ID\"}]"
fi

# Fetch active instances
INSTANCES=$(oci compute instance list --compartment-id "$TENANCY_ID" --lifecycle-state RUNNING --query "data[*].{Name:\"display-name\", IP:\"public-ip\"}" --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Warning: Failed to fetch instances."
    INSTANCES="[]"
fi

# Create JSON output
cat <<EOF > cloud_context.json
{
  "tenancy_ocid": "$TENANCY_ID",
  "region": "$REGION",
  "compartments": ${COMPARTMENTS:-[]},
  "active_instances": ${INSTANCES:-[]},
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "Cloud details saved to cloud_context.json"
