terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
  }
}

module "env" {
  source = "./environments"
}

locals {
  app_root = "/hello/"
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = module.env.k8s_context
}

resource "kubernetes_namespace_v1" "example" {
  metadata {
    name = "hello-world-example"
  }
}

resource "kubernetes_ingress_v1" "example" {
  metadata {
    name      = "hello-world-example"
    namespace = kubernetes_namespace_v1.example.metadata.0.name
  }

  spec {
    rule {
      http {
        path {
          backend {
            service {
              name = "hello-world"
              port {
                number = 3000
              }
            }
          }

          path = local.app_root
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "example" {
  metadata {
    namespace = kubernetes_namespace_v1.example.metadata.0.name
    name      = "hello-world"
  }
  spec {
    selector = {
      app = kubernetes_pod_v1.example.metadata.0.labels.app
    }
    session_affinity = "ClientIP"
    port {
      port = 3000
    }
  }
}

resource "kubernetes_pod_v1" "example" {
  metadata {
    name      = "hello-world-example"
    namespace = kubernetes_namespace_v1.example.metadata.0.name
    labels = {
      app = "hello-world"
    }
  }

  spec {
    container {
      image = module.env.hello_world_image
      name  = "hello-world"

      env {
        name  = "APP_LISTEN"
        value = "http://0.0.0.0:3000"
      }

      env {
        name  = "APP_ROOT"
        value = local.app_root
      }

      port {
        container_port = 3000
      }
    }
  }
}
