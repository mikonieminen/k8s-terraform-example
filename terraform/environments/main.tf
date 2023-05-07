module "default" {
  source = "./default"
}

locals {
  envs = {
    default = module.default
  }
}

output "k8s_context" {
  value = local.envs[terraform.workspace].k8s_context
}

output "hello_world_image" {
  value = local.envs[terraform.workspace].hello_world_image
}
