output "instance_public_ip" {
  value = oci_core_instance.mre_instance.public_ip
}

output "tenancy_ocid" {
  value = var.tenancy_ocid
}

output "compartment_ocid" {
  value = var.compartment_ocid
}
