# 🐇 Cottontail

![image](./logo.png)

*Cottontail* is a lightweight, dynamic gateway built with NestJS that routes HTTP requests to RabbitMQ exchanges based on a simple YAML configuration.

---

## ✨ Features

- YAML-driven dynamic HTTP-to-AMQP routing
- Supports GET, POST, PUT, DELETE across any path
- JMESPath driven input mapping
- Optional reply handling for synchronous responses
- Configurable timeout settings and custom error messages
- Fully Dockerized for easy deployment

---

## 📦 Project Structure

```
src                  # Source Code
config.yml           # Route configuration
Dockerfile           # Build instructions for Cottontail
docker-compose.yml   # Setup RabbitMQ and Cottontail together
package.json         # Project dependencies and scripts
tsconfig.json        # TypeScript config
README.md            # You're here!
```

---

## 🧩 Configuration (YAML)

Example `config.yml`:

```yaml
routes:
  "/sample-stream":
    sse:
      exchange: "amq.topic"
      routingKey: "sample.stream"
      roles:
        - "user"
  "/new_user":
    post:
      exchange: "amq.topic"
      routingKey: "guardian.request.newuser"
      rpc: true
      roles:
        - "user"
        - "admin"
      timeoutMs: 3000
      timeoutStatusCode: 504 
      inputMapping:
        username: "body.username"
        password: "body.password"
        roles: "body.roles"
  "/auth/:username":
    post:
      exchange: "amq.topic"
      routingKey: "guardian.request.auth"
      rpc: true
      timeoutMs: 3000
      timeoutStatusCode: 504 
      inputMapping:
        headers:
          x-username: "params.username"
        username: "params.username"
        password: "body.password"
```

Each HTTP method under a path can define:
- `routingKey` (required)
- `timeoutMs`, `timeoutStatusCode`, `timeoutMessage` (optional)
- `roles` (optional)
- `inputMapping` (optional, but highly suggested.  query, body, params, and jwt are supported as sources)
- `rpc` (optional)

Streams are SSE get requests and require a two step process to use.
- POST to /streams/auth/yourstreamname with the JWT token containing your authorization data.
- GET to /streams/listen/yourstreamname with the cookie retrived from the POST

Note that streams are text only and must be parsed if the expected client result is JSON.

---

## 🚀 Getting Started for Admins

### 1. Install from NPM

```bash
npm install -g @bramedg/cottontail
```

### 2. Set environment variables

```
export AMQP_URL="amqp://guest:guest@localhost"
export JWT_SECRET="mysupersecretkey"
export PORT=80
```

### 4. Create a configuration file using the format described above

### 5. Start Cottontail

```
cottontail ./my-api-config.yml
```

---

## 📡 Example Request

```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"item":"carrot","quantity":12}'
```

If a `rpc` is set to true, the response will contain the reply message or time out after a specified amount of time.  
If no reply is expected, you'll get:

```json
{ "status": "OK" }
```

If roles are defined, a JWT token is expected to passed in the Authorization header.  It should contain the username, audience, roles (as a comma seperated string), and audience == 'cottontail'.

---

## 🧠 Core Concepts

| Concept             | Description |
|---------------------|-------------|
| `routingKey`         | The AMQP queue/topic to send the request to |
| `rpc            `    | Whether or not we wait for a reply (remote procedure call)|
| `roles`              | Authorization for specific services |
| `timeoutMs`          | How long to wait for a reply |
| `timeoutStatusCode`  | HTTP status to return on timeout |
| `timeoutMessage`     | Custom timeout error text |
| `inputMapping`       | Mapping from the source HTTP request to the body of the AMQP message |

---

## 📜 License

MIT © 2025 Daniel Brame

---

## 🐰 Why "Cottontail"?

> Like a little rabbit opening a big door to the world — fast, light, and full of potential. 🌍🚪

---


