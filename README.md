# Kubernetes Example with Terraform

## Table of Contents

- [Project Structure](#project-structure)
- [K3s](#k3s)
  - [What is K3s](#what-is-k3s)
  - [Install K3s](#install-k3s)
  - [Setup Ingress Controller](#setup-ingress-controller)
- [Local Docker Registry](#local-docker-registry)
- [Node.js Demo App](#nodejs-demo-app)
- [Deployment of the Demo App](#deployment-of-the-demo-app)

## K3s

### What is K3s

K3s is a Kubernetes distribution. There are many other Kubernetes distributions, for example minikubes or microk8s. You can choose any of them and this example should also work with any of them, but we have tested everything with K3s.

### Install K3s

See: https://docs.k3s.io/quick-start

Most of the time, installing is as easy as running:

```sh
$ curl -sfL https://get.k3s.io | sh -
```

### Configure kubectl

Kubernetes cluster can be controlled with tool called `kubectl`, make sure you have it installed. Now you need to make it aware of your cluster and have credentials configured. Most easy way of doing this is simply to copy `/etc/rancher/k3s/k3s.yaml`. Though, keep in mind that your local config for `kubectl` may contain multiple configurations for different clustes and the below command will simply override the file.

```sh
$ mkdir -p ~/.kube
$ sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
$ sudo chown $(id -un):$(id -gn) ~/.kube/config
```

### Setup Ingress Controller

In Kubernetes world, ingress rules define how to map and expose your services to the outside world. K3s uses [Traefik](https://docs.k3s.io/networking#traefik-ingress-controller) as the default Ingress Controller.

By default Traefik in K3s exposes ports `80` and `443`, if you want to change these add the following config:

```sh
$ cat <<EOF | sudo tee /var/lib/rancher/k3s/server/manifests/traefik-config.yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    ports:
      web:
        exposedPort: 8080
      websecure:
        exposedPort: 8443
EOF
```

After this, restart K3s: `sudo systemctl restart k3s`.

:exclamation: If using FirewallD, there are some (issues with K8s/K3s and FirewallD](https://www.willhaley.com/blog/k3s-arch-linux/)

## Local Docker Registry

To test everything in a local environment, you need a Docker registry where you can upload your container images. K3s does not bundle local registy by default and if you need one, you can find sample one under `./registry`. Depending which one you prefer, you can find [plain kubectl variant](./registry/kubectl/README.md) and [Terraform one](./registry/terraform/README.md).

## Node.js Demo App

To test this example, you need to build the provided [node.js application](./hello-world-ts).

```sh
$ cd hello-world-ts
$ docker build .
# ... OUTPUT TRUNCATED ...
Successfully built 307c04642c0d
```

Now to make the image available in your repository (expecting you have deployed the registry from this example), first tag the image and then push it to the repository.

```sh
$ docker tag 307c04642c0d localhost/hello-world:1
$ docker push localhost/hello-world:1
```

Once finished, you can jump to the next section of deploying the actual app.

## Deployment of the Demo App

### Deploy to Local Dev Environment

In this example, we use Terraform for deploying the demo app in our local Kubernetes cluster. More more detailed instructions, see [README.md in terraform folder](./terraform/README.md).

At this point, we expect you to have `default` context pointing to your local K3s environment.

```sh
$ cd terraform
$ terraform init
$ terraform apply
```

### Deploy to Test or Production Environment

TBD.
