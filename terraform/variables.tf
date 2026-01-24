variable "tenancy_ocid" {}
variable "user_ocid" {}
variable "fingerprint" {}
variable "private_key_path" {}
variable "region" {}
variable "compartment_ocid" {}
variable "ssh_public_key" {}

variable "instance_image_ocid" {
  # Ubuntu 22.04 ARM image for ap-sydney-1
  # You might need to verify this OCID for your region: https://docs.oracle.com/en-us/iaas/images/
  default = "ocid1.image.oc1.ap-sydney-1.aaaaaaaaqy5p6lxv6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v6v" 
}
