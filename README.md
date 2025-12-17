(Upcoming) Full story for this repo can be [read here](https://mentorgashi.com/posts-html/becoming_disposable).

__Would make sense for personal use only!__

---

# Running this project would require docker installed.

# What is Docker?
Docker is a **platform for developing, shipping, and running applications** in isolated environments.

Its core resources are **images** (e.g.: iso), which are read-only templates containing application code and dependencies; 
**containers** (e.g.: vps), which are runnable instances of images; 
and **networks**, which allow containers to communicate with each other and the host system. 

---

## 🛠️ Building and Running in 3 steps

### 1. Building the Docker Image

Build the image using the provided `Dockerfile` (after cloning this repo) and tag it:

```bash
docker build -t minecraft-server-manager .
```

### 2. Running the Container (DooD)

To grant the container control over the host's Docker daemon and expose the web UI, you must perform two critical actions: **mount the socket** and **map the port**.

1.  **Mount the Docker Socket:** `-v /var/run/docker.sock:/var/run/docker.sock`
2.  **Map the Port:** `-p 3000:3000`

Run the container using the following command:

```bash
docker run -d \
  --name mc-server-manager \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  minecraft-server-manager
```

### 3. Accessing the UI

Once the container is running (check with `docker logs web-manager`), open your web browser and navigate to:

**`http://localhost:3000`**

---
