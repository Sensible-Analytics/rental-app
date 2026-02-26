provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

resource "oci_core_vcn" "mre_vcn" {
  compartment_id = var.compartment_ocid
  cidr_block     = "10.0.0.0/16"
  display_name   = "mre_vcn"
  dns_label      = "mrevcn"
}

resource "oci_core_subnet" "mre_subnet" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.mre_vcn.id
  cidr_block     = "10.0.1.0/24"
  display_name   = "mre_subnet"
  dns_label      = "mresubnet"
  route_table_id = oci_core_vcn.mre_vcn.default_route_table_id
}

resource "oci_core_default_route_table" "mre_route_table" {
  manage_default_resource_id = oci_core_vcn.mre_vcn.default_route_table_id
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.mre_internet_gateway.id
  }
}

resource "oci_core_internet_gateway" "mre_internet_gateway" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.mre_vcn.id
  display_name   = "mre_gateway"
}

resource "oci_core_default_security_list" "mre_security_list" {
  manage_default_resource_id = oci_core_vcn.mre_vcn.default_security_list_id

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 8080
      max = 8080
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_instance" "mre_instance" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "rental-app-instance"
  shape               = "VM.Standard.E2.1.Micro"

  create_vnic_details {
    subnet_id        = oci_core_subnet.mre_subnet.id
    display_name     = "primaryvnic"
    assign_public_ip = true
    hostname_label   = "mre-instance"
  }

  source_details {
    source_type = "image"
    source_id   = var.instance_image_ocid
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(<<-EOF
      #!/bin/bash
      # Add swap space (Critical for 1GB RAM Micro Instances)
      fallocate -l 4G /swapfile
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo '/swapfile none swap sw 0 0' >> /etc/fstab

      # Install Docker
      apt-get update
      apt-get install -y docker.io docker-compose
      systemctl start docker
      systemctl enable docker
      usermod -aG docker ubuntu
    EOF
    )
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}
