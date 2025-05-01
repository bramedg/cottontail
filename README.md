# 🐇 Cottontail

![image](./logo.png)

*Cottontail* is a lightweight, dynamic gateway built with NestJS that routes HTTP requests to RabbitMQ exchanges based on a simple YAML configuration.

---

## ✨ Features

- YAML-driven dynamic HTTP-to-AMQP routing
- Supports GET, POST, PUT, DELETE across any path
- Automatic merging of query, body, and URL params into AMQP message
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

Example `src/config.yml`:

```yaml
routes:
  "/v1/orders":
    get:
      routingKey: "orders.get"
      replyRoutingKey: "orders.get.reply"
      timeoutMs: 3000
      timeoutStatusCode: 504
      timeoutMessage: "Orders retrieval timed out"
    post:
      routingKey: "orders.create"
  "/v1/products/:id":
    delete:
      routingKey: "products.delete"
      replyRoutingKey: "products.delete.reply"
      timeoutMs: 4000
      timeoutStatusCode: 504
      timeoutMessage: "Product delete timed out"
```

Each HTTP method under a path can define:
- `routingKey` (required)
- `replyRoutingKey` (optional)
- `timeoutMs`, `timeoutStatusCode`, `timeoutMessage` (optional)

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/cottontail.git
cd cottontail
npm install
```

### 2. Build and run with Docker Compose

```bash
docker-compose up --build
```

This will:
- Start a RabbitMQ server (management UI at http://localhost:15672, user/pass: `guest` / `guest`)
- Build and run the Cottontail gateway (available at http://localhost:3000)

---

## 📡 Example Request

```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"item":"carrot","quantity":12}'
```

If a `replyRoutingKey` is configured, the response will contain the reply message.  
If no reply is expected, you'll get:

```json
{ "status": "OK" }
```

---

## 🧠 Core Concepts

| Concept             | Description |
|---------------------|-------------|
| `routingKey`         | The AMQP queue/topic to send the request to |
| `replyRoutingKey`    | Where to wait for a reply (optional) |
| `query + body + params` | Merged into a single AMQP payload |
| `timeoutMs`          | How long to wait for a reply |
| `timeoutStatusCode`  | HTTP status to return on timeout |
| `timeoutMessage`     | Custom timeout error text |

---

## 📜 License

MIT © 2025 Daniel Brame

---

## 🐰 Why "Cottontail"?

> Like a little rabbit opening a big door to the world — fast, light, and full of potential. 🌍🚪

---


