## Local Docker Registry

First create the deployment for the actual registry.

```sh
$ kubectl apply -f deployment.yaml
```

Now you need to decide either how to make your registry available:

1. put it behind your ingress (recommended because you will need the ingress anyway)
2. use `NodePort` service that exposes a local port on the k8s node
3. create port-forward from `localhost:5000` to the actual pod's port `5000`

Note that docker cli requires use of SSL/TLS when port is not 5000.

#### Use Ingress

Apply ingress rules:

```sh
$ kubectl apply -f ingress.yaml
```

Expecting your Ingress Controller is serving HTTPS traffic in port 8443, test that the route works (you probably have self-signed SSL/TLS certificate, so use `-k`):

```sh
$ curl -k https://registry.localhost:8443/v2/_catalog
{"repositories":[]}
```

It's good to note that `pathType: Prefix` will match all paths with the defined prefix and pass the path as it is forward to the service. It won't strip the prefix from the request path. Because of this, we use separate `registry` subdomain so that we can freely use other routes in the main `localhost` domain.

#### Use NodePort service to expose random port locally on the node

In our `deployment.yaml` we define a `NodePort` service that will expose our registry service using a random port (this could be also fixed for port range `30000-32767`, but here we use random one). You can query the valid port by getting our service and finding the port in the output.

```sh
$ kubectl get services docker-registry-node-port -n docker-registry
NAME                        TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
docker-registry-node-port   NodePort   10.43.190.132   <none>        5000:30376/TCP   36m
```

From the above, you can pick the exposed port, in our case `30376` and we can try that it works.

```sh
$ curl http://localhost:30376/v2/_catalog
{"repositories":[]}
```

#### Use port forward to expose the service

```sh
$ kubectl port-forward -n docker-registry deployment/docker-registry 5000:5000
```

Then in another terminal window verify that the connection works

```sh
$ curl http://localhost:5000/v2/_catalog
{"repositories":[]}
```
