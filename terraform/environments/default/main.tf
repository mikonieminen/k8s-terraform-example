locals {
  k8s_context       = "default"
  hello_world_image = "localhost/hello-world:2"
}

output "k8s_context" {
  value = local.k8s_context
}

output "hello_world_image" {
  value = local.hello_world_image
}
