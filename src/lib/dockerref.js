/**
 * The Docker & Swarm catalogue.
 *
 * Same shape as src/lib/sqlref.js, rendered by the same component
 * (src/components/GuidePage.jsx): one flat array of self-contained entries with
 * the command, a real example, what it does, the traps, and the related
 * commands worth knowing next.
 *
 * Entry shape:
 *   id        kebab-case and stable — it is the ?id= deep link
 *   title     the command as you would type or say it
 *   category  one of CATEGORIES[].id
 *   kind      'command' | 'recipe' | 'practice'
 *   summary   one line, shown in the list
 *   syntax    the shape of the command, placeholders in ANGLE brackets
 *   example   something you could paste against SAMPLE_STACK below
 *   explain   prose: what it does and when to reach for it
 *   notes     the gotchas you otherwise learn in an incident
 *   variants  [{ name, note, code?, lang? }] — the related commands
 *   tags      extra search terms not already in the title or summary
 *   related   ids of neighbouring entries
 *   lang      optional highlighting override ('dockerfile', 'yaml'); default bash
 */

/** The app every example talks about, so the entries read as one system. */
export const SAMPLE_STACK = `ghcr.io/acme/shop:1.4    the API image, listens on 8080
postgres:16              its database
swarm                    3 managers + 2 workers
stack                    deployed as "shop" from compose.yml`

export const CATEGORIES = [
  { id: 'images', label: 'Images', desc: 'Building, tagging and shipping images.' },
  { id: 'containers', label: 'Containers', desc: 'Running, inspecting and cleaning up containers.' },
  { id: 'dockerfile', label: 'Dockerfile', desc: 'The instructions, and what each one costs you.' },
  { id: 'storage', label: 'Volumes & storage', desc: 'Where data actually lives, and how to keep it.' },
  { id: 'networking', label: 'Networking', desc: 'Networks, published ports and service discovery.' },
  { id: 'compose', label: 'Compose', desc: 'Multi-container apps on one host.' },
  { id: 'swarm', label: 'Swarm cluster', desc: 'init, join, nodes, quorum, availability.' },
  { id: 'services', label: 'Swarm services', desc: 'Create, scale, update and roll back a service.' },
  { id: 'stacks', label: 'Swarm stacks', desc: 'Deploying a compose file to a cluster.' },
  { id: 'secrets', label: 'Secrets & configs', desc: 'Getting credentials into a service safely.' },
  { id: 'registry', label: 'Registry', desc: 'Logging in, pushing, pulling, digests.' },
  { id: 'ops', label: 'Ops & debugging', desc: 'Logs, events, disk, and why it will not start.' },
  { id: 'pitfalls', label: 'Pitfalls', desc: 'What bites people once it is in production.' },
]

export const KINDS = [
  { id: 'command', label: 'Command', tone: 'sky' },
  { id: 'recipe', label: 'Recipe', tone: 'emerald' },
  { id: 'practice', label: 'Practice', tone: 'amber' },
]

export const ENTRIES = [
  // ---------------------------------------------------------------- images
  {
    id: 'docker-build',
    title: 'docker build',
    category: 'images',
    kind: 'command',
    summary: 'Turn a Dockerfile and a build context into an image.',
    tags: ['buildkit', 'context', 'tag', 'image build'],
    syntax: `docker build -t <name>:<tag> [-f <dockerfile>] [--build-arg K=V] [--target <stage>] <context-path>`,
    example: `docker build -t ghcr.io/acme/shop:1.4 .

# a specific stage of a multi-stage file, with a build argument
docker build -t shop:dev --target dev --build-arg NODE_ENV=development .`,
    explain:
      'Sends the build context (that final path, usually ".") to the daemon and runs the Dockerfile against it. Each instruction becomes a layer, and layers are cached until something they depend on changes.',
    notes: [
      'The context is uploaded before the build starts. Without a .dockerignore, node_modules and .git go with it and every build pays for them.',
      'Tag at build time. An untagged build leaves a dangling <none> image you will later wonder about.',
      '--no-cache rebuilds everything; --pull refreshes the base image, which is what you usually actually wanted.',
      'A --build-arg is visible in the image history, so it is not a place for secrets.',
    ],
    variants: [
      { name: 'docker build --progress=plain', note: 'full step output instead of the collapsed BuildKit view — what you want in CI logs.' },
      { name: 'docker buildx build --platform', note: 'cross-platform builds, e.g. arm64 on an amd64 machine.' },
      { name: 'docker compose build', note: 'builds every service in the compose file that has a build: section.' },
    ],
    related: ['buildx-build', 'dockerignore', 'multi-stage', 'layer-cache', 'build-secrets'],
  },
  {
    id: 'buildx-build',
    title: 'docker buildx build',
    category: 'images',
    kind: 'command',
    summary: 'Build for another architecture, or for several at once.',
    tags: ['multi-platform', 'arm64', 'amd64', 'cross build', 'manifest'],
    syntax: `docker buildx build --platform <os/arch>[,<os/arch>] -t <image>:<tag> [--push|--load] <context>`,
    example: `# one image that runs on both Apple silicon and x86 servers
docker buildx build \\
  --platform linux/amd64,linux/arm64 \\
  -t ghcr.io/acme/shop:1.4 \\
  --push .`,
    explain:
      'Builds through BuildKit with QEMU emulation or remote builders, and publishes a manifest list so a pull from either architecture gets the right image.',
    notes: [
      'A multi-platform build cannot --load into the local daemon (it holds one architecture per tag). Use --push, or build one platform at a time.',
      'Emulated builds are slow. A native builder per architecture (docker buildx create --append) is much faster for anything compiled.',
      'An image built on an M-series Mac without --platform is arm64, and will not start on an amd64 server. That is the single commonest "exec format error".',
    ],
    variants: [
      { name: 'docker buildx ls', note: 'shows the builders and the platforms each supports.' },
      { name: 'docker buildx create --use', note: 'creates and selects a builder that can do multi-platform.' },
      { name: 'docker buildx prune', note: 'clears the BuildKit cache, which grows quietly.' },
    ],
    related: ['docker-build', 'exec-format-error', 'docker-push'],
  },
  {
    id: 'docker-images',
    title: 'docker images',
    category: 'images',
    kind: 'command',
    summary: 'List local images, with size and age.',
    tags: ['ls', 'list images', 'dangling', 'size'],
    syntax: `docker images [--filter <k>=<v>] [--format <go-template>] [--digests]`,
    example: `docker images

# the biggest images first
docker images --format '{{.Size}}\\t{{.Repository}}:{{.Tag}}' | sort -h -r | head

# layers left behind by rebuilds
docker images --filter dangling=true`,
    explain: 'What is on this machine. The SIZE column is the uncompressed on-disk size, which is why it is larger than what the registry reported.',
    notes: [
      'Images sharing layers are each listed at full size, so the column does not add up to disk usage. docker system df gives the real number.',
      '<none>:<none> rows are dangling layers from rebuilds — harmless, until they are 40 GB.',
    ],
    variants: [
      { name: 'docker image ls', note: 'the same command in the newer noun-verb form.' },
      { name: 'docker system df', note: 'actual disk used by images, containers, volumes and build cache.' },
      { name: 'docker image prune', note: 'deletes the dangling ones.' },
    ],
    related: ['image-prune', 'system-df', 'docker-history'],
  },
  {
    id: 'docker-tag',
    title: 'docker tag',
    category: 'images',
    kind: 'command',
    summary: 'Give an existing image another name — how an image becomes pushable.',
    tags: ['retag', 'alias', 'registry name', 'release'],
    syntax: `docker tag <source>:<tag> <registry>/<namespace>/<name>:<tag>`,
    example: `docker tag shop:1.4 ghcr.io/acme/shop:1.4
docker tag shop:1.4 ghcr.io/acme/shop:latest`,
    explain:
      'Adds a second name pointing at the same image id. Nothing is copied, and the registry a push goes to is decided entirely by the name.',
    notes: [
      'An image named without a registry (shop:1.4) can only be pushed to Docker Hub. Tag it with the full registry host first.',
      'Tagging does not copy. Deleting one tag leaves the image as long as another name points at it.',
      'Tag both the version and latest, then push both, if consumers expect latest to move.',
    ],
    variants: [
      { name: 'docker push', note: 'the tag decides the destination.' },
      { name: 'docker image rm <tag>', note: 'removes the name; the image survives while another tag holds it.' },
    ],
    related: ['docker-push', 'docker-login', 'latest-tag', 'image-digest'],
  },
  {
    id: 'docker-pull',
    title: 'docker pull',
    category: 'images',
    kind: 'command',
    summary: 'Fetch an image from a registry before you need it.',
    tags: ['fetch', 'download', 'prefetch', 'digest'],
    syntax: `docker pull <image>:<tag>
docker pull <image>@sha256:<digest>`,
    example: `docker pull postgres:16

# exactly the bytes you tested, whatever the tag points at now
docker pull ghcr.io/acme/shop@sha256:9c4e...f1`,
    explain:
      'Downloads the layers and stores them locally. docker run pulls automatically when the image is missing, so an explicit pull is for warming a node or forcing a refresh of a moving tag.',
    notes: [
      'A tag can be re-pointed at any time; pulling by digest is the only way to be certain what you are getting.',
      'docker pull on an image you already have re-checks the registry — that is how you pick up a new build behind the same tag.',
      'Private registries need docker login first, and Swarm needs --with-registry-auth to pass those credentials to the other nodes.',
    ],
    variants: [
      { name: 'docker pull -a <image>', note: 'every tag of a repository — rarely what you want, often gigabytes.' },
      { name: 'docker image inspect <image>', note: 'the digest, layers and config of what you pulled.' },
    ],
    related: ['image-digest', 'docker-login', 'registry-auth', 'docker-push'],
  },
  {
    id: 'docker-push',
    title: 'docker push',
    category: 'images',
    kind: 'command',
    summary: 'Upload a tagged image to its registry.',
    tags: ['publish', 'upload', 'ship', 'release'],
    syntax: `docker push <registry>/<namespace>/<name>:<tag>`,
    example: `docker login ghcr.io
docker push ghcr.io/acme/shop:1.4`,
    explain: 'Sends layers the registry does not already have, then the manifest. Shared base layers make the second push of a similar image much smaller than the first.',
    notes: [
      'Push fails with "denied" far more often over a wrong name than a wrong password — check the registry host and namespace in the tag.',
      'Pushing :latest over an existing tag leaves the old image unreachable by name. Always push an immutable version tag as well.',
      'Some registries refuse to overwrite a tag (immutable tags). Treat that as a feature.',
    ],
    variants: [
      { name: 'docker push --all-tags <repo>', note: 'pushes every local tag of that repository.' },
      { name: 'docker buildx build --push', note: 'builds and pushes in one step, and is required for multi-platform.' },
    ],
    related: ['docker-tag', 'docker-login', 'buildx-build', 'latest-tag'],
  },
  {
    id: 'docker-history',
    title: 'docker history',
    category: 'images',
    kind: 'command',
    summary: 'See which layer made the image big.',
    tags: ['layers', 'size', 'bloat', 'audit'],
    syntax: `docker history [--no-trunc] <image>:<tag>`,
    example: `docker history ghcr.io/acme/shop:1.4 --no-trunc --format '{{.Size}}\\t{{.CreatedBy}}'`,
    explain: 'Lists the layers newest-first with the instruction that created each and what it added. The first step in making a 1.8 GB image into a 200 MB one.',
    notes: [
      'A file deleted in a later layer still weighs on the image: the earlier layer keeps it. Delete inside the same RUN, or use a multi-stage build.',
      'History also shows build arguments and commands, so anyone with the image can read them — one more reason not to pass secrets as build args.',
    ],
    variants: [
      { name: 'docker image inspect', note: 'the full config: env, entrypoint, labels, layer digests.' },
      { name: 'dive <image>', note: 'a third-party TUI that shows exactly which files each layer added.' },
    ],
    related: ['multi-stage', 'layer-cache', 'build-secrets', 'docker-images'],
  },
  {
    id: 'docker-save-load',
    title: 'docker save / docker load',
    category: 'images',
    kind: 'recipe',
    summary: 'Move an image between machines without a registry.',
    tags: ['tar', 'airgap', 'offline', 'export image', 'transfer'],
    syntax: `docker save -o <file>.tar <image>:<tag>
docker load -i <file>.tar`,
    example: `# on a machine with the image
docker save ghcr.io/acme/shop:1.4 | gzip > shop-1.4.tar.gz

# on the air-gapped server
gunzip -c shop-1.4.tar.gz | docker load`,
    explain: 'save writes the image, its layers and its tags to a tar; load reads one back in with its tags intact. The usual answer for air-gapped environments and for moving a build onto a VM quickly.',
    notes: [
      'Do not confuse it with docker export / docker import, which flatten a container filesystem and lose the history, entrypoint and env.',
      'Uncompressed tars are large. Pipe through gzip or zstd.',
      'On a Swarm you would have to load the image on every node — a registry (even a local one) is less painful past two machines.',
    ],
    variants: [
      { name: 'docker export / docker import', note: 'container filesystem, flattened, metadata dropped.' },
      { name: 'docker save -o with several images', note: 'one tar can carry a list of images.' },
    ],
    related: ['docker-push', 'registry-local', 'image-digest'],
  },
  {
    id: 'image-prune',
    title: 'docker image prune',
    category: 'images',
    kind: 'command',
    summary: 'Reclaim the disk that old builds are sitting on.',
    tags: ['cleanup', 'disk full', 'dangling', 'gc'],
    syntax: `docker image prune [-a] [--filter until=<duration>] [-f]`,
    example: `# dangling layers only — safe
docker image prune -f

# anything not used by a container, older than a week
docker image prune -a --filter "until=168h" -f`,
    explain: 'Without -a it deletes dangling layers; with -a it deletes every image no container is using, which on a build server is the difference between a few GB and a few hundred.',
    notes: [
      '-a will remove base images you will pull again in five minutes. On a build host that is fine; on an air-gapped node it is not.',
      'A Swarm node prunes nothing by itself. Old service images accumulate until the disk fills and tasks stop scheduling.',
      'Run it from cron with a until= filter rather than by hand after an outage.',
    ],
    variants: [
      { name: 'docker system prune -a --volumes', note: 'everything unused, volumes included — dangerous, read it twice.' },
      { name: 'docker builder prune', note: 'the BuildKit cache, which docker image prune does not touch.' },
      { name: 'docker system df', note: 'what is actually using the disk, before you delete anything.' },
    ],
    related: ['system-df', 'system-prune', 'disk-full'],
  },

  // ------------------------------------------------------------ containers
  {
    id: 'docker-run',
    title: 'docker run',
    category: 'containers',
    kind: 'command',
    summary: 'Create a container from an image and start it.',
    tags: ['start', 'launch', 'detached', 'rm', 'port', 'env'],
    syntax: `docker run [-d] [--name <name>] [-p <host>:<container>] [-e K=V] [-v <vol>:<path>] [--rm] <image>:<tag> [command]`,
    example: `docker run -d \\
  --name shop \\
  --restart unless-stopped \\
  -p 8080:8080 \\
  -e DATABASE_URL=postgres://db/shop \\
  --memory 512m --cpus 1 \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'Creates a new container each time — it is not "start the app again". The flags you pick here are baked into that container; changing them means replacing it.',
    notes: [
      '-d detaches; -it gives you a terminal; --rm deletes the container when it exits, which is what you want for one-off commands and never for a service.',
      'Everything written inside the container dies with it unless it is on a volume.',
      'A container with no --restart policy stays down after a reboot.',
      'On a Swarm, do not run services this way — the cluster does not know about them. Use docker service create.',
    ],
    variants: [
      { name: 'docker create + docker start', note: 'the same two steps, separated — useful when you want to configure before the first start.' },
      { name: 'docker run --rm -it <image> sh', note: 'a throwaway shell in the image, to see what is actually in it.' },
      { name: 'docker service create', note: 'the Swarm equivalent, which schedules and keeps it running.' },
    ],
    related: ['docker-ps', 'restart-policy', 'resource-limits', 'service-create', 'docker-exec'],
  },
  {
    id: 'docker-ps',
    title: 'docker ps',
    category: 'containers',
    kind: 'command',
    summary: 'List running containers — and, with -a, the ones that died.',
    tags: ['list', 'status', 'exited', 'ls'],
    syntax: `docker ps [-a] [--filter <k>=<v>] [--format <go-template>] [-q]`,
    example: `docker ps

# what exited, and why
docker ps -a --filter "status=exited" \\
  --format 'table {{.Names}}\\t{{.Status}}\\t{{.Image}}'`,
    explain: 'The first command of any investigation. Without -a it hides exited containers, which is exactly the set you are usually looking for.',
    notes: [
      'The STATUS column carries the exit code: "Exited (137)" is a kill — usually the out-of-memory killer; 143 is SIGTERM; 0 means it simply finished.',
      '-q prints just ids, which is how these get piped: docker rm $(docker ps -aq --filter status=exited).',
      'On a Swarm this shows only this node. Use docker service ps for the cluster view.',
    ],
    variants: [
      { name: 'docker ps --no-trunc', note: 'full command and ids, when the column is cut off.' },
      { name: 'docker stats', note: 'live CPU, memory and I/O for running containers.' },
      { name: 'docker service ps <service>', note: 'the Swarm view: tasks across all nodes, including failed ones.' },
    ],
    related: ['docker-logs', 'docker-inspect', 'service-ps', 'exit-codes'],
  },
  {
    id: 'docker-exec',
    title: 'docker exec',
    category: 'containers',
    kind: 'command',
    summary: 'Run a command inside a container that is already running.',
    tags: ['shell', 'bash', 'sh', 'debug', 'interactive'],
    syntax: `docker exec [-it] [-u <user>] [-w <dir>] <container> <command>`,
    example: `docker exec -it shop sh

# one-off, no shell needed
docker exec shop env | sort

# as root in a container that runs as an unprivileged user
docker exec -it -u root shop sh`,
    explain: 'Starts another process in the container namespaces. The usual way to look around a running service without disturbing it.',
    notes: [
      'Alpine images have no bash — use sh. If neither exists (distroless, scratch) you cannot exec a shell at all; debug from the outside or with a debug sidecar.',
      'exec is not attach: exiting the shell leaves the container running. Ctrl-C in an attach can stop the main process.',
      'Changes you make here vanish on the next deploy. Fix the image, not the container.',
      'On a Swarm you must exec into a task container on its node: docker service ps tells you which node.',
    ],
    variants: [
      { name: 'docker attach <container>', note: 'connects to the main process stdio — Ctrl-P Ctrl-Q to detach without killing it.' },
      { name: 'docker compose exec <service> sh', note: 'the Compose equivalent, by service name.' },
      { name: 'docker run --rm -it --network container:<c> nicolaka/netshoot', note: 'a toolbox container sharing the target network namespace, for images without tools.' },
    ],
    related: ['docker-logs', 'compose-exec', 'distroless-debug', 'docker-ps'],
  },
  {
    id: 'docker-logs',
    title: 'docker logs',
    category: 'containers',
    kind: 'command',
    summary: 'Read what the container wrote to stdout and stderr.',
    tags: ['tail', 'follow', 'stdout', 'stderr', 'since'],
    syntax: `docker logs [-f] [--tail <n>] [--since <time>] [-t] <container>`,
    example: `docker logs -f --tail 100 shop

# just the window around the incident
docker logs --since 2026-09-15T09:00:00 --until 2026-09-15T09:15:00 shop`,
    explain: 'Replays whatever the main process wrote to stdout/stderr, as captured by the logging driver. An application that writes to a file inside the container shows nothing here — which is why containerised apps log to stdout.',
    notes: [
      'A crash loop leaves logs only for the current container. --tail with docker ps -a and the previous container id is how you read the one before it.',
      'The default json-file driver has no rotation unless you configure max-size and max-file. That is the classic full disk.',
      'Non-local logging drivers (syslog, awslogs, gelf) make docker logs return nothing at all.',
    ],
    variants: [
      { name: 'docker service logs <service>', note: 'aggregated across every task of a Swarm service.' },
      { name: 'docker compose logs -f', note: 'interleaved logs of every service in the project.' },
      { name: 'docker inspect --format \'{{.HostConfig.LogConfig}}\' <c>', note: 'which driver and options are in force.' },
    ],
    related: ['service-logs', 'log-rotation', 'docker-ps', 'compose-logs'],
  },
  {
    id: 'docker-stop-start',
    title: 'docker stop / start / restart',
    category: 'containers',
    kind: 'command',
    summary: 'Stop politely, start again, or do both.',
    tags: ['sigterm', 'sigkill', 'graceful', 'timeout'],
    syntax: `docker stop [-t <seconds>] <container>
docker start <container>
docker restart [-t <seconds>] <container>`,
    example: `# give it 30s to finish in-flight requests
docker stop -t 30 shop
docker start shop`,
    explain:
      'stop sends SIGTERM, waits (10 seconds by default), then SIGKILL. start runs the same container again with its original configuration. Neither creates anything new, so nothing about the container changes.',
    notes: [
      'If your process ignores SIGTERM, every stop takes the full timeout and then kills it — usually a PID 1 problem.',
      'To change a port, an env var or an image you must remove and recreate the container. There is no "edit".',
      'docker restart is stop+start, not a reload: the process restarts, the container is the same one.',
    ],
    variants: [
      { name: 'docker kill -s <signal>', note: 'sends a signal immediately, e.g. -s HUP to reload config.' },
      { name: 'docker update --restart=<policy> <c>', note: 'changes the restart policy without recreating.' },
      { name: 'docker service update --force', note: 'the Swarm way to restart tasks, one batch at a time.' },
    ],
    related: ['restart-policy', 'pid-one', 'docker-rm', 'service-update'],
  },
  {
    id: 'docker-rm',
    title: 'docker rm',
    category: 'containers',
    kind: 'command',
    summary: 'Delete a stopped container (and optionally its anonymous volumes).',
    tags: ['delete', 'remove', 'cleanup', 'force'],
    syntax: `docker rm [-f] [-v] <container>...`,
    example: `docker rm shop

# every exited container
docker rm $(docker ps -aq --filter status=exited)`,
    explain: 'Removes the container record and its writable layer. Named volumes survive; anonymous ones stay behind unless you pass -v.',
    notes: [
      '-f stops and removes in one go — convenient, and a good way to kill a database mid-write.',
      'Anonymous volumes from removed containers are the usual source of mystery disk usage. docker volume prune finds them.',
      'Data in a named volume is not deleted here, which is the whole point of naming it.',
    ],
    variants: [
      { name: 'docker container prune', note: 'removes every stopped container in one command.' },
      { name: 'docker rm -v', note: 'also drops the anonymous volumes that container created.' },
    ],
    related: ['volume-prune', 'system-prune', 'docker-stop-start', 'volumes'],
  },
  {
    id: 'docker-inspect',
    title: 'docker inspect',
    category: 'containers',
    kind: 'command',
    summary: 'Every detail of a container, image, volume, network or service — as JSON.',
    tags: ['json', 'format', 'ip address', 'mounts', 'metadata'],
    syntax: `docker inspect [--format '<go-template>'] <object>...`,
    example: `# the IP on a user-defined network
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' shop

# where the mounts actually point
docker inspect -f '{{json .Mounts}}' shop | jq

# why it died
docker inspect -f '{{.State.ExitCode}} {{.State.Error}}' shop`,
    explain: 'The source of truth for anything the other commands summarise: state, exit code, mounts, env, networks, health, restart policy, labels.',
    notes: [
      'Learn --format. Piping the whole JSON to jq works, but a Go template is what you can paste into a script or an alias.',
      'It works on any object type, which is how you check a volume path, a network subnet or a service spec.',
      '.State.Health.Log holds the last healthcheck outputs — the quickest answer to "why is it unhealthy".',
    ],
    variants: [
      { name: 'docker inspect --type <type>', note: 'disambiguates when a container and an image share a name.' },
      { name: 'docker service inspect --pretty <svc>', note: 'a readable summary of a Swarm service spec.' },
      { name: 'docker volume inspect <vol>', note: 'the Mountpoint on the host, for a backup or a look inside.' },
    ],
    related: ['healthcheck', 'docker-ps', 'service-inspect', 'exit-codes'],
  },
  {
    id: 'docker-cp',
    title: 'docker cp',
    category: 'containers',
    kind: 'command',
    summary: 'Copy files in or out of a container, running or not.',
    tags: ['copy', 'extract', 'file transfer', 'dump'],
    syntax: `docker cp <container>:<path> <host-path>
docker cp <host-path> <container>:<path>`,
    example: `# pull a heap dump out
docker cp shop:/tmp/heap.hprof ./heap.hprof

# drop a config in for a quick test
docker cp ./nginx.conf web:/etc/nginx/nginx.conf`,
    explain: 'Moves files across the container boundary without a volume. The fastest way to retrieve a crash dump, a log file or a generated artefact.',
    notes: [
      'A file copied in disappears on the next deploy. It is a debugging move, not a deployment one.',
      'It also works on stopped containers, which is how you salvage data from a container that will not start.',
      'Ownership is whatever the destination sees — a copied-in file may be root-owned and unreadable by an app running as a non-root user.',
    ],
    variants: [
      { name: 'docker cp <c>:/path - | tar -x', note: 'streams a directory out as a tar.' },
      { name: 'docker export <c>', note: 'the entire container filesystem, when you want all of it.' },
    ],
    related: ['docker-exec', 'volumes', 'docker-inspect'],
  },
  {
    id: 'docker-stats',
    title: 'docker stats',
    category: 'containers',
    kind: 'command',
    summary: 'Live CPU, memory, network and disk per container.',
    tags: ['cpu', 'memory', 'monitoring', 'oom', 'usage'],
    syntax: `docker stats [--no-stream] [--format <go-template>] [<container>...]`,
    example: `docker stats --no-stream \\
  --format 'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.MemPerc}}'`,
    explain: 'Reads the cgroup counters. The quickest check of whether a container is near its memory limit before the kernel kills it.',
    notes: [
      'MEM USAGE shows usage against the limit — with no --memory limit, that is the whole host, and a leak takes the machine with it.',
      'CPU% is relative to one core: 250% means two and a half cores.',
      '--no-stream is what you want in a script; without it the command never exits.',
      'A container killed for memory shows "Exited (137)" in docker ps -a and OOMKilled true in docker inspect.',
    ],
    variants: [
      { name: 'docker inspect -f \'{{.State.OOMKilled}}\' <c>', note: 'confirms the kernel killed it for memory.' },
      { name: 'docker system df -v', note: 'per-object disk usage rather than live CPU/memory.' },
    ],
    related: ['resource-limits', 'exit-codes', 'system-df', 'service-resources'],
  },
  {
    id: 'restart-policy',
    title: 'Restart policies (--restart)',
    category: 'containers',
    kind: 'practice',
    summary: 'What happens after a crash, and after a reboot.',
    tags: ['always', 'unless-stopped', 'on-failure', 'reboot', 'supervisor'],
    syntax: `docker run --restart no|on-failure[:<max>]|always|unless-stopped ...`,
    example: `docker run -d --name shop --restart unless-stopped ghcr.io/acme/shop:1.4

# change it on an existing container
docker update --restart unless-stopped shop`,
    explain:
      'The daemon is the supervisor. "no" is the default and means a crash is permanent; "on-failure" retries only non-zero exits; "always" and "unless-stopped" survive reboots, differing only in whether a container you stopped by hand comes back when the daemon restarts.',
    notes: [
      'unless-stopped is the sane default for a single-host service: it comes back after a reboot but respects a deliberate stop.',
      'Restarts back off exponentially, so a container crashing at startup is retried slower and slower rather than hot-looping.',
      'In a Swarm this flag is ignored: the service restart-policy in the service spec governs, and the orchestrator reschedules.',
    ],
    variants: [
      { name: 'docker update --restart', note: 'changes the policy in place, no recreate needed.' },
      { name: 'restart: unless-stopped', note: 'the Compose key for the same thing (ignored by stack deploy).', lang: 'yaml' },
      { name: 'deploy.restart_policy', note: 'the Swarm equivalent inside a stack file.', lang: 'yaml' },
    ],
    related: ['docker-run', 'service-create', 'compose-vs-stack', 'docker-stop-start'],
  },
  {
    id: 'resource-limits',
    title: 'Memory and CPU limits',
    category: 'containers',
    kind: 'practice',
    summary: 'Stop one container from taking the whole host down with it.',
    tags: ['memory', 'cpus', 'oom', 'cgroup', 'quota'],
    syntax: `docker run --memory <size> --memory-reservation <soft> --cpus <n> --pids-limit <n> ...`,
    example: `docker run -d --name shop \\
  --memory 512m --memory-reservation 256m \\
  --cpus 1.5 --pids-limit 200 \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'Without limits a container can use everything the host has. --memory is a hard cap enforced by the kernel (exceed it and the process is killed); --cpus is a quota, not a reservation.',
    notes: [
      'A JVM or Node process needs to be told about the limit too — modern runtimes read cgroup limits, older ones size their heap from the host total and get killed.',
      '--memory-swap defaults to twice --memory. Set it equal to --memory to disable swap for that container.',
      'On a Swarm the equivalents live under deploy.resources, and reservations there also drive scheduling — a task will not be placed on a node that cannot honour them.',
    ],
    variants: [
      { name: 'docker update --memory 1g <c>', note: 'adjusts limits on a running container.' },
      { name: 'deploy.resources.limits / reservations', note: 'the Swarm form; reservations affect placement, limits do not.', lang: 'yaml' },
    ],
    related: ['docker-stats', 'service-resources', 'exit-codes', 'no-suitable-node'],
  },

  // ------------------------------------------------------------ dockerfile
  {
    id: 'dockerfile-from',
    title: 'FROM',
    category: 'dockerfile',
    kind: 'command',
    summary: 'The base image every other instruction builds on.',
    tags: ['base image', 'alpine', 'slim', 'distroless', 'scratch'],
    lang: 'dockerfile',
    syntax: `FROM <image>:<tag>[@<digest>] [AS <stage-name>]`,
    example: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]`,
    explain: 'Sets the filesystem and defaults the build starts from. A Dockerfile can have several, which is what makes multi-stage builds work.',
    notes: [
      'Pin something. :latest changes under you and makes a build unreproducible; a digest pins it exactly.',
      '-alpine is small but uses musl, which breaks some native modules and glibc-only binaries. -slim is the safer small default.',
      'scratch and distroless images have no shell, so no docker exec — decide whether you can live with that before production.',
      'The base image is where most of your CVEs come from. Rebuild regularly rather than pinning forever.',
    ],
    variants: [
      { name: 'FROM ... AS <stage>', note: 'names a stage so a later one can COPY --from it.', lang: 'dockerfile' },
      { name: 'ARG before FROM', note: 'the only ARG usable in a FROM line, e.g. ARG VERSION then FROM node:${VERSION}.', lang: 'dockerfile' },
    ],
    related: ['multi-stage', 'layer-cache', 'image-digest', 'exec-format-error'],
  },
  {
    id: 'dockerfile-run',
    title: 'RUN',
    category: 'dockerfile',
    kind: 'command',
    summary: 'Execute a command at build time; each one is a layer.',
    tags: ['layer', 'apt', 'apk', 'install', 'cache mount'],
    lang: 'dockerfile',
    syntax: `RUN <command>
RUN ["executable", "arg"]
RUN --mount=type=cache,target=<dir> <command>`,
    example: `# one layer, cleaned up inside the same layer
RUN apt-get update \\
 && apt-get install -y --no-install-recommends ca-certificates curl \\
 && rm -rf /var/lib/apt/lists/*

# BuildKit cache mount: the package cache survives between builds
RUN --mount=type=cache,target=/root/.npm npm ci`,
    explain: 'Runs in a shell inside the image being built and commits the result as a layer. Grouping related commands keeps the image small and the cache meaningful.',
    notes: [
      'Cleaning up in a later RUN does not shrink the image — the earlier layer still holds the files. Clean inside the same RUN.',
      'apt-get update in its own layer is a classic: the cached update layer is reused and you install stale packages. Always chain it with the install.',
      'Cache mounts keep package downloads out of the image while still being reused across builds.',
    ],
    variants: [
      { name: 'RUN --mount=type=bind', note: 'reads a file from the context without copying it into a layer.', lang: 'dockerfile' },
      { name: 'RUN --mount=type=secret', note: 'a secret available during that command only, never in the image.', lang: 'dockerfile' },
    ],
    related: ['layer-cache', 'build-secrets', 'multi-stage', 'docker-history'],
  },
  {
    id: 'copy-vs-add',
    title: 'COPY vs ADD',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'Use COPY. ADD does surprising extra things.',
    tags: ['files', 'context', 'chown', 'tar', 'url'],
    lang: 'dockerfile',
    syntax: `COPY [--chown=<user>:<group>] [--from=<stage>] <src>... <dest>
ADD <src> <dest>   # also unpacks local tars and fetches URLs`,
    example: `COPY --chown=app:app package*.json ./
RUN npm ci --omit=dev
COPY --chown=app:app . .

# from an earlier stage rather than the context
COPY --from=build /app/dist ./dist`,
    explain: 'COPY does exactly what it says. ADD additionally unpacks local tar archives and can download URLs, which surprises readers and bloats images.',
    notes: [
      'Copy the dependency manifest, install, then copy the source. Reversed, every source edit invalidates the install layer.',
      '--chown avoids a separate RUN chown, which would duplicate every copied file into a new layer.',
      'For a remote file use RUN curl (and verify a checksum) rather than ADD <url>, which caches badly and hides the download.',
      'Everything you COPY must be inside the build context, and everything in the context is uploaded — see .dockerignore.',
    ],
    variants: [
      { name: 'ADD <tar>', note: 'the one legitimate use: unpacking a local archive.', lang: 'dockerfile' },
      { name: 'COPY --from=<image>', note: 'copies from another image entirely, e.g. a CA bundle or a static binary.', lang: 'dockerfile' },
    ],
    related: ['dockerignore', 'layer-cache', 'multi-stage', 'dockerfile-user'],
  },
  {
    id: 'cmd-vs-entrypoint',
    title: 'CMD vs ENTRYPOINT',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'What runs, and what a user can override.',
    tags: ['process', 'args', 'shell form', 'exec form', 'override'],
    lang: 'dockerfile',
    syntax: `ENTRYPOINT ["/app/bin/server"]     # the program
CMD ["--port", "8080"]             # its default arguments, overridable`,
    example: `ENTRYPOINT ["node", "server.js"]
CMD ["--port", "8080"]

# docker run shop --port 9090   ->  node server.js --port 9090
# docker run shop               ->  node server.js --port 8080`,
    explain:
      'ENTRYPOINT is the executable; CMD supplies default arguments that the command line replaces. With only CMD, anything the user types replaces the whole thing.',
    notes: [
      'Always use the JSON (exec) form. The shell form wraps your process in /bin/sh -c, which becomes PID 1 and swallows SIGTERM — so stops take the full timeout and then kill.',
      'To get a shell in an image with an ENTRYPOINT, override it: docker run --entrypoint sh -it <image>.',
      'An entrypoint script should end with exec "$@" so the real process takes over PID 1.',
    ],
    variants: [
      { name: 'docker run --entrypoint', note: 'replaces the entrypoint for one run — the way into an image that starts a daemon.' },
      { name: 'command: / entrypoint:', note: 'the Compose keys that override each.', lang: 'yaml' },
    ],
    related: ['pid-one', 'dockerfile-run', 'docker-run', 'distroless-debug'],
  },
  {
    id: 'env-vs-arg',
    title: 'ENV vs ARG',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'ARG is build time only; ENV is in the running container, forever.',
    tags: ['environment', 'build arg', 'variable', 'config', 'secret'],
    lang: 'dockerfile',
    syntax: `ARG <name>[=<default>]      # build time, not in the final image's env
ENV <key>=<value>           # baked into the image and visible at runtime`,
    example: `ARG NODE_VERSION=22
FROM node:${'${NODE_VERSION}'}-alpine

ENV NODE_ENV=production \\
    PORT=8080`,
    explain:
      'ARG parameterises a build (versions, mirrors, feature flags). ENV sets defaults the process reads at runtime, and stays part of the image.',
    notes: [
      'Neither is a secret store. ARG values are in the image history and ENV values are in docker inspect — use a build secret or a Swarm secret instead.',
      'An ARG used in FROM must be declared before the first FROM, and is not visible after it unless redeclared in the stage.',
      'Runtime config belongs in the environment at run time (-e, env_file, or a Swarm secret), not baked into the image.',
    ],
    variants: [
      { name: 'docker run -e / --env-file', note: 'sets or overrides ENV values for one container.' },
      { name: 'docker build --build-arg', note: 'supplies an ARG for one build.' },
      { name: 'environment: / env_file:', note: 'the Compose keys, with variable substitution from .env.', lang: 'yaml' },
    ],
    related: ['build-secrets', 'swarm-secret-use', 'compose-env', 'secrets-in-env'],
  },
  {
    id: 'dockerfile-expose',
    title: 'EXPOSE and WORKDIR',
    category: 'dockerfile',
    kind: 'command',
    summary: 'Document the port; set the directory everything else runs in.',
    tags: ['port', 'documentation', 'cd', 'directory'],
    lang: 'dockerfile',
    syntax: `WORKDIR /app          # created if missing, applies to later RUN/CMD/COPY
EXPOSE 8080           # documentation + a hint for -P`,
    example: `WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]`,
    explain:
      'WORKDIR is cd, but persistent and layer-aware — use it instead of RUN cd, which only affects its own layer. EXPOSE publishes nothing; it records the port for humans and for docker run -P.',
    notes: [
      'A container is reachable on a port because of -p at run time, not because of EXPOSE. Forgetting that costs an afternoon.',
      'Containers on the same user-defined network reach each other on the container port with no publishing at all.',
      'WORKDIR with a relative path stacks on the previous one. Use absolute paths.',
    ],
    variants: [
      { name: 'docker run -P', note: 'publishes every EXPOSEd port on a random host port.' },
      { name: 'docker port <container>', note: 'shows what actually got published.' },
    ],
    related: ['publish-ports', 'docker-run', 'container-dns'],
  },
  {
    id: 'dockerfile-user',
    title: 'USER (do not run as root)',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'Drop privileges in the image, not in an entrypoint script.',
    tags: ['root', 'security', 'non-root', 'permissions', 'uid'],
    lang: 'dockerfile',
    syntax: `RUN addgroup -S app && adduser -S -G app app
USER app`,
    example: `RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --chown=app:app . .
USER app
CMD ["node", "server.js"]`,
    explain:
      'Everything after USER — including the container process — runs as that user. A container escape then lands on an unprivileged account rather than root on the host.',
    notes: [
      'Do the installs first: after USER you cannot apt-get. Put USER as late as possible.',
      'Files copied before the switch are root-owned; COPY --chown or a chown in the same layer avoids a permission error at startup.',
      'A non-root user cannot bind ports below 1024 — listen on 8080 and publish it as 80 with -p 80:8080.',
      'Volumes mounted into the container keep their host ownership, which is the usual cause of "permission denied" on a data directory.',
    ],
    variants: [
      { name: 'docker run -u root', note: 'overrides it for a debugging session.' },
      { name: 'docker run --read-only --cap-drop ALL', note: 'the next steps: immutable filesystem, no capabilities.' },
      { name: 'user: "1000:1000"', note: 'the Compose key, when the image does not set one.', lang: 'yaml' },
    ],
    related: ['run-as-root', 'copy-vs-add', 'volumes', 'docker-exec'],
  },
  {
    id: 'healthcheck',
    title: 'HEALTHCHECK',
    category: 'dockerfile',
    kind: 'command',
    summary: 'Let Docker know whether the process is actually serving.',
    tags: ['health', 'readiness', 'unhealthy', 'probe', 'liveness'],
    lang: 'dockerfile',
    syntax: `HEALTHCHECK [--interval=30s] [--timeout=5s] [--start-period=30s] [--retries=3] \\
  CMD <command that exits 0 when healthy>`,
    example: `HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \\
  CMD wget -qO- http://localhost:8080/healthz || exit 1`,
    explain:
      'Docker runs the command inside the container on a schedule and marks it healthy or unhealthy. In a Swarm this is load bearing: a task is not counted as converged, and gets no traffic, until it is healthy.',
    notes: [
      '--start-period covers slow startup: failures during it do not count towards retries.',
      'A process alive but not serving is exactly what this catches — "running" says nothing about readiness.',
      'The command runs inside the container, so it must exist there. curl and wget are absent from many slim images.',
      'Without a healthcheck, a Swarm rolling update declares success as soon as the process starts, and can roll a broken version across every replica.',
    ],
    variants: [
      { name: 'docker inspect -f \'{{json .State.Health}}\' <c>', note: 'status and the last few probe outputs.', lang: 'bash' },
      { name: 'healthcheck:', note: 'the Compose/stack key, which can also override or disable an image healthcheck.', lang: 'yaml' },
      { name: 'depends_on: condition: service_healthy', note: 'Compose waits for health before starting a dependent service.', lang: 'yaml' },
    ],
    related: ['service-update', 'compose-depends-on', 'service-not-converging', 'docker-inspect'],
  },
  {
    id: 'multi-stage',
    title: 'Multi-stage builds',
    category: 'dockerfile',
    kind: 'recipe',
    summary: 'Build with a full toolchain, ship only the result.',
    tags: ['small image', 'builder', 'compile', 'copy --from', 'slim'],
    lang: 'dockerfile',
    syntax: `FROM <toolchain> AS build
...
FROM <runtime>
COPY --from=build <artifact> <dest>`,
    example: `FROM golang:1.23 AS build
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/shop ./cmd/shop

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/shop /shop
USER nonroot
ENTRYPOINT ["/shop"]`,
    explain:
      'Each FROM starts a new image; only what you COPY --from an earlier stage ends up in the final one. Compilers, headers, npm caches and source code stay behind.',
    notes: [
      'This is the difference between a 1.2 GB image and a 20 MB one, and it removes most of the CVE surface with the toolchain.',
      '--target lets CI build just the test stage, so the same Dockerfile covers dev, test and release.',
      'Stages build in parallel when they do not depend on each other, so extra stages are usually free.',
    ],
    variants: [
      { name: 'docker build --target <stage>', note: 'stops at a stage — a dev image from the same file.' },
      { name: 'COPY --from=<image>', note: 'copies from a published image rather than a stage.', lang: 'dockerfile' },
    ],
    related: ['dockerfile-from', 'docker-history', 'layer-cache', 'distroless-debug'],
  },
  {
    id: 'dockerignore',
    title: '.dockerignore',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'Keep the build context small — and secrets out of the image.',
    tags: ['context', 'build speed', 'git', 'node_modules', 'env file'],
    syntax: `# .dockerignore, next to the Dockerfile
.git
node_modules
**/*.log
.env*
dist`,
    example: `.git
.github
node_modules
dist
coverage
*.log
.env*
docker-compose*.yml
Dockerfile*`,
    explain:
      'Everything in the build context is uploaded to the daemon before the build starts. Excluding what the image does not need makes builds faster and stops COPY . . from sweeping in an .env file.',
    notes: [
      'COPY . . without a .dockerignore has shipped plenty of .git directories and credentials to production.',
      'A huge context also breaks the cache: any file changing anywhere invalidates the COPY layer.',
      'It is a separate mechanism from .gitignore, and the two are not read from each other.',
    ],
    variants: [
      { name: 'docker build --progress=plain', note: 'shows the context size being transferred, which is how you notice the problem.' },
    ],
    related: ['copy-vs-add', 'layer-cache', 'docker-build', 'build-secrets'],
  },
  {
    id: 'layer-cache',
    title: 'Layer caching and instruction order',
    category: 'dockerfile',
    kind: 'practice',
    summary: 'Put what changes least at the top; the cache does the rest.',
    tags: ['cache', 'build speed', 'invalidate', 'order', 'ci'],
    lang: 'dockerfile',
    syntax: `# stable -> volatile
COPY package*.json ./     # changes rarely
RUN npm ci                # the expensive step, cached
COPY . .                  # changes every commit`,
    example: `FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
CMD ["node", "server.js"]`,
    explain:
      'Each instruction is cached against its inputs; the first miss invalidates everything after it. Copying the whole source before installing dependencies makes every commit reinstall them.',
    notes: [
      'In CI the cache starts empty unless you give it one: --cache-from a registry image, or a persistent BuildKit cache.',
      'RUN --mount=type=cache keeps the package manager cache between builds without putting it in the image.',
      'A cached apt-get update paired with a later install gets you stale package lists — chain them in one RUN.',
    ],
    variants: [
      { name: 'docker build --no-cache', note: 'rebuild everything, for when you suspect a stale layer.' },
      { name: 'docker build --cache-from <image>', note: 'seeds the cache from a previously pushed image, the usual CI trick.' },
      { name: 'docker builder prune', note: 'clears BuildKit cache that has grown too large.' },
    ],
    related: ['dockerfile-run', 'copy-vs-add', 'dockerignore', 'docker-build'],
  },
  {
    id: 'build-secrets',
    title: 'Secrets at build time',
    category: 'dockerfile',
    kind: 'recipe',
    summary: 'A private-registry token or SSH key without leaving it in the image.',
    tags: ['npmrc', 'ssh', 'token', 'secret mount', 'private repo'],
    syntax: `# Dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# build
docker build --secret id=npmrc,src=$HOME/.npmrc -t shop:1.4 .`,
    example: `# Dockerfile
RUN --mount=type=ssh git clone git@github.com:acme/private-lib.git

# build
docker build --ssh default -t shop:1.4 .`,
    explain:
      'BuildKit mounts the secret into that one RUN only. It is not in a layer, not in docker history, and not in the pushed image.',
    notes: [
      '--build-arg is not a secret: the value is recorded in the image history for anyone who pulls it.',
      'Neither is COPY-ing a key and deleting it later — the earlier layer still has it.',
      'Runtime credentials are a different problem: use a Swarm secret or an injected env var, not a baked-in one.',
    ],
    variants: [
      { name: 'docker build --ssh default', note: 'forwards your SSH agent for private git dependencies.' },
      { name: 'docker secret create', note: 'the runtime equivalent, for a service in a Swarm.' },
    ],
    related: ['env-vs-arg', 'swarm-secret-create', 'secrets-in-env', 'docker-history'],
  },

  // --------------------------------------------------------------- storage
  {
    id: 'volumes',
    title: 'Volumes vs bind mounts vs tmpfs',
    category: 'storage',
    kind: 'practice',
    summary: 'Three ways to keep data out of the container layer, for three different jobs.',
    tags: ['persistence', 'data', 'mount', 'storage', 'stateful'],
    syntax: `-v <volume-name>:<path>        # named volume: Docker manages it
-v /host/path:<path>           # bind mount: an exact host directory
--tmpfs <path>                 # memory only, gone on stop
--mount type=volume,source=<v>,target=<path>,readonly`,
    example: `# production data
docker run -d --name db -v shop-db:/var/lib/postgresql/data postgres:16

# live source during development
docker run -d --name shop -v "$PWD":/app -w /app node:22-alpine npm run dev

# scratch space that must never touch the disk
docker run -d --tmpfs /tmp:size=64m ghcr.io/acme/shop:1.4`,
    explain:
      'A named volume is the default answer for data you want to keep: Docker owns the path, it survives docker rm, and it can be backed up. A bind mount ties the container to a host path, which is perfect for development and fragile in production. tmpfs is memory.',
    notes: [
      'Anything written outside a mount lives in the container layer and dies with the container.',
      'Mounting over a directory that has content in the image hides that content — an empty named volume is the exception, it is seeded from the image the first time.',
      'Add :ro to anything the container should not write: -v ./nginx.conf:/etc/nginx/nginx.conf:ro.',
      'Ownership comes from the host for bind mounts, which is why a non-root container often cannot write to one.',
    ],
    variants: [
      { name: '--mount', note: 'the explicit long form; it fails loudly when a source is missing, where -v silently creates it.' },
      { name: 'volumes:', note: 'the Compose key, with a top-level volumes: block for named ones.', lang: 'yaml' },
    ],
    related: ['volume-create', 'bind-mount', 'volume-backup', 'swarm-data-locality', 'dockerfile-user'],
  },
  {
    id: 'volume-create',
    title: 'docker volume create / ls / inspect / rm',
    category: 'storage',
    kind: 'command',
    summary: 'Manage named volumes directly.',
    tags: ['named volume', 'mountpoint', 'driver', 'nfs'],
    syntax: `docker volume create <name>
docker volume ls [--filter dangling=true]
docker volume inspect <name>
docker volume rm <name>`,
    example: `docker volume create shop-db
docker volume inspect shop-db -f '{{.Mountpoint}}'
# /var/lib/docker/volumes/shop-db/_data

# an NFS-backed volume, so any node can mount it
docker volume create --driver local \\
  --opt type=nfs --opt o=addr=10.0.0.9,rw --opt device=:/exports/shop \\
  shop-shared`,
    explain: 'Volumes exist independently of containers, which is what makes them survive a redeploy. Creating one up front also lets you choose a driver or options.',
    notes: [
      'docker volume rm refuses while a container still references it — stop and remove the container first.',
      'The Mountpoint is a host path you can read as root, which is handy for a quick backup and dangerous for everything else.',
      'Volume drivers are how a Swarm shares storage across nodes; the default local driver is local to one node and nothing else.',
    ],
    variants: [
      { name: 'docker volume ls -f dangling=true', note: 'volumes no container references — usually leftovers.' },
      { name: 'docker volume prune', note: 'deletes all of those at once.' },
      { name: 'docker run -v <vol>:<path>', note: 'creates the volume implicitly if it does not exist.' },
    ],
    related: ['volumes', 'volume-prune', 'volume-backup', 'swarm-data-locality'],
  },
  {
    id: 'bind-mount',
    title: 'Bind mounts for development',
    category: 'storage',
    kind: 'recipe',
    summary: 'Edit on the host, the container sees it immediately.',
    tags: ['hot reload', 'dev', 'source', 'watch', 'node_modules'],
    syntax: `docker run -v "$PWD":/app -v /app/node_modules -w /app <image> <dev command>`,
    example: `docker run --rm -it \\
  -v "$PWD":/app \\
  -v /app/node_modules \\
  -w /app -p 8080:8080 \\
  node:22-alpine npm run dev`,
    explain:
      'The host directory replaces the container one, so a save on your machine is immediately visible inside. The second, anonymous mount protects the container node_modules from being hidden by the host directory.',
    notes: [
      'Without that second mount, the host folder (with no node_modules, or with the wrong platform binaries) shadows the ones installed in the image.',
      'File watching across the boundary can be unreliable on macOS and Windows; many tools need polling.',
      'Bind mounts belong in a development compose override, not in a production stack file.',
      'Everything the container writes is owned by the container user on the host — a root-owned build output is the usual souvenir.',
    ],
    variants: [
      { name: 'compose.override.yml', note: 'where the bind mount and dev command live, so the base file stays production-shaped.', lang: 'yaml' },
      { name: 'docker compose watch', note: 'syncs files (and rebuilds on demand) without a bind mount.' },
    ],
    related: ['volumes', 'compose-override', 'compose-up', 'dockerfile-user'],
  },
  {
    id: 'volume-backup',
    title: 'Back up and restore a volume',
    category: 'storage',
    kind: 'recipe',
    summary: 'Get the data out with a throwaway container.',
    tags: ['backup', 'restore', 'tar', 'snapshot', 'migrate'],
    syntax: `docker run --rm -v <volume>:/data -v "$PWD":/backup alpine \\
  tar czf /backup/<file>.tar.gz -C /data .`,
    example: `# back up
docker run --rm -v shop-db:/data -v "$PWD":/backup alpine \\
  tar czf /backup/shop-db-2026-09-15.tar.gz -C /data .

# restore into a fresh volume
docker volume create shop-db-restored
docker run --rm -v shop-db-restored:/data -v "$PWD":/backup alpine \\
  tar xzf /backup/shop-db-2026-09-15.tar.gz -C /data`,
    explain: 'Mount the volume and a host directory into a small image, and tar between them. No host paths to guess, works the same everywhere.',
    notes: [
      'Stop the writer first, or use the database own dump tool. A tar of a running database directory is a corrupt backup that looks fine until you need it.',
      'For Postgres, pg_dump through docker exec is the safer route; the tar approach is for volumes with plain files.',
      'Test the restore. An untested backup is a rumour.',
    ],
    variants: [
      { name: 'docker exec db pg_dump -U postgres shop > shop.sql', note: 'a consistent logical backup for a live database.' },
      { name: 'docker cp', note: 'fine for one file, unwieldy for a whole data directory.' },
    ],
    related: ['volumes', 'volume-create', 'docker-cp', 'docker-exec'],
  },
  {
    id: 'volume-prune',
    title: 'docker volume prune',
    category: 'storage',
    kind: 'command',
    summary: 'Delete volumes nothing is using — carefully.',
    tags: ['cleanup', 'disk', 'anonymous volume', 'danger'],
    syntax: `docker volume prune [-a] [-f]`,
    example: `# see what would go first
docker volume ls -f dangling=true

docker volume prune -f`,
    explain: 'Removes volumes no container currently references. That includes the anonymous volumes left behind by removed containers, which is usually where the disk went.',
    notes: [
      'A stopped container still counts as a reference, so a volume whose container you already removed is fair game — including your database, if you removed its container an hour ago.',
      'List first, always. There is no undo.',
      'docker system prune does not touch volumes unless you add --volumes; that flag is the dangerous one.',
    ],
    variants: [
      { name: 'docker volume prune -a', note: 'also removes named volumes that are unused, not just anonymous ones.' },
      { name: 'docker system df -v', note: 'shows the size of each volume before you decide.' },
    ],
    related: ['volume-create', 'system-prune', 'system-df', 'disk-full'],
  },

  // ------------------------------------------------------------ networking
  {
    id: 'publish-ports',
    title: 'Publishing ports (-p)',
    category: 'networking',
    kind: 'command',
    summary: 'Make a container port reachable from outside the host.',
    tags: ['port mapping', 'expose', 'bind address', 'localhost', '8080'],
    syntax: `docker run -p [<host-ip>:]<host-port>:<container-port>[/<proto>] <image>`,
    example: `# reachable from anywhere the host is
docker run -d -p 8080:8080 ghcr.io/acme/shop:1.4

# only from the host itself — put a reverse proxy in front
docker run -d -p 127.0.0.1:5432:5432 postgres:16`,
    explain:
      'Adds a forwarding rule from the host port to the container port. Without it the container is reachable only from other containers on the same network.',
    notes: [
      'Left is the host, right is the container. Getting it backwards is the most common docker mistake there is.',
      '-p 5432:5432 on a cloud VM publishes your database to the internet, and Docker punches through many firewall setups (ufw in particular) to do it. Bind to 127.0.0.1 unless you mean it.',
      'Containers on the same user-defined network talk on the container port directly — publishing is only for traffic from outside.',
      '"port is already allocated" means another container or host process holds it; docker ps and ss -ltnp find it.',
    ],
    variants: [
      { name: 'docker port <container>', note: 'shows the actual mappings, including random ones from -P.' },
      { name: 'ports: "8080:8080"', note: 'the Compose key; quote it, or 22:22 parses as a sexagesimal number.', lang: 'yaml' },
      { name: '--publish mode=host', note: 'the Swarm option that bypasses the routing mesh.' },
    ],
    related: ['network-create', 'container-dns', 'routing-mesh', 'dockerfile-expose'],
  },
  {
    id: 'network-create',
    title: 'docker network create',
    category: 'networking',
    kind: 'command',
    summary: 'A private network so containers can find each other by name.',
    tags: ['bridge', 'overlay', 'subnet', 'isolation', 'attachable'],
    syntax: `docker network create [-d bridge|overlay] [--subnet <cidr>] [--attachable] <name>`,
    example: `docker network create shop-net

docker run -d --name db  --network shop-net postgres:16
docker run -d --name api --network shop-net -p 8080:8080 ghcr.io/acme/shop:1.4
# the api reaches the database at host "db", port 5432`,
    explain:
      'A user-defined bridge network gives its members DNS by container name and isolates them from everything else on the host. Overlay does the same across a Swarm.',
    notes: [
      'The default bridge network has no DNS between containers — that is the reason to always create your own.',
      'Names resolve to whatever the container is called; --network-alias adds more names for the same container.',
      'An overlay network is only joinable by standalone containers if it was created --attachable.',
      'Compose creates a network per project automatically, which is why services there already reach each other by name.',
    ],
    variants: [
      { name: 'docker network connect <net> <container>', note: 'attaches a running container to another network.' },
      { name: 'docker network inspect <net>', note: 'subnet, gateway and the containers attached.' },
      { name: 'docker network prune', note: 'removes networks nothing is using.' },
    ],
    related: ['container-dns', 'overlay-network', 'network-modes', 'publish-ports'],
  },
  {
    id: 'container-dns',
    title: 'Service discovery by name',
    category: 'networking',
    kind: 'practice',
    summary: 'On a user-defined network, the container name is the hostname.',
    tags: ['dns', 'hostname', 'resolve', 'connection string', 'alias'],
    syntax: `postgres://db:5432/shop        # "db" is the container or service name
http://api:8080/healthz`,
    example: `docker network create shop-net
docker run -d --name db --network shop-net postgres:16
docker run --rm --network shop-net alpine ping -c1 db`,
    explain:
      'Docker runs an embedded DNS server on user-defined networks. Containers and Swarm services resolve each other by name, so connection strings can be written once and work in every environment.',
    notes: [
      'Never hard-code an IP. Container addresses change on every recreate.',
      'In a Swarm the name resolves to a virtual IP that load-balances across the replicas; dnsrr mode returns the task IPs instead.',
      'Names are per network: a container is only reachable by name from containers on a network it shares.',
      'localhost inside a container is that container, not the host — this is why an app cannot reach the database on 127.0.0.1.',
    ],
    variants: [
      { name: 'docker run --network-alias <name>', note: 'an extra DNS name, useful while renaming a service.' },
      { name: 'tasks.<service>', note: 'in a Swarm, resolves to every task IP instead of the service VIP.' },
      { name: 'host.docker.internal', note: 'reaches the host from inside a container on Docker Desktop.' },
    ],
    related: ['network-create', 'overlay-network', 'routing-mesh', 'publish-ports'],
  },
  {
    id: 'network-modes',
    title: 'bridge, host, none',
    category: 'networking',
    kind: 'practice',
    summary: 'The three single-host network modes, and when host is worth it.',
    tags: ['--network host', 'performance', 'isolation', 'namespace'],
    syntax: `docker run --network bridge ...   # default: NAT, isolated, publishable
docker run --network host ...     # shares the host stack, no -p needed
docker run --network none ...     # no networking at all`,
    example: `# a load generator that would otherwise be NAT-bound
docker run --rm --network host ghcr.io/acme/loadtest:1.0`,
    explain:
      'bridge isolates the container behind NAT; host removes the boundary so the container binds host ports directly; none gives it nothing but a loopback.',
    notes: [
      'host mode ignores -p entirely, has no isolation, and collides with anything already on that port.',
      'On Docker Desktop, host mode does not behave like it does on Linux — the "host" is a VM.',
      'In a Swarm, host mode also means no routing mesh: traffic must reach the node actually running the task.',
      'none is genuinely useful for a batch job that must not touch the network.',
    ],
    variants: [
      { name: '--network container:<name>', note: 'shares another container namespace — how a debug toolbox sees its traffic.' },
      { name: 'network_mode: host', note: 'the Compose key; ignored by docker stack deploy.', lang: 'yaml' },
    ],
    related: ['publish-ports', 'network-create', 'routing-mesh', 'distroless-debug'],
  },
  {
    id: 'overlay-network',
    title: 'Overlay networks',
    category: 'networking',
    kind: 'command',
    summary: 'One private network spanning every node in the Swarm.',
    tags: ['vxlan', 'swarm network', 'encrypted', 'multi-host', 'attachable'],
    syntax: `docker network create -d overlay [--attachable] [--opt encrypted] <name>`,
    example: `docker network create -d overlay --opt encrypted shop-net

docker service create --name db  --network shop-net postgres:16
docker service create --name api --network shop-net -p 8080:8080 ghcr.io/acme/shop:1.4`,
    explain:
      'Overlay networks tunnel container traffic between nodes (VXLAN), so services on different machines talk as if they were on one switch, by name.',
    notes: [
      'Create it on a manager. Worker nodes get it when a task that needs it is scheduled there.',
      'Traffic is not encrypted unless you ask: --opt encrypted costs some throughput and is usually worth it across untrusted networks.',
      'Nodes must reach each other on 2377/tcp (management), 7946/tcp+udp (gossip) and 4789/udp (VXLAN) — a blocked 4789 gives you services that resolve but never connect.',
      'A standalone docker run can only join an overlay network created --attachable.',
    ],
    variants: [
      { name: 'docker network ls --filter driver=overlay', note: 'the overlay networks this node knows about.' },
      { name: 'ingress', note: 'the built-in overlay that carries published service ports.' },
    ],
    related: ['swarm-init', 'routing-mesh', 'container-dns', 'service-create'],
  },
  {
    id: 'routing-mesh',
    title: 'The routing mesh (published service ports)',
    category: 'networking',
    kind: 'practice',
    summary: 'Any node answers on a published port, wherever the task runs.',
    tags: ['ingress', 'load balancer', 'vip', 'source ip', 'mode host'],
    syntax: `docker service create -p 8080:8080 ...                        # ingress (default)
docker service create --publish mode=host,target=8080,published=8080 ...`,
    example: `docker service create --name api --replicas 3 -p 8080:8080 ghcr.io/acme/shop:1.4
# curl any node on :8080 and the mesh routes it to one of the three tasks`,
    explain:
      'In ingress mode Swarm publishes the port on every node and load-balances into the tasks. A load balancer in front can point at all nodes without knowing where anything runs.',
    notes: [
      'The mesh rewrites the source address, so the application sees a cluster IP rather than the real client. For real client IPs use mode=host plus an external load balancer, or a proxy that sets X-Forwarded-For.',
      'mode=host publishes only on nodes running a task, and a port can then only be used by one task per node.',
      'A health check that fails keeps a task out of the load balancer, which is the point of having one.',
    ],
    variants: [
      { name: 'endpoint_mode: dnsrr', note: 'skips the virtual IP and returns task IPs — for clients that do their own balancing.', lang: 'yaml' },
      { name: 'docker service inspect --format \'{{json .Endpoint}}\'', note: 'shows the published ports and mode in force.' },
    ],
    related: ['overlay-network', 'service-create', 'healthcheck', 'container-dns'],
  },

  // --------------------------------------------------------------- compose
  {
    id: 'compose-up',
    title: 'docker compose up',
    category: 'compose',
    kind: 'command',
    summary: 'Start everything in the compose file, creating what is missing.',
    tags: ['start', 'detached', 'project', 'recreate', 'build'],
    syntax: `docker compose up [-d] [--build] [--force-recreate] [--wait] [<service>...]`,
    example: `docker compose up -d

# rebuild images first and block until healthchecks pass
docker compose up -d --build --wait

# just one service and what it depends on
docker compose up -d api`,
    explain:
      'Reconciles the running state with the file: creates networks and volumes, starts containers, and recreates the ones whose configuration or image changed. Running it again after an edit is the normal way to apply changes.',
    notes: [
      'It is docker compose (the v2 plugin), not docker-compose. The old Python binary is end of life.',
      'The project name comes from the directory unless you set -p or COMPOSE_PROJECT_NAME — two checkouts of the same repo will otherwise fight over the same containers.',
      '--build matters: without it, an edited Dockerfile is ignored and yesterday image is reused.',
      '--wait returns only when the healthchecks pass, which is what CI should use instead of sleep.',
    ],
    variants: [
      { name: 'docker compose up --watch', note: 'syncs source changes into running containers as you edit.' },
      { name: 'docker compose start / stop', note: 'starts or stops existing containers without recreating them.' },
      { name: 'docker compose restart <svc>', note: 'restarts the process; does not pick up compose file changes.' },
    ],
    related: ['compose-down', 'compose-build', 'compose-override', 'compose-vs-stack'],
  },
  {
    id: 'compose-down',
    title: 'docker compose down',
    category: 'compose',
    kind: 'command',
    summary: 'Stop and remove the containers and network — and, if you insist, the data.',
    tags: ['stop', 'remove', 'cleanup', 'volumes', 'teardown'],
    syntax: `docker compose down [-v] [--rmi local] [--remove-orphans]`,
    example: `docker compose down

# also delete the named volumes — the database goes with it
docker compose down -v`,
    explain: 'Removes what up created: containers and the project network. Named volumes and images stay unless you ask for them.',
    notes: [
      '-v deletes the volumes declared in the file. On a dev machine that is a reset; anywhere else it is data loss.',
      '--remove-orphans cleans up containers from services you have since deleted from the file.',
      'down then up is not a restart: it recreates containers, so anything written outside a volume is gone.',
    ],
    variants: [
      { name: 'docker compose stop', note: 'stops without removing, so containers and their filesystems survive.' },
      { name: 'docker compose rm', note: 'removes stopped service containers only.' },
    ],
    related: ['compose-up', 'volumes', 'volume-prune'],
  },
  {
    id: 'compose-logs',
    title: 'docker compose logs',
    category: 'compose',
    kind: 'command',
    summary: 'Interleaved logs for the whole project, or one service.',
    tags: ['tail', 'follow', 'debug', 'output'],
    syntax: `docker compose logs [-f] [--tail <n>] [--since <time>] [<service>...]`,
    example: `docker compose logs -f --tail 50

docker compose logs -f api db`,
    explain: 'Prefixes each line with the service name, which makes a failing startup order obvious at a glance.',
    notes: [
      'Without -f it prints what exists and exits — the form you want in CI.',
      'A service that crashed is still in the output; docker compose ps -a shows its exit code.',
      'Logs come from the containers, so docker compose down discards them.',
    ],
    variants: [
      { name: 'docker compose ps -a', note: 'status and exit codes for every service, including the ones that died.' },
      { name: 'docker compose events', note: 'a live stream of create/start/die events for the project.' },
    ],
    related: ['docker-logs', 'compose-up', 'exit-codes'],
  },
  {
    id: 'compose-exec',
    title: 'docker compose exec / run',
    category: 'compose',
    kind: 'command',
    summary: 'A shell in a running service, or a one-off container of it.',
    tags: ['shell', 'migrate', 'one-off', 'task', 'psql'],
    syntax: `docker compose exec <service> <command>      # in the running container
docker compose run --rm <service> <command>  # a new, throwaway container`,
    example: `docker compose exec db psql -U postgres shop

# migrations, in a fresh container that disappears afterwards
docker compose run --rm api npm run migrate`,
    explain:
      'exec attaches to what is already running; run starts a new container from the same definition. Use run for tasks (migrations, seeds, one-off scripts) so they do not depend on the service being up.',
    notes: [
      'docker compose run does not publish the service ports by default — deliberately, so it cannot collide with the running one.',
      'Always pass --rm to run, or you accumulate stopped containers nobody looks at again.',
      'exec needs the service running; run does not.',
    ],
    variants: [
      { name: 'docker compose run --rm --entrypoint sh <svc>', note: 'a shell in the image when its entrypoint gets in the way.' },
      { name: 'docker compose exec -u root <svc> sh', note: 'root shell in a container that runs unprivileged.' },
    ],
    related: ['docker-exec', 'compose-up', 'compose-depends-on'],
  },
  {
    id: 'compose-build',
    title: 'docker compose build / pull',
    category: 'compose',
    kind: 'command',
    summary: 'Build the services that have a build section; pull the ones that do not.',
    tags: ['build', 'pull', 'image', 'cache', 'ci'],
    syntax: `docker compose build [--no-cache] [--pull] [<service>...]
docker compose pull [<service>...]`,
    example: `docker compose build --pull api
docker compose pull db
docker compose up -d`,
    explain: 'Separates image preparation from starting the stack, which is what a CI pipeline wants: build, push, then deploy.',
    notes: [
      'A service with both image: and build: builds and tags with that image name — which is how you build locally and push the same tag.',
      '--pull refreshes the base image; --no-cache rebuilds everything.',
      'docker compose up does not rebuild by itself; without --build you can chase a bug that was fixed in a file the running image never saw.',
    ],
    variants: [
      { name: 'docker compose push', note: 'pushes the built images, for the deploy step.' },
      { name: 'docker compose config', note: 'the fully resolved file, after variables and overrides.' },
    ],
    related: ['docker-build', 'compose-up', 'compose-config', 'compose-vs-stack'],
  },
  {
    id: 'compose-config',
    title: 'docker compose config',
    category: 'compose',
    kind: 'command',
    summary: 'Print the file as Compose actually understands it.',
    tags: ['validate', 'resolve', 'interpolation', 'merge', 'debug'],
    syntax: `docker compose config [--services] [--profiles] [-q]`,
    example: `# what will actually run, after .env and every override file
docker compose config

# validate only — exits non-zero on an error, good for CI
docker compose config -q`,
    explain:
      'Merges every file in play, substitutes variables and prints the result. The first thing to run when a setting seems to be ignored.',
    notes: [
      'An unset variable silently becomes an empty string. This is how you find that.',
      'It shows the merge result of compose.yml plus every -f and the override file, in order.',
      'Secrets appear in the output, so do not paste it into a ticket without reading it.',
    ],
    variants: [
      { name: 'docker compose config --services', note: 'just the service names, handy in scripts.' },
      { name: 'docker compose convert', note: 'the older name for the same thing.' },
    ],
    related: ['compose-env', 'compose-override', 'compose-profiles', 'compose-up'],
  },
  {
    id: 'compose-env',
    title: 'Environment and .env',
    category: 'compose',
    kind: 'practice',
    summary: 'Three different things called environment, and which one wins.',
    tags: ['.env', 'env_file', 'interpolation', 'variables', 'precedence'],
    lang: 'yaml',
    syntax: `services:
  api:
    image: ghcr.io/acme/shop:\${TAG:-1.4}   # interpolation, from .env or the shell
    env_file: [.env.api]                   # variables INSIDE the container
    environment:
      - NODE_ENV=production                # same, and wins over env_file`,
    example: `# .env  (used for interpolation in the compose file itself)
TAG=1.4
POSTGRES_PASSWORD=devonly

# compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?set it}`,
    explain:
      '.env fills placeholders in the compose file. env_file and environment: set variables inside the container. They look alike and are not the same thing.',
    notes: [
      'Precedence, strongest first: the shell environment, then environment:, then env_file, then .env.',
      '${VAR:?message} makes a missing value fail loudly instead of becoming empty.',
      'Do not commit a .env with real credentials. For production use secrets, or an env file the deploy provides.',
      'docker stack deploy ignores env_file entirely — resolve it with docker compose config first, or use secrets.',
    ],
    variants: [
      { name: 'docker compose --env-file <file>', note: 'uses a different interpolation file, e.g. per environment.' },
      { name: 'docker compose config', note: 'shows exactly what the substitutions produced.' },
    ],
    related: ['compose-config', 'compose-vs-stack', 'swarm-secret-use', 'secrets-in-env'],
  },
  {
    id: 'compose-depends-on',
    title: 'depends_on and healthchecks',
    category: 'compose',
    kind: 'practice',
    summary: 'Start order is not readiness — wait for healthy.',
    tags: ['startup order', 'race', 'wait for it', 'condition', 'readiness'],
    lang: 'yaml',
    syntax: `services:
  api:
    depends_on:
      db:
        condition: service_healthy
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10`,
    example: `services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10
  api:
    image: ghcr.io/acme/shop:1.4
    depends_on:
      db:
        condition: service_healthy`,
    explain:
      'A bare depends_on only orders the starts: the database container exists, but Postgres inside it is still booting. condition: service_healthy makes Compose wait for the healthcheck.',
    notes: [
      'This is why "connection refused on first boot, fine after a restart" happens.',
      'The application should still retry its connection — the orchestrator cannot guarantee ordering forever.',
      'docker stack deploy ignores depends_on completely. In a Swarm, retries in the app are the only answer.',
    ],
    variants: [
      { name: 'condition: service_completed_successfully', note: 'waits for a one-shot service (a migration job) to exit 0.', lang: 'yaml' },
      { name: 'docker compose up --wait', note: 'blocks until everything is healthy, for CI.' },
    ],
    related: ['healthcheck', 'compose-up', 'compose-vs-stack', 'service-not-converging'],
  },
  {
    id: 'compose-override',
    title: 'Override files',
    category: 'compose',
    kind: 'recipe',
    summary: 'One production-shaped base file, plus what differs per environment.',
    tags: ['override', 'merge', '-f', 'dev', 'prod', 'layering'],
    syntax: `docker compose -f compose.yml -f compose.prod.yml up -d`,
    example: `# compose.yml — the shape of production
services:
  api:
    image: ghcr.io/acme/shop:1.4
    ports: ["8080:8080"]

# compose.override.yml — picked up automatically, dev only
services:
  api:
    build: .
    command: npm run dev
    volumes: ["./:/app", "/app/node_modules"]`,
    explain:
      'compose.override.yml is merged automatically; other files are merged in the order given with -f. Later files win, and lists like ports and volumes are replaced wholesale, not appended.',
    notes: [
      'Naming the dev file compose.override.yml means a bare docker compose up is the dev workflow and -f compose.yml alone is production.',
      'Check the result with docker compose config rather than reasoning about the merge rules.',
      'Keep bind mounts and dev commands out of the base file — a stack deploy of it would otherwise carry them.',
    ],
    variants: [
      { name: 'COMPOSE_FILE=a.yml:b.yml', note: 'the same list as an environment variable.' },
      { name: 'extends:', note: 'pulls a service definition from another file, at service granularity.', lang: 'yaml' },
    ],
    related: ['compose-config', 'bind-mount', 'compose-profiles', 'compose-vs-stack'],
  },
  {
    id: 'compose-profiles',
    title: 'Profiles',
    category: 'compose',
    kind: 'command',
    summary: 'Keep optional services in the file without starting them every time.',
    tags: ['optional', 'tooling', 'debug service', 'selective'],
    syntax: `services:
  adminer:
    profiles: ["tools"]

# docker compose --profile tools up -d`,
    example: `services:
  api:
    image: ghcr.io/acme/shop:1.4
  adminer:
    image: adminer
    profiles: ["tools"]
    ports: ["8081:8080"]

# everyday
docker compose up -d
# when you need the database UI
docker compose --profile tools up -d adminer`,
    explain: 'A service with a profile is skipped unless that profile is enabled. Ideal for database UIs, seeders, load generators and other things you want documented but not running.',
    notes: [
      'A profiled service is also skipped by down, which can leave it running — docker compose --profile tools down.',
      'COMPOSE_PROFILES in the environment enables them without the flag.',
      'Naming a profiled service explicitly on the command line enables its profile implicitly.',
    ],
    variants: [
      { name: 'docker compose config --profiles', note: 'lists every profile defined in the file.' },
    ],
    related: ['compose-up', 'compose-override', 'compose-config'],
  },
  {
    id: 'compose-vs-stack',
    title: 'Compose vs stack deploy',
    category: 'compose',
    kind: 'practice',
    summary: 'The same file, two engines — and the keys each one ignores.',
    tags: ['difference', 'swarm', 'deploy key', 'build', 'depends_on'],
    syntax: `docker compose up -d                        # one host, builds images, honours depends_on
docker stack deploy -c compose.yml shop     # a Swarm, needs pushed images, honours deploy:`,
    example: `services:
  api:
    image: ghcr.io/acme/shop:1.4   # stack deploy needs a pushed image
    deploy:                        # ignored by compose up
      replicas: 3
      update_config: { parallelism: 1, delay: 10s, order: start-first }
    build: .                       # ignored by stack deploy`,
    explain:
      'Compose runs containers on this machine; stack deploy hands the file to a Swarm to schedule. Each silently ignores the parts meant for the other, which is where the confusion comes from.',
    notes: [
      'Ignored by stack deploy: build, depends_on, env_file, restart, network_mode, profiles, container_name, and the dev-only bind mounts.',
      'Ignored by compose up: the whole deploy: block except a couple of keys — replicas, placement and update_config do nothing locally.',
      'Stack deploy pulls images from a registry on each node; it will not build for you. Push first, and add --with-registry-auth for a private registry.',
      'Keep one base file that is valid for both, and a dev override for the compose-only parts.',
    ],
    variants: [
      { name: 'docker stack deploy -c <file> <name>', note: 'the Swarm side of the same file.' },
      { name: 'docker compose config', note: 'resolves variables and overrides before you hand it to a stack.' },
    ],
    related: ['stack-deploy', 'compose-override', 'compose-depends-on', 'registry-auth'],
  },

  // ----------------------------------------------------------------- swarm
  {
    id: 'swarm-init',
    title: 'docker swarm init',
    category: 'swarm',
    kind: 'command',
    summary: 'Turn this machine into a one-node cluster you can grow.',
    tags: ['cluster', 'manager', 'bootstrap', 'advertise-addr'],
    syntax: `docker swarm init [--advertise-addr <ip>] [--listen-addr <ip>:<port>] [--data-path-port <port>]`,
    example: `docker swarm init --advertise-addr 10.0.0.10

# it prints the worker join command; keep it
# docker swarm join --token SWMTKN-1-... 10.0.0.10:2377`,
    explain:
      'Creates the Raft store, makes this node the first manager and prints a join command for workers. From here on the node speaks service and stack, not just run.',
    notes: [
      'On a machine with several interfaces, --advertise-addr is mandatory in practice — pick the address other nodes can actually reach.',
      'Open 2377/tcp (cluster management), 7946/tcp+udp (node gossip) and 4789/udp (overlay data) between nodes, and nowhere else.',
      'A single-node swarm is a perfectly reasonable way to get secrets, rolling updates and healthcheck-gated deploys on one server.',
      'Managers run tasks too by default. On a bigger cluster, drain them so the control plane is not fighting the workload.',
    ],
    variants: [
      { name: 'docker info | grep -i swarm', note: 'whether this node is in a swarm, and what role it has.' },
      { name: 'docker swarm leave --force', note: 'undoes it on the last manager — the cluster and its services are gone.' },
      { name: 'docker swarm update --autolock=true', note: 'encrypts the Raft logs at rest; keep the unlock key somewhere safe.' },
    ],
    related: ['swarm-join', 'swarm-join-token', 'node-ls', 'swarm-quorum', 'overlay-network'],
  },
  {
    id: 'swarm-join',
    title: 'docker swarm join',
    category: 'swarm',
    kind: 'command',
    summary: 'Add this machine to an existing cluster, as a worker or a manager.',
    tags: ['worker', 'manager', 'add node', 'token', 'scale out'],
    syntax: `docker swarm join --token <token> <manager-ip>:2377 [--advertise-addr <ip>]`,
    example: `# on the new machine, with the token from the manager
docker swarm join \\
  --token SWMTKN-1-4xj...-9qc 10.0.0.10:2377

# back on a manager
docker node ls`,
    explain: 'The token decides the role: worker tokens make workers, manager tokens make managers. The node appears in docker node ls on any manager within seconds.',
    notes: [
      'Only managers can run docker node, service and stack commands. A worker refuses with "this node is not a swarm manager".',
      'Clock skew and a blocked 2377 are the two things that make a join hang.',
      'Docker versions across nodes should be close; a large gap between engine versions causes odd scheduling failures.',
    ],
    variants: [
      { name: 'docker swarm join-token worker -q', note: 'prints just the worker token, for an install script.' },
      { name: 'docker swarm leave', note: 'removes this node from the cluster (from the node itself).' },
      { name: 'docker node rm <node>', note: 'removes a departed node from the manager view.' },
    ],
    related: ['swarm-join-token', 'swarm-init', 'node-ls', 'node-rm-leave'],
  },
  {
    id: 'swarm-join-token',
    title: 'docker swarm join-token',
    category: 'swarm',
    kind: 'command',
    summary: 'Print (or rotate) the token new nodes join with.',
    tags: ['token', 'rotate', 'secret', 'enrol'],
    syntax: `docker swarm join-token worker|manager [-q]
docker swarm join-token --rotate worker|manager`,
    example: `# the full join command to paste on a new node
docker swarm join-token worker

# just the token, for automation
docker swarm join-token -q worker

# someone pasted it in a ticket
docker swarm join-token --rotate worker`,
    explain: 'Tokens are cluster credentials: anyone holding the worker token can join and run tasks; anyone with the manager token effectively owns the cluster.',
    notes: [
      'Rotating invalidates the old token immediately. Existing nodes stay joined — only new joins are affected.',
      'Never put the manager token in CI or a wiki. Workers are the default for a reason.',
      'Managers should be an odd number (3 or 5). More is not better: every manager takes part in Raft.',
    ],
    variants: [
      { name: 'docker swarm ca --rotate', note: 'rotates the cluster certificate authority as well.' },
      { name: 'docker swarm unlock-key --rotate', note: 'for an autolocked swarm.' },
    ],
    related: ['swarm-join', 'swarm-quorum', 'swarm-init'],
  },
  {
    id: 'node-ls',
    title: 'docker node ls / inspect',
    category: 'swarm',
    kind: 'command',
    summary: 'Who is in the cluster, what role, and are they healthy.',
    tags: ['nodes', 'status', 'leader', 'reachable', 'availability'],
    syntax: `docker node ls [--filter <k>=<v>]
docker node inspect <node> --pretty`,
    example: `docker node ls
# ID  HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
# a1* mgr-1     Ready   Active        Leader
# b2  wrk-1     Ready   Active

docker node inspect wrk-1 --pretty | head -20`,
    explain:
      'STATUS is whether the node is reachable, AVAILABILITY is whether it may run tasks, and MANAGER STATUS shows Leader / Reachable / Unreachable for the Raft members. The asterisk marks the node you are on.',
    notes: [
      'Down nodes keep their tasks listed until the orchestrator reschedules them — docker service ps shows the shadow entries.',
      'An Unreachable manager is a quorum problem in the making; fix it before touching another one.',
      'Node labels shown by inspect are what placement constraints match on.',
    ],
    variants: [
      { name: 'docker node ps <node>', note: 'the tasks running on one node.' },
      { name: 'docker node ls --filter role=manager', note: 'just the managers.' },
      { name: 'docker info', note: 'the local view: role, manager count, node count.' },
    ],
    related: ['node-availability', 'node-labels', 'swarm-quorum', 'service-ps'],
  },
  {
    id: 'node-availability',
    title: 'docker node update --availability',
    category: 'swarm',
    kind: 'command',
    summary: 'Drain a node before maintenance; make it active again after.',
    tags: ['drain', 'pause', 'active', 'maintenance', 'reschedule', 'cordon'],
    syntax: `docker node update --availability active|pause|drain <node>`,
    example: `# move every task off wrk-1 and keep new ones away
docker node update --availability drain wrk-1
docker node ps wrk-1        # should empty out

# after the reboot
docker node update --availability active wrk-1`,
    explain:
      'drain stops the node taking work and reschedules what it has elsewhere; pause only stops new placements, leaving current tasks alone; active is normal.',
    notes: [
      'Drain before rebooting a node, or the cluster discovers the outage the hard way.',
      'Draining a node whose replicas cannot fit elsewhere leaves tasks Pending — check capacity first.',
      'Draining managers is a common production setup, so the control plane is not competing with workloads.',
      'A drained node still participates in Raft if it is a manager; availability is about tasks, not management.',
    ],
    variants: [
      { name: 'docker node update --label-add', note: 'labels for placement constraints, set the same way.' },
      { name: 'docker node promote / demote', note: 'changes the manager role rather than availability.' },
    ],
    related: ['node-ls', 'node-labels', 'service-placement', 'no-suitable-node'],
  },
  {
    id: 'node-promote-demote',
    title: 'docker node promote / demote',
    category: 'swarm',
    kind: 'command',
    summary: 'Change a worker into a manager, or back.',
    tags: ['manager', 'worker', 'raft', 'role', 'ha'],
    syntax: `docker node promote <node>...
docker node demote <node>...`,
    example: `# from one manager to three, for real availability
docker node promote wrk-1 wrk-2
docker node ls --filter role=manager`,
    explain: 'Managers hold the Raft store and can schedule. Promoting two workers turns a single point of failure into a cluster that survives losing one machine.',
    notes: [
      'Keep managers odd: 3 tolerates one failure, 5 tolerates two. An even count buys nothing and makes quorum easier to lose.',
      'Demote before removing a manager, never the other way round.',
      'Managers are chatty — on a small cluster give them the least loaded machines, or drain them.',
    ],
    variants: [
      { name: 'docker node update --role manager <node>', note: 'the same thing spelled as an update.' },
      { name: 'docker node ls', note: 'MANAGER STATUS shows who is Leader and who is merely Reachable.' },
    ],
    related: ['swarm-quorum', 'node-ls', 'node-rm-leave', 'node-availability'],
  },
  {
    id: 'swarm-quorum',
    title: 'Quorum and losing managers',
    category: 'swarm',
    kind: 'practice',
    summary: 'Lose more than half the managers and the cluster stops accepting changes.',
    tags: ['raft', 'ha', 'split brain', 'force-new-cluster', 'disaster'],
    syntax: `# managers  tolerates
#     1         0
#     3         1
#     5         2`,
    example: `# only one manager left of three, cluster read-only:
docker node ls
# Error response from daemon: rpc error: code = Unknown desc = The swarm does not have a leader

# last resort, on the surviving manager — rebuilds a single-manager cluster
docker swarm init --force-new-cluster`,
    explain:
      'Managers agree through Raft, which needs a majority. Below it, running services keep running, but nothing can be deployed, scaled or updated until quorum is restored.',
    notes: [
      'Running services survive a quorum loss. It is the control plane that stops, which is a bad afternoon rather than an outage — unless a node also fails.',
      'Recover by bringing a manager back if you can. --force-new-cluster discards the other managers and should be the last option.',
      'Three managers spread across failure domains is the smallest sensible production shape.',
      'Back up /var/lib/docker/swarm on a manager: that is the cluster state, secrets included.',
    ],
    variants: [
      { name: 'docker swarm init --force-new-cluster', note: 'promotes the survivor to a fresh single-manager cluster.' },
      { name: 'docker node demote / rm', note: 'clean up the dead managers once you are back in control.' },
    ],
    related: ['node-promote-demote', 'node-ls', 'swarm-init', 'node-rm-leave'],
  },
  {
    id: 'node-rm-leave',
    title: 'docker swarm leave / node rm',
    category: 'swarm',
    kind: 'command',
    summary: 'Take a node out of the cluster properly.',
    tags: ['remove node', 'decommission', 'leave', 'down'],
    syntax: `# on the node itself
docker swarm leave [--force]
# then on a manager
docker node rm <node>`,
    example: `docker node update --availability drain wrk-2   # move its work first
# on wrk-2
docker swarm leave
# on a manager
docker node rm wrk-2`,
    explain: 'Drain, leave, then remove. Doing it in that order means no task is killed without a replacement being scheduled first.',
    notes: [
      'A manager must be demoted before it can leave; --force on the last manager destroys the cluster.',
      'docker node rm refuses while the node is still Ready — that guard is deliberate.',
      'Leaving does not clean the node: containers, images and volumes stay on the machine.',
    ],
    variants: [
      { name: 'docker node rm --force', note: 'removes an unreachable node that cannot leave by itself.' },
      { name: 'docker swarm leave --force', note: 'on the last manager: dissolves the swarm.' },
    ],
    related: ['node-availability', 'node-promote-demote', 'swarm-quorum', 'node-ls'],
  },
  {
    id: 'node-labels',
    title: 'Node labels and placement',
    category: 'swarm',
    kind: 'recipe',
    summary: 'Tag nodes, then pin services to the right ones.',
    tags: ['constraint', 'label', 'ssd', 'zone', 'scheduling'],
    syntax: `docker node update --label-add <key>=<value> <node>
docker service create --constraint 'node.labels.<key> == <value>' ...`,
    example: `docker node update --label-add storage=ssd wrk-1
docker node update --label-add zone=a wrk-1

docker service create --name db \\
  --constraint 'node.labels.storage == ssd' \\
  --mount type=volume,source=shop-db,target=/var/lib/postgresql/data \\
  postgres:16`,
    explain:
      'Labels are how you express "this service needs that kind of machine": fast disks, a licence, a region. Constraints are hard — a task that cannot match one stays Pending rather than landing somewhere wrong.',
    notes: [
      'Built-in constraints need no labels: node.role, node.hostname, node.id, node.platform.os and .arch.',
      'Use --placement-pref spread=node.labels.zone to spread replicas across zones instead of pinning them.',
      'A stateful service with a local volume must be constrained to its node, or a reschedule finds an empty volume elsewhere.',
      'Labels set here are node labels; engine labels (from daemon.json) are a separate namespace, node.labels vs engine.labels.',
    ],
    variants: [
      { name: '--label-rm <key>', note: 'removes a label.' },
      { name: 'deploy.placement.constraints', note: 'the stack-file form of the same thing.', lang: 'yaml' },
    ],
    related: ['service-placement', 'swarm-data-locality', 'node-ls', 'no-suitable-node'],
  },

  // -------------------------------------------------------------- services
  {
    id: 'service-create',
    title: 'docker service create',
    category: 'services',
    kind: 'command',
    summary: 'Run something on the cluster and keep it running.',
    tags: ['replicas', 'swarm run', 'schedule', 'task', 'deploy'],
    syntax: `docker service create --name <name> [--replicas <n>] [-p <pub>:<target>] \\
  [--network <net>] [-e K=V] [--constraint <expr>] <image>:<tag> [command]`,
    example: `docker service create \\
  --name api \\
  --replicas 3 \\
  --network shop-net \\
  --publish 8080:8080 \\
  --env NODE_ENV=production \\
  --limit-memory 512m --reserve-memory 256m \\
  --update-parallelism 1 --update-delay 10s --update-order start-first \\
  --health-cmd 'wget -qO- http://localhost:8080/healthz || exit 1' \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'Declares desired state: n tasks of this image, with these settings. The orchestrator schedules them, restarts them when they die and moves them when a node goes away.',
    notes: [
      'Only a manager can create a service, and the image must be pullable from every node — a locally built image that was never pushed fails on the other machines.',
      'Set the update policy at create time. Deploying without it replaces every replica at once, which is a self-inflicted outage.',
      'docker run on a swarm node still works and is invisible to the cluster: no rescheduling, no rolling updates, no mesh.',
      'The service is reachable by name from other services on the same overlay network.',
    ],
    variants: [
      { name: 'docker stack deploy', note: 'the declarative form — a compose file instead of a long command line.' },
      { name: 'docker service create --mode global', note: 'one task per node instead of a replica count.' },
      { name: 'docker service create --detach=false', note: 'waits and prints convergence progress instead of returning immediately.' },
    ],
    related: ['service-ls', 'service-update', 'stack-deploy', 'service-placement', 'registry-auth'],
  },
  {
    id: 'service-ls',
    title: 'docker service ls',
    category: 'services',
    kind: 'command',
    summary: 'Every service, and whether it has as many replicas as it should.',
    tags: ['list', 'replicas', 'converged', 'status'],
    syntax: `docker service ls [--filter <k>=<v>]`,
    example: `docker service ls
# ID   NAME       MODE         REPLICAS  IMAGE
# k9x  shop_api   replicated   3/3       ghcr.io/acme/shop:1.4
# m2p  shop_db    replicated   0/1       postgres:16     <- not running`,
    explain: 'The REPLICAS column is running/desired. Anything other than n/n means the cluster is trying and not succeeding — that is your signal to look at docker service ps.',
    notes: [
      '0/1 for more than a few seconds is a failing task, a missing image or an unsatisfiable constraint.',
      'During a rolling update the count dips deliberately; if it stays down, the update is stuck.',
      'A global service shows the node count as its desired number.',
    ],
    variants: [
      { name: 'docker service ps <service>', note: 'the per-task detail, including why the last one died.' },
      { name: 'docker stack services <stack>', note: 'the same view scoped to one stack.' },
    ],
    related: ['service-ps', 'service-not-converging', 'stack-services'],
  },
  {
    id: 'service-ps',
    title: 'docker service ps',
    category: 'services',
    kind: 'command',
    summary: 'The tasks of a service — where they run, and why they failed.',
    tags: ['tasks', 'error', 'node', 'history', 'rejected'],
    syntax: `docker service ps [--no-trunc] [--filter desired-state=running] <service>`,
    example: `docker service ps shop_api --no-trunc

# only what is supposed to be running, not the history of dead tasks
docker service ps shop_api --filter desired-state=running`,
    explain:
      'Lists current and recent tasks with their node, desired state, current state and error. The ERROR column with --no-trunc is usually the whole answer: no such image, permission denied, OOM, failing healthcheck.',
    notes: [
      'Old failed tasks stay listed by design — that history is how you see a crash loop.',
      'A task stuck in Pending was never placed: constraint, resource reservation or no suitable node.',
      '"task: non-zero exit (1)" means the container ran and died; docker service logs tells you what it said.',
      'To exec into a task, find its node here, then run docker ps on that node.',
    ],
    variants: [
      { name: 'docker node ps <node>', note: 'the same information from the node side.' },
      { name: 'docker service logs <service>', note: 'the output of every task, aggregated.' },
      { name: 'docker inspect <task-id>', note: 'the raw task record, including the placement decision.' },
    ],
    related: ['service-logs', 'service-not-converging', 'no-suitable-node', 'service-ls'],
  },
  {
    id: 'service-scale',
    title: 'docker service scale',
    category: 'services',
    kind: 'command',
    summary: 'Change the replica count of a running service.',
    tags: ['replicas', 'scale up', 'scale down', 'capacity'],
    syntax: `docker service scale <service>=<replicas> [<service>=<replicas>...]
docker service update --replicas <n> <service>`,
    example: `docker service scale shop_api=6

# several at once, before a sale
docker service scale shop_api=6 shop_worker=4`,
    explain: 'Adjusts desired state; the scheduler places or stops tasks to match. Scaling up is limited by what the nodes can actually fit.',
    notes: [
      'Tasks that cannot be placed sit Pending rather than failing — check docker service ps after scaling up.',
      'Scaling down picks tasks to stop by its own rules; do not assume the newest goes first.',
      'A stateful service backed by one local volume cannot meaningfully scale past one.',
      'Changing replicas in the stack file and redeploying is the declarative equivalent, and survives the next deploy.',
    ],
    variants: [
      { name: 'docker service update --replicas 0', note: 'stops a service without deleting it or its configuration.' },
      { name: 'deploy.replicas', note: 'the stack-file value, which a redeploy will restore.', lang: 'yaml' },
    ],
    related: ['service-update', 'service-ps', 'stack-deploy', 'no-suitable-node'],
  },
  {
    id: 'service-update',
    title: 'docker service update',
    category: 'services',
    kind: 'command',
    summary: 'Change a running service — image, env, ports, limits — without downtime.',
    tags: ['deploy', 'rolling update', 'image', 'restart', 'force'],
    syntax: `docker service update [--image <img>:<tag>] [--env-add K=V] [--env-rm K] \\
  [--publish-add <p>] [--replicas <n>] [--force] <service>`,
    example: `# the deploy
docker service update --image ghcr.io/acme/shop:1.5 shop_api

# add a variable and restart the tasks in place
docker service update --env-add FEATURE_X=on shop_api

# restart every task without changing anything
docker service update --force shop_api`,
    explain:
      'Applies the change task by task, according to the update policy: start or stop a batch, wait, check health, move on. That is what makes it a rolling deploy rather than a restart.',
    notes: [
      'Every update replaces containers. Anything written inside them is gone — another reason state belongs in volumes.',
      '--force is the way to restart tasks (to re-pull a moving tag, or unstick something) without changing the spec.',
      'If the new version fails its healthcheck, the update pauses — with --update-failure-action rollback it goes back on its own.',
      'Updating a service created by a stack drifts from the stack file: the next docker stack deploy overwrites your change.',
    ],
    variants: [
      { name: 'docker service update --image <img> --update-order start-first', note: 'starts the new task before stopping the old, for zero-gap deploys.' },
      { name: 'docker service rollback <svc>', note: 'returns to the previous spec.' },
      { name: 'docker stack deploy -c compose.yml <stack>', note: 'the declarative deploy, which is what CI should run.' },
    ],
    related: ['update-config', 'service-rollback', 'stack-deploy', 'healthcheck'],
  },
  {
    id: 'update-config',
    title: 'Rolling update settings',
    category: 'services',
    kind: 'practice',
    summary: 'How fast to replace tasks, and what to do when one fails.',
    tags: ['parallelism', 'delay', 'order', 'failure-action', 'monitor', 'zero downtime'],
    syntax: `--update-parallelism <n>       # tasks at a time (0 = all at once)
--update-delay <duration>      # wait between batches
--update-order start-first|stop-first
--update-failure-action pause|continue|rollback
--update-monitor <duration>    # how long a task must survive to count as good`,
    example: `docker service update \\
  --update-parallelism 1 \\
  --update-delay 15s \\
  --update-order start-first \\
  --update-monitor 30s \\
  --update-failure-action rollback \\
  --image ghcr.io/acme/shop:1.5 shop_api`,
    explain:
      'The defaults replace one task at a time with no delay, stop-first, and pause on failure. Adding start-first, a delay and rollback turns a deploy into something you can run during the day.',
    notes: [
      'start-first needs room for an extra replica and a service that tolerates two versions at once; a database migration usually does not.',
      'Without a healthcheck, "succeeded" only means the process started — so a broken build rolls out cleanly to every replica.',
      '--update-monitor should exceed your startup time, or a task that dies after 20 seconds still counts as a success.',
      'Set these in the stack file (deploy.update_config) so they apply to every deploy, not just the one you typed.',
    ],
    variants: [
      { name: 'deploy.update_config', note: 'the stack-file block with the same keys.', lang: 'yaml' },
      { name: 'deploy.rollback_config', note: 'the same knobs for the rollback direction.', lang: 'yaml' },
    ],
    related: ['service-update', 'service-rollback', 'healthcheck', 'stack-deploy'],
  },
  {
    id: 'service-rollback',
    title: 'docker service rollback',
    category: 'services',
    kind: 'command',
    summary: 'Go back to the previous spec — the fastest fix in a bad deploy.',
    tags: ['revert', 'undo', 'previous', 'incident'],
    syntax: `docker service rollback <service>`,
    example: `docker service rollback shop_api
docker service ps shop_api --filter desired-state=running`,
    explain: 'Swarm keeps the previous service spec. Rolling back restores it — image, env, ports and all — using the rollback policy rather than the update one.',
    notes: [
      'It goes back exactly one step. Two bad deploys in a row means deploying the known-good tag explicitly.',
      'Data is not rolled back. A migration the old version cannot read makes this worse, not better — that is a forward-fix situation.',
      'For a stack, rolling back a single service leaves it out of step with the file; redeploy the previous file instead.',
    ],
    variants: [
      { name: '--update-failure-action rollback', note: 'does this automatically when the new tasks fail.' },
      { name: 'docker service update --image <previous-tag>', note: 'explicit, and clearer in an incident log.' },
    ],
    related: ['service-update', 'update-config', 'stack-deploy', 'latest-tag'],
  },
  {
    id: 'service-logs',
    title: 'docker service logs',
    category: 'services',
    kind: 'command',
    summary: 'Logs from every task of a service, whichever node they run on.',
    tags: ['tail', 'follow', 'aggregate', 'task', 'debug'],
    syntax: `docker service logs [-f] [--tail <n>] [--since <t>] [--no-task-ids] <service|task>`,
    example: `docker service logs -f --tail 100 shop_api

# one task, when only one replica is misbehaving
docker service logs -f shop_api.2`,
    explain: 'Aggregates across tasks and nodes, prefixing each line with the task. Saves ssh-ing to a node to find out what a replica is complaining about.',
    notes: [
      'Only managers can run it, and only for services — not for containers started with docker run.',
      'It shows logs from failed tasks too, which is how you read the output of a container that died at startup.',
      'With a remote logging driver there is nothing to show; go to the log system instead.',
      'Interleaving across nodes is approximate: timestamps (-t) beat line order for reconstructing an incident.',
    ],
    variants: [
      { name: 'docker service logs --raw', note: 'drops the task prefix, for piping into another tool.' },
      { name: 'docker logs <container>', note: 'on the node itself, once docker service ps tells you which node.' },
    ],
    related: ['service-ps', 'docker-logs', 'service-not-converging', 'log-rotation'],
  },
  {
    id: 'service-mode',
    title: 'Replicated vs global services',
    category: 'services',
    kind: 'practice',
    summary: 'n copies somewhere, or exactly one on every node.',
    tags: ['global', 'replicated', 'daemon set', 'agent', 'per node'],
    syntax: `docker service create --replicas <n> ...   # replicated (default)
docker service create --mode global ...    # one task per eligible node`,
    example: `# a log shipper or metrics agent belongs on every node
docker service create --name node-exporter \\
  --mode global \\
  --mount type=bind,source=/proc,target=/host/proc,readonly \\
  prom/node-exporter:latest`,
    explain:
      'Replicated is for stateless workloads you scale by number. Global is for per-node agents: monitoring, log shipping, storage plugins — new nodes get a task automatically.',
    notes: [
      'A global service cannot be scaled; it follows the node count and its constraints.',
      'Constraints still apply, so --mode global plus a constraint means "every node of this kind".',
      'Draining a node stops its global task too.',
    ],
    variants: [
      { name: 'deploy.mode: global', note: 'the stack-file equivalent.', lang: 'yaml' },
      { name: 'global-job / replicated-job', note: 'run-to-completion variants, for batch work rather than daemons.' },
    ],
    related: ['service-create', 'service-placement', 'node-availability'],
  },
  {
    id: 'service-placement',
    title: 'Placement constraints and preferences',
    category: 'services',
    kind: 'practice',
    summary: 'Where a task may run, and how replicas should be spread.',
    tags: ['constraint', 'spread', 'affinity', 'zone', 'node.role', 'pending'],
    syntax: `--constraint 'node.role == worker'
--constraint 'node.labels.storage == ssd'
--placement-pref 'spread=node.labels.zone'`,
    example: `docker service create --name api --replicas 6 \\
  --constraint 'node.role == worker' \\
  --placement-pref 'spread=node.labels.zone' \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'Constraints are hard filters — no matching node means the task stays Pending. Preferences are soft: they shape the distribution across a label without blocking placement.',
    notes: [
      'Keeping workloads off managers (node.role == worker) is the most common constraint in production.',
      'Spreading by zone is what stops all six replicas landing in one rack.',
      'Constraints are evaluated at scheduling time; adding a label later does not move running tasks (force an update to reshuffle).',
      'Over-constraining is the usual cause of "no suitable node" after a node goes down.',
    ],
    variants: [
      { name: 'deploy.placement.constraints / preferences', note: 'the stack-file form.', lang: 'yaml' },
      { name: 'docker service update --constraint-add/--constraint-rm', note: 'changes them on a running service.' },
    ],
    related: ['node-labels', 'no-suitable-node', 'service-mode', 'swarm-data-locality'],
  },
  {
    id: 'service-resources',
    title: 'Service limits and reservations',
    category: 'services',
    kind: 'practice',
    summary: 'Limits cap a task; reservations decide whether it gets scheduled at all.',
    tags: ['memory', 'cpu', 'reserve', 'limit', 'capacity', 'bin packing'],
    syntax: `--limit-memory <size> --limit-cpu <n>
--reserve-memory <size> --reserve-cpu <n>`,
    example: `docker service create --name api \\
  --replicas 4 \\
  --reserve-memory 256m --limit-memory 512m \\
  --reserve-cpu 0.25 --limit-cpu 1 \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'A limit is the cgroup ceiling — exceed the memory one and the task is killed. A reservation is a promise the scheduler honours: a node without that much free capacity will not be given the task.',
    notes: [
      'Reservations are how bin packing works. Without them the scheduler assumes tasks are free and over-commits the node.',
      'Reserve more than the whole cluster can offer and tasks sit Pending forever — the other half of "no suitable node".',
      'Reservations are not enforced at runtime; only limits are.',
      'Set both. Reservation ≈ steady state, limit ≈ the point past which something is wrong.',
    ],
    variants: [
      { name: 'deploy.resources.limits / reservations', note: 'the stack-file block.', lang: 'yaml' },
      { name: 'docker node inspect <node> --format \'{{.Description.Resources}}\'', note: 'what a node actually has to give.' },
    ],
    related: ['resource-limits', 'no-suitable-node', 'service-placement', 'docker-stats'],
  },
  {
    id: 'service-mounts',
    title: 'Mounts on a service',
    category: 'services',
    kind: 'command',
    summary: 'Attach a volume, bind or tmpfs to every task.',
    tags: ['--mount', 'volume', 'bind', 'readonly', 'stateful'],
    syntax: `--mount type=volume,source=<vol>,target=<path>[,readonly]
--mount type=bind,source=<host-path>,target=<path>,readonly
--mount type=tmpfs,target=<path>,tmpfs-size=<bytes>`,
    example: `docker service create --name db \\
  --constraint 'node.labels.storage == ssd' \\
  --mount type=volume,source=shop-db,target=/var/lib/postgresql/data \\
  --limit-memory 2g \\
  postgres:16`,
    explain:
      'Services take --mount rather than -v. The mount is created on whichever node runs the task, which is exactly the problem with local volumes for stateful services.',
    notes: [
      'A local volume is per node. If the task reschedules, it starts with an empty volume on the new machine and the data is still on the old one.',
      'For anything stateful, either pin the task with a constraint or use a shared volume driver (NFS, cloud block storage).',
      'Bind mounts require the path to exist on every node the task might land on.',
      'Add readonly for configuration mounts; it costs nothing and prevents a surprise.',
    ],
    variants: [
      { name: 'volumes: in a stack file', note: 'the same thing declaratively, with a top-level volumes: block.', lang: 'yaml' },
      { name: 'docker volume create --driver', note: 'where a shared storage backend is configured.' },
    ],
    related: ['swarm-data-locality', 'volumes', 'node-labels', 'volume-create'],
  },
  {
    id: 'service-rm',
    title: 'docker service rm',
    category: 'services',
    kind: 'command',
    summary: 'Delete a service and stop all its tasks.',
    tags: ['delete', 'remove', 'teardown', 'stop'],
    syntax: `docker service rm <service>...`,
    example: `docker service rm shop_api

# stop it without losing the definition
docker service update --replicas 0 shop_api`,
    explain: 'Removes the service definition; the tasks stop immediately, everywhere. Networks, volumes, secrets and configs it used are left alone.',
    notes: [
      'There is no confirmation and no rollback — the spec is gone with it.',
      'Scaling to zero is the reversible version, and keeps the ports and configuration documented in the cluster.',
      'Removing a service from a stack file and redeploying is the declarative way; the stack removes what is no longer declared.',
    ],
    variants: [
      { name: 'docker stack rm <stack>', note: 'removes every service of a stack, plus its networks.' },
      { name: 'docker service update --replicas 0', note: 'pause instead of delete.' },
    ],
    related: ['stack-rm', 'service-scale', 'service-create'],
  },
  {
    id: 'service-inspect',
    title: 'docker service inspect',
    category: 'services',
    kind: 'command',
    summary: 'The full spec of a service — what the cluster thinks it should be running.',
    tags: ['spec', 'json', 'pretty', 'drift', 'image digest'],
    syntax: `docker service inspect --pretty <service>
docker service inspect --format '<go-template>' <service>`,
    example: `docker service inspect --pretty shop_api

# the exact image the tasks are pinned to, digest included
docker service inspect shop_api \\
  --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'

# the update policy actually in force
docker service inspect shop_api --format '{{json .Spec.UpdateConfig}}'`,
    explain:
      'Shows desired state, not reality: image (with the resolved digest), env, mounts, secrets, placement, resources, update and rollback policy, and the endpoint configuration.',
    notes: [
      '--pretty is the readable summary; the raw JSON is what you diff against your stack file when something has drifted.',
      'The image line carries the digest Swarm pinned at deploy time, which is how you prove every replica runs the same bytes.',
      '.PreviousSpec is the version docker service rollback would restore.',
      'Compare it with docker service ps: inspect is what should be, ps is what is.',
    ],
    variants: [
      { name: 'docker stack config -c <file>', note: 'the other side of the comparison — what the file says.' },
      { name: 'docker service ps <service>', note: 'the actual tasks and their errors.' },
    ],
    related: ['service-update', 'service-rollback', 'service-ps', 'stack-file'],
  },

  // ---------------------------------------------------------------- stacks
  {
    id: 'stack-deploy',
    title: 'docker stack deploy',
    category: 'stacks',
    kind: 'command',
    summary: 'Apply a compose file to the Swarm — the declarative deploy.',
    tags: ['deploy', 'compose file', 'ci', 'apply', 'idempotent'],
    syntax: `docker stack deploy -c <file> [--with-registry-auth] [--prune] <stack-name>`,
    example: `docker stack deploy \\
  -c compose.yml \\
  --with-registry-auth \\
  --prune \\
  shop

docker stack services shop`,
    explain:
      'Creates or updates every service in the file to match it, using each service update policy. Running it again after editing the file is the whole deployment process — the same command whether it is the first deploy or the fiftieth.',
    notes: [
      'Services are named <stack>_<service>, which is why they show up as shop_api and shop_db.',
      '--with-registry-auth forwards your registry credentials to the nodes; without it a private image fails to pull on every node but the one you deployed from.',
      '--prune removes services that are no longer in the file — that is what makes the file the source of truth.',
      'It does not build. Push the image first; a build: section is ignored.',
      'Variables are not interpolated the way compose does it — run docker compose config first and deploy the resolved output if you rely on .env.',
    ],
    variants: [
      { name: 'docker compose config | docker stack deploy -c - <stack>', note: 'resolves variables and overrides, then deploys the result.' },
      { name: 'docker stack deploy --resolve-image changed', note: 'controls digest pinning at deploy time.' },
      { name: 'docker service update --image', note: 'the imperative single-service equivalent.' },
    ],
    related: ['stack-file', 'compose-vs-stack', 'registry-auth', 'stack-services', 'update-config'],
  },
  {
    id: 'stack-file',
    title: 'The deploy: block',
    category: 'stacks',
    kind: 'practice',
    summary: 'Everything Swarm-specific lives under deploy: in the compose file.',
    tags: ['yaml', 'replicas', 'update_config', 'placement', 'resources', 'v3'],
    lang: 'yaml',
    syntax: `services:
  api:
    image: ghcr.io/acme/shop:1.4
    deploy:
      replicas: 3
      update_config: { parallelism: 1, delay: 15s, order: start-first, failure_action: rollback }
      restart_policy: { condition: on-failure, delay: 5s, max_attempts: 3 }
      placement: { constraints: ["node.role == worker"] }
      resources:
        limits: { memory: 512M }
        reservations: { memory: 256M }`,
    example: `services:
  api:
    image: ghcr.io/acme/shop:1.4
    networks: [shop-net]
    ports: ["8080:8080"]
    secrets: [db_password]
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/healthz || exit 1"]
      interval: 15s
      start_period: 30s
    deploy:
      replicas: 3
      update_config: { parallelism: 1, delay: 15s, order: start-first, failure_action: rollback }
      placement: { constraints: ["node.role == worker"] }
      resources:
        limits: { memory: 512M }
        reservations: { memory: 256M }

networks:
  shop-net: { driver: overlay }

secrets:
  db_password: { external: true }`,
    explain:
      'One file describes the whole system: images, networks, secrets, health and the deployment policy. Check it into the repository and the cluster state is reviewable.',
    notes: [
      'deploy: is ignored by docker compose up, so the same file still runs locally — just without the orchestration parts.',
      'Give every service an update_config and a healthcheck, or a bad image rolls out at full speed with nothing to stop it.',
      'external: true means the secret or network already exists in the cluster and the file only references it.',
      'The version: key is obsolete in current Compose and can be dropped.',
    ],
    variants: [
      { name: 'docker stack config -c compose.yml', note: 'prints the file as the stack will interpret it.' },
      { name: 'docker service inspect --pretty <svc>', note: 'what the cluster actually ended up with.' },
    ],
    related: ['stack-deploy', 'compose-vs-stack', 'update-config', 'swarm-secret-use'],
  },
  {
    id: 'stack-ls-ps',
    title: 'docker stack ls / ps',
    category: 'stacks',
    kind: 'command',
    summary: 'Which stacks exist, and every task inside one.',
    tags: ['list', 'tasks', 'status', 'overview'],
    syntax: `docker stack ls
docker stack ps [--no-trunc] [--filter desired-state=running] <stack>`,
    example: `docker stack ls
# NAME   SERVICES
# shop   3

docker stack ps shop --no-trunc --filter desired-state=running`,
    explain: 'stack ps is docker service ps across the whole stack — the single command to run after a deploy to see whether everything landed.',
    notes: [
      'Without the desired-state filter you also see the history of failed tasks, which is what you want when something is wrong and noise when it is not.',
      '--no-trunc shows the full error, which is almost always the answer.',
    ],
    variants: [
      { name: 'docker stack services <stack>', note: 'the service-level summary with replica counts.' },
      { name: 'docker service ps <service>', note: 'one service in detail.' },
    ],
    related: ['stack-services', 'service-ps', 'stack-deploy'],
  },
  {
    id: 'stack-services',
    title: 'docker stack services',
    category: 'stacks',
    kind: 'command',
    summary: 'Replica counts and images for one stack.',
    tags: ['status', 'replicas', 'image', 'summary'],
    syntax: `docker stack services <stack>`,
    example: `docker stack services shop
# ID   NAME      MODE        REPLICAS  IMAGE
# k9x  shop_api  replicated  3/3       ghcr.io/acme/shop:1.5
# m2p  shop_db   replicated  1/1       postgres:16`,
    explain: 'The post-deploy check: are the replica counts what you asked for, and is the image the tag you just pushed.',
    notes: [
      'The IMAGE column is how you confirm a deploy actually took — a stale tag here means the file or the push did not land.',
      'n/n with an old image means the update never started; n-1/n means it is still rolling.',
    ],
    variants: [
      { name: 'docker service ls --filter label=com.docker.stack.namespace=<stack>', note: 'the same set, filtered by the stack label.' },
    ],
    related: ['stack-ls-ps', 'service-ls', 'stack-deploy'],
  },
  {
    id: 'stack-rm',
    title: 'docker stack rm',
    category: 'stacks',
    kind: 'command',
    summary: 'Remove every service and network of a stack.',
    tags: ['teardown', 'delete', 'cleanup'],
    syntax: `docker stack rm <stack>...`,
    example: `docker stack rm shop

# removal is asynchronous — wait for it before redeploying
while docker stack ps shop >/dev/null 2>&1; do sleep 1; done
docker stack deploy -c compose.yml shop`,
    explain: 'Deletes the services and the networks the stack created. Volumes, secrets and configs survive, which is usually what you want.',
    notes: [
      'Removal is not instant. Redeploying immediately can fail with "network is in use" — wait for the tasks to go first.',
      'Volumes are deliberately kept: a stack rm is not supposed to delete your database.',
      'External networks and secrets (external: true) are left alone.',
    ],
    variants: [
      { name: 'docker stack deploy --prune', note: 'removes only the services that left the file, rather than the whole stack.' },
      { name: 'docker volume rm', note: 'the explicit, deliberate step if you really do want the data gone.' },
    ],
    related: ['stack-deploy', 'service-rm', 'volume-create'],
  },

  // --------------------------------------------------------------- secrets
  {
    id: 'swarm-secret-create',
    title: 'docker secret create',
    category: 'secrets',
    kind: 'command',
    summary: 'Store a credential in the cluster, encrypted, out of the image.',
    tags: ['password', 'credential', 'raft', 'tls key', 'token'],
    syntax: `docker secret create <name> <file>
printf '<value>' | docker secret create <name> -`,
    example: `printf 'S3cr3t-pg-pw' | docker secret create db_password -

docker secret ls
docker secret inspect db_password   # metadata only; the value is never returned`,
    explain:
      'Secrets live in the Raft store, encrypted at rest, and are delivered only to the nodes running a task that uses them — as a file in an in-memory tmpfs at /run/secrets/<name>.',
    notes: [
      'A secret is immutable. Changing one means creating a new secret and updating the service to use it.',
      'The value cannot be read back through the API, only by a task that mounts it. Keep the source of truth elsewhere.',
      'Secrets are a Swarm feature: docker compose up on a single host does not have them (it falls back to bind-mounting the file).',
      'They are as safe as your managers — back up /var/lib/docker/swarm and guard the manager token accordingly.',
    ],
    variants: [
      { name: 'docker config create', note: 'the same mechanism for non-sensitive files, unencrypted and readable back.' },
      { name: 'docker secret rm <name>', note: 'refuses while a service still uses it.' },
    ],
    related: ['swarm-secret-use', 'secret-rotate', 'swarm-config', 'secrets-in-env'],
  },
  {
    id: 'swarm-secret-use',
    title: 'Using a secret in a service',
    category: 'secrets',
    kind: 'recipe',
    summary: 'Mount it as a file and point the app at the path.',
    tags: ['run/secrets', 'file', 'postgres', '_FILE', 'mount'],
    syntax: `docker service create --secret <name> ...          # at /run/secrets/<name>
docker service create --secret source=<name>,target=<path>,mode=0400 ...`,
    example: `docker service create --name db \\
  --secret db_password \\
  -e POSTGRES_PASSWORD_FILE=/run/secrets/db_password \\
  postgres:16`,
    explain:
      'The secret appears as a read-only file inside the task. Images that support the _FILE convention (Postgres, MySQL, many others) read the path instead of an environment variable.',
    notes: [
      'If the app only reads an env var, an entrypoint that does export VAR="$(cat /run/secrets/name)" is the usual bridge — better than putting the value in the service spec.',
      'A value in --env is visible in docker service inspect and in every log of it. A secret is not.',
      'Secrets are mounted in memory and never written to the node disk.',
      'In a stack file: a secrets: list on the service, plus a top-level secrets: block (external: true for one you created by hand).',
    ],
    variants: [
      { name: 'secrets: in a stack file', note: 'the declarative form, with target/uid/gid/mode options.', lang: 'yaml' },
      { name: 'docker service update --secret-add / --secret-rm', note: 'changes the secrets of a running service.' },
    ],
    related: ['swarm-secret-create', 'secret-rotate', 'stack-file', 'secrets-in-env'],
  },
  {
    id: 'secret-rotate',
    title: 'Rotating a secret',
    category: 'secrets',
    kind: 'recipe',
    summary: 'Secrets are immutable, so rotation is add-then-swap.',
    tags: ['rotation', 'password change', 'versioned', 'update'],
    syntax: `docker secret create <name>_v2 <file>
docker service update --secret-rm <name> --secret-add source=<name>_v2,target=<path> <service>
docker secret rm <name>`,
    example: `printf 'new-password' | docker secret create db_password_v2 -

docker service update \\
  --secret-rm db_password \\
  --secret-add source=db_password_v2,target=/run/secrets/db_password \\
  shop_db

docker secret rm db_password`,
    explain:
      'Create the new version, swap it in with the same target path so the application needs no change, then delete the old one. The service update rolls the tasks the usual way.',
    notes: [
      'Keeping the target path stable is what makes this invisible to the app.',
      'Change the credential in the database itself as part of the same operation, in an order that keeps something valid at all times.',
      'The old secret cannot be removed while any service still references it — that guard is useful.',
      'Name versions (_v2) rather than trying to reuse a name; you cannot update a secret in place.',
    ],
    variants: [
      { name: 'stack file with a versioned secret name', note: 'the same swap, done declaratively by editing the name and redeploying.', lang: 'yaml' },
    ],
    related: ['swarm-secret-create', 'swarm-secret-use', 'service-update'],
  },
  {
    id: 'swarm-config',
    title: 'docker config',
    category: 'secrets',
    kind: 'command',
    summary: 'Ship a configuration file to tasks without baking it into the image.',
    tags: ['nginx.conf', 'config file', 'immutable', 'mount'],
    syntax: `docker config create <name> <file>
docker service create --config source=<name>,target=<path>,mode=0444 ...`,
    example: `docker config create nginx_conf ./nginx.conf

docker service create --name proxy \\
  --config source=nginx_conf,target=/etc/nginx/nginx.conf,mode=0444 \\
  -p 80:80 nginx:1.27`,
    explain:
      'Exactly like secrets but for non-sensitive files: stored in Raft, distributed to the nodes that need them, mounted read-only. It lets one generic image serve several environments.',
    notes: [
      'Configs are readable back through the API — do not use them for credentials.',
      'Also immutable: rotate by creating a new name and updating the service, same as secrets.',
      'A config beats a bind mount in a Swarm, because there is no host path that has to exist on every node.',
    ],
    variants: [
      { name: 'docker config ls / inspect', note: 'lists them and shows the content (base64) — unlike secrets.' },
      { name: 'configs: in a stack file', note: 'the declarative form.', lang: 'yaml' },
    ],
    related: ['swarm-secret-create', 'swarm-secret-use', 'stack-file', 'service-mounts'],
  },
  {
    id: 'secrets-in-env',
    title: 'Why not just use environment variables',
    category: 'secrets',
    kind: 'practice',
    summary: 'Env vars leak into inspect, logs, crash dumps and child processes.',
    tags: ['security', 'leak', 'inspect', 'env', 'credentials'],
    syntax: `# visible to anyone who can talk to the daemon
docker service inspect shop_db | grep -i password

# not visible anywhere but inside the task
docker service create --secret db_password ...`,
    example: `# avoid
docker service create -e DB_PASSWORD='S3cr3t' ...

# prefer
printf 'S3cr3t' | docker secret create db_password -
docker service create --secret db_password -e DB_PASSWORD_FILE=/run/secrets/db_password ...`,
    explain:
      'An environment variable is part of the service spec: it shows up in docker inspect, in stack files people paste into tickets, in process listings inside the container, and in most crash reporters. A secret is a file the orchestrator delivers only where it is needed.',
    notes: [
      'Build args are worse still — they stay in the image history for anyone who pulls it.',
      'If the application only reads env vars, load the file into the variable in an entrypoint rather than putting the value in the spec.',
      'On a single host without Swarm, a file mounted read-only and kept out of git is the equivalent.',
    ],
    variants: [
      { name: 'docker secret create', note: 'the Swarm way.' },
      { name: 'RUN --mount=type=secret', note: 'the build-time equivalent.' },
    ],
    related: ['swarm-secret-use', 'build-secrets', 'env-vs-arg', 'compose-env'],
  },

  // -------------------------------------------------------------- registry
  {
    id: 'docker-login',
    title: 'docker login',
    category: 'registry',
    kind: 'command',
    summary: 'Authenticate to a registry before pulling or pushing private images.',
    tags: ['auth', 'credentials', 'ghcr', 'ecr', 'token', 'ci'],
    syntax: `docker login [<registry>] [-u <user>] [--password-stdin]`,
    example: `# interactive
docker login ghcr.io

# CI: never put the token on the command line
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin`,
    explain: 'Stores a credential in ~/.docker/config.json (or a credential helper) that the daemon then uses for that registry.',
    notes: [
      'A password as an argument lands in your shell history and in the process list. Always --password-stdin.',
      'Use a token scoped to read (pull) for deploy hosts, not your account password.',
      'Login is per user on the machine: a daemon running as root and a user login are different credential stores, which is the usual "works for me, fails in systemd".',
      'In a Swarm, the credentials only reach other nodes if you deploy with --with-registry-auth.',
    ],
    variants: [
      { name: 'docker logout <registry>', note: 'clears the stored credential.' },
      { name: 'docker-credential-helpers', note: 'keeps tokens in the OS keychain instead of a plain file.' },
    ],
    related: ['registry-auth', 'docker-push', 'docker-pull', 'registry-local'],
  },
  {
    id: 'registry-auth',
    title: '--with-registry-auth',
    category: 'registry',
    kind: 'practice',
    summary: 'The flag that stops a private image failing on every node but one.',
    tags: ['swarm', 'private registry', 'pull failure', 'no such image', 'deploy'],
    syntax: `docker stack deploy -c compose.yml --with-registry-auth <stack>
docker service create --with-registry-auth ...
docker service update --with-registry-auth --image <img> <service>`,
    example: `docker login ghcr.io
docker stack deploy -c compose.yml --with-registry-auth shop`,
    explain:
      'Managers hold your registry credential; workers do not. This flag forwards it with the service spec so every node can pull the image.',
    notes: [
      'Without it the symptom is confusing: the service exists, tasks are Pending or failing, and docker service ps says "No such image" or "pull access denied" on some nodes only.',
      'The credential is stored in the service spec, so rotating the registry token means redeploying with the flag again.',
      'Public images do not need it at all.',
    ],
    variants: [
      { name: 'docker service ps --no-trunc <svc>', note: 'where the pull error actually shows up.' },
      { name: 'a pull secret on each node', note: 'the alternative: docker login on every node, kept in configuration management.' },
    ],
    related: ['docker-login', 'stack-deploy', 'service-ps', 'no-suitable-node'],
  },
  {
    id: 'image-digest',
    title: 'Tags vs digests',
    category: 'registry',
    kind: 'practice',
    summary: 'A tag is a moving pointer; a digest is the bytes.',
    tags: ['sha256', 'immutable', 'pin', 'reproducible', 'supply chain'],
    syntax: `<image>:<tag>                 # may point anywhere tomorrow
<image>@sha256:<digest>       # exactly these bytes, forever`,
    example: `docker image inspect ghcr.io/acme/shop:1.4 \\
  -f '{{index .RepoDigests 0}}'
# ghcr.io/acme/shop@sha256:9c4e...f1

docker service create --name api ghcr.io/acme/shop@sha256:9c4e...f1`,
    explain:
      'Two machines pulling the same tag can get different images. A digest is content-addressed, so a deploy is reproducible and auditable.',
    notes: [
      'Swarm resolves the tag to a digest at deploy time by default, so all replicas of one deploy run identical bytes — that is --resolve-image changed.',
      'Pinning digests in the stack file makes rollbacks exact, at the cost of a noisier diff on every bump.',
      'Digests differ per architecture unless you reference the manifest list digest.',
    ],
    variants: [
      { name: 'docker buildx imagetools inspect <image>:<tag>', note: 'the manifest list and per-platform digests.' },
      { name: 'docker pull <image>@sha256:...', note: 'pull by digest.' },
    ],
    related: ['latest-tag', 'docker-pull', 'stack-deploy', 'buildx-build'],
  },
  {
    id: 'latest-tag',
    title: 'The :latest problem',
    category: 'registry',
    kind: 'practice',
    summary: 'A tag that means "whatever was pushed most recently" is not a version.',
    tags: ['tagging', 'versioning', 'rollback', 'reproducible', 'deploy'],
    syntax: `# tag with something that identifies the build
ghcr.io/acme/shop:1.4.2
ghcr.io/acme/shop:2026-09-15-a1b2c3d
ghcr.io/acme/shop:latest      # convenience only`,
    example: `docker build -t ghcr.io/acme/shop:1.4.2 -t ghcr.io/acme/shop:latest .
docker push ghcr.io/acme/shop:1.4.2
docker push ghcr.io/acme/shop:latest

# deploy the version, never the moving tag
docker service update --image ghcr.io/acme/shop:1.4.2 shop_api`,
    explain:
      'With :latest, two nodes can be running different code, a redeploy does nothing visible, and there is no previous version to roll back to.',
    notes: [
      'Tag with the git sha or a semantic version; push :latest as well if humans want it, but deploy the immutable one.',
      'docker service update --image with an unchanged tag is a no-op: Swarm sees the same spec. Use --force to re-pull.',
      'Rolling back means naming the previous tag — which only exists if you created one.',
    ],
    variants: [
      { name: 'docker service update --force', note: 're-pulls and restarts tasks when the tag has moved under you.' },
      { name: 'image digests', note: 'the stricter version of the same discipline.' },
    ],
    related: ['image-digest', 'service-update', 'service-rollback', 'docker-tag'],
  },
  {
    id: 'registry-local',
    title: 'Running a registry yourself',
    category: 'registry',
    kind: 'recipe',
    summary: 'A private registry inside the cluster, so every node can pull.',
    tags: ['registry:2', 'self-hosted', 'mirror', 'airgap', 'swarm'],
    syntax: `docker service create --name registry --publish 5000:5000 \\
  --mount type=volume,source=registry-data,target=/var/lib/registry registry:2`,
    example: `docker service create --name registry \\
  --publish published=5000,target=5000 \\
  --constraint 'node.role == manager' \\
  --mount type=volume,source=registry-data,target=/var/lib/registry \\
  registry:2

docker tag shop:1.4 127.0.0.1:5000/shop:1.4
docker push 127.0.0.1:5000/shop:1.4
docker service create --name api --network shop-net 127.0.0.1:5000/shop:1.4`,
    explain:
      'The simplest way to make a locally built image available to every node: push it once to a registry the cluster can reach. Through the routing mesh, 127.0.0.1:5000 works from any node.',
    notes: [
      'Without TLS, every daemon needs the host in insecure-registries in /etc/docker/daemon.json — and a restart.',
      'Put it on a volume, or your images disappear when the task moves.',
      'For anything beyond a lab, use a registry with authentication and TLS, or a hosted one.',
      'A pull-through cache mirror (registry:2 with proxy settings) also saves bandwidth on repeated public pulls.',
    ],
    variants: [
      { name: 'docker save / docker load', note: 'the no-registry alternative for one or two nodes.' },
      { name: 'registry garbage-collect', note: 'reclaims disk after deleting tags; the registry does not do it by itself.' },
    ],
    related: ['docker-push', 'docker-save-load', 'registry-auth', 'routing-mesh'],
  },

  // ------------------------------------------------------------------- ops
  {
    id: 'system-df',
    title: 'docker system df',
    category: 'ops',
    kind: 'command',
    summary: 'What is actually using the disk.',
    tags: ['disk', 'space', 'reclaimable', 'usage', 'build cache'],
    syntax: `docker system df [-v]`,
    example: `docker system df
# TYPE          TOTAL  ACTIVE  SIZE     RECLAIMABLE
# Images           42      12  28.4GB   19.1GB (67%)
# Containers       18       6   1.2GB   900MB
# Local Volumes    11       4  42.0GB   12.0GB
# Build Cache       -       -  14.3GB   14.3GB

docker system df -v | head -40`,
    explain: 'The honest accounting: shared layers counted once, and a RECLAIMABLE column telling you how much a prune would actually free.',
    notes: [
      'Build cache is invisible in docker images and is often the biggest line on a CI machine.',
      '-v breaks it down per image, container and volume, which is how you find the one 40 GB volume.',
      'Run this before pruning, not after wondering where the disk went.',
    ],
    variants: [
      { name: 'docker system prune', note: 'reclaims the unused part.' },
      { name: 'du -sh /var/lib/docker/*', note: 'the view from the host, when the daemon numbers do not add up.' },
    ],
    related: ['system-prune', 'disk-full', 'image-prune', 'volume-prune'],
  },
  {
    id: 'system-prune',
    title: 'docker system prune',
    category: 'ops',
    kind: 'command',
    summary: 'Reclaim everything unused — read the flags before you press enter.',
    tags: ['cleanup', 'gc', 'disk full', 'dangerous', 'cron'],
    syntax: `docker system prune [-a] [--volumes] [--filter until=<duration>] [-f]`,
    example: `# safe: stopped containers, unused networks, dangling images, build cache
docker system prune -f

# aggressive, for a build host
docker system prune -af --filter "until=168h"`,
    explain: 'One command for containers, networks, dangling images and build cache. -a extends it to every unused image; --volumes adds volumes, which is where data lives.',
    notes: [
      '--volumes can delete a database whose container you removed. Prune volumes deliberately, never as part of a reflex cleanup.',
      'On a Swarm node this touches only that node. Each one needs its own cleanup.',
      'Schedule it with a until= filter instead of running it in a panic at 3am.',
    ],
    variants: [
      { name: 'docker builder prune --keep-storage 10GB', note: 'caps the build cache rather than clearing it.' },
      { name: 'docker container prune / image prune / volume prune', note: 'the targeted versions.' },
    ],
    related: ['system-df', 'image-prune', 'volume-prune', 'disk-full'],
  },
  {
    id: 'disk-full',
    title: 'The node disk filled up',
    category: 'ops',
    kind: 'recipe',
    summary: 'Find it, free it, stop it happening again.',
    tags: ['no space left', 'incident', 'logs', 'overlay2', 'cleanup'],
    syntax: `docker system df -v
du -sh /var/lib/docker/* | sort -h
docker system prune -af --filter "until=48h"`,
    example: `# 1. where is it
docker system df
du -sh /var/lib/docker/containers/* | sort -h | tail

# 2. the usual culprit: unrotated container logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 3. then the images and cache
docker system prune -af --filter "until=48h"`,
    explain:
      'It is almost always one of three things: container logs with no rotation, old images on a node that never prunes, or the build cache. Check which before deleting anything.',
    notes: [
      'Fix log rotation permanently in /etc/docker/daemon.json rather than truncating files by hand every month.',
      'A full disk makes the daemon behave strangely long before it errors clearly — pulls fail, tasks stay Pending, containers will not start.',
      'On a Swarm node, an unprunable disk eventually makes the node unusable and tasks pile up elsewhere.',
    ],
    variants: [
      { name: 'docker logs --tail 0 -f <c>', note: 'confirms a container is still writing at volume.' },
      { name: 'daemon.json log-opts', note: 'the permanent fix.', lang: 'yaml' },
    ],
    related: ['log-rotation', 'system-prune', 'system-df', 'image-prune'],
  },
  {
    id: 'log-rotation',
    title: 'Log rotation (daemon.json)',
    category: 'ops',
    kind: 'practice',
    summary: 'The default json-file driver never rotates. Set a cap once, per host.',
    tags: ['daemon.json', 'max-size', 'json-file', 'local driver', 'disk'],
    syntax: `// /etc/docker/daemon.json
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}`,
    example: `# /etc/docker/daemon.json
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}

sudo systemctl restart docker   # existing containers keep their old settings`,
    explain:
      'Container logs go to /var/lib/docker/containers/<id>/<id>-json.log and grow without limit by default. A chatty service can fill a disk in a day.',
    notes: [
      'The setting applies to containers created after the restart. Existing ones keep whatever they were created with — recreate them.',
      'The local driver is more compact than json-file and rotates by default, at the cost of docker logs being the only reader.',
      'Per-container overrides exist (--log-opt), but a host-wide default is the one that actually protects you.',
      'A remote driver (syslog, gelf, awslogs) moves the problem off the node — and makes docker logs return nothing.',
    ],
    variants: [
      { name: 'docker run --log-opt max-size=10m', note: 'per container, when you cannot change the host.' },
      { name: 'logging: driver/options', note: 'the Compose and stack-file form.', lang: 'yaml' },
    ],
    related: ['disk-full', 'docker-logs', 'service-logs', 'system-df'],
  },
  {
    id: 'exit-codes',
    title: 'Reading exit codes',
    category: 'ops',
    kind: 'practice',
    summary: '137 is a kill, 143 is a graceful stop, 1 is the app.',
    tags: ['137', '143', 'oomkilled', 'sigterm', 'sigkill', 'crash'],
    syntax: `docker ps -a --format 'table {{.Names}}\\t{{.Status}}'
docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}} {{.State.Error}}' <container>`,
    example: `docker inspect -f '{{.State.ExitCode}} OOMKilled={{.State.OOMKilled}}' shop
# 137 OOMKilled=true    -> hit the memory limit`,
    explain:
      'Exit codes above 128 are signals: 128+9 = 137 (SIGKILL, usually the OOM killer or a stop timeout), 128+15 = 143 (SIGTERM, a clean stop). Below that it is the application: 0 finished, 1 threw, 126/127 mean the command was not executable or not found.',
    notes: [
      '137 with OOMKilled=true is a memory limit; 137 with OOMKilled=false is usually a stop that timed out — a PID 1 that ignores SIGTERM.',
      '127 in an entrypoint is nearly always a missing shell or binary in a slim base image.',
      'On a Swarm the same information is in docker service ps under ERROR, and in docker inspect of the task.',
    ],
    variants: [
      { name: 'docker inspect -f \'{{json .State}}\'', note: 'the whole state block, including timestamps.' },
      { name: 'dmesg | grep -i oom', note: 'the kernel side of an OOM kill, on the node.' },
    ],
    related: ['docker-stats', 'resource-limits', 'pid-one', 'service-ps'],
  },
  {
    id: 'docker-events',
    title: 'docker events',
    category: 'ops',
    kind: 'command',
    summary: 'A live stream of what the daemon is doing.',
    tags: ['audit', 'stream', 'oom', 'restart loop', 'timeline'],
    syntax: `docker events [--since <t>] [--until <t>] [--filter <k>=<v>]`,
    example: `# what happened during the incident window
docker events --since '2026-09-15T09:00:00' --until '2026-09-15T09:30:00' \\
  --filter 'type=container'

# watch a restart loop as it happens
docker events --filter 'event=die' --filter 'event=start'`,
    explain: 'Every create, start, die, kill, oom, health_status and network attach, with timestamps. The timeline that docker ps cannot give you.',
    notes: [
      'health_status events are how you catch a service flapping between healthy and unhealthy.',
      'It is per node — on a Swarm you see only the local daemon.',
      'With --since you can replay the past rather than waiting for the next occurrence.',
    ],
    variants: [
      { name: 'docker events --format \'{{json .}}\'', note: 'JSON lines, for piping into jq.' },
      { name: 'journalctl -u docker', note: 'the daemon own log, when the problem is the daemon.' },
    ],
    related: ['exit-codes', 'service-not-converging', 'docker-logs', 'healthcheck'],
  },
  {
    id: 'service-not-converging',
    title: 'A service will not converge',
    category: 'ops',
    kind: 'recipe',
    summary: 'Replicas stuck at 0/3 or a rolling update that never finishes.',
    tags: ['pending', 'crash loop', 'stuck', 'rollout', 'troubleshoot'],
    syntax: `docker service ps --no-trunc <service>
docker service logs --tail 100 <service>
docker service inspect --pretty <service>`,
    example: `docker service ps shop_api --no-trunc | head
# ... Pending   "no suitable node (insufficient resources on 3 nodes)"
# ... Shutdown  "task: non-zero exit (1)"
# ... Rejected  "No such image: ghcr.io/acme/shop:1.5"`,
    explain:
      'Read the ERROR column first: it distinguishes the three causes. Rejected means the node could not start it (image, mount, permission); Pending means it was never placed (constraints, resources); repeated Shutdown means the container starts and dies.',
    notes: [
      'No such image on some nodes only: you forgot --with-registry-auth, or the image was never pushed.',
      'Task dies immediately: docker service logs shows the application error; a config or secret path is a frequent cause.',
      'Update stuck halfway: the new tasks are failing their healthcheck, so the rollout paused by design. Roll back or fix forward.',
      'Everything looks fine but no traffic: the healthcheck never passes, so the mesh keeps the task out of the load balancer.',
    ],
    variants: [
      { name: 'docker service rollback <svc>', note: 'the fastest way out of a bad deploy.' },
      { name: 'docker service update --force', note: 'reschedules the tasks when they are wedged rather than wrong.' },
    ],
    related: ['service-ps', 'no-suitable-node', 'registry-auth', 'healthcheck', 'service-rollback'],
  },
  {
    id: 'no-suitable-node',
    title: '"no suitable node"',
    category: 'ops',
    kind: 'recipe',
    summary: 'The scheduler had nowhere to put the task — and it says why.',
    tags: ['pending', 'constraint', 'resources', 'placement', 'scheduling'],
    syntax: `docker service ps --no-trunc <service>   # the reason is in the ERROR column`,
    example: `# no suitable node (scheduling constraints not satisfied on 5 nodes)
docker service inspect shop_db --format '{{json .Spec.TaskTemplate.Placement}}'
docker node ls
docker node inspect wrk-1 --format '{{json .Spec.Labels}}'`,
    explain:
      'The parenthetical is the diagnosis: "scheduling constraints not satisfied" is a constraint matching no node; "insufficient resources" means reservations do not fit; "max replicas per node" means you capped it.',
    notes: [
      'Constraint mismatches are usually a typo or a label that was never applied to the node.',
      'Insufficient resources counts reservations, not current usage — four tasks reserving 1 GB will not fit on a 2 GB node even if it is idle.',
      'A drained node is not a candidate, so draining one too many produces this immediately.',
      'Fix by relaxing the constraint, lowering the reservation, labelling another node, or adding capacity.',
    ],
    variants: [
      { name: 'docker node update --label-add', note: 'when the answer is that a node was never labelled.' },
      { name: 'docker service update --reserve-memory', note: 'when the reservation was optimistic.' },
    ],
    related: ['service-placement', 'service-resources', 'node-labels', 'node-availability'],
  },
  {
    id: 'distroless-debug',
    title: 'Debugging an image with no shell',
    category: 'ops',
    kind: 'recipe',
    summary: 'distroless and scratch images have nothing to exec into.',
    tags: ['netshoot', 'sidecar', 'nsenter', 'scratch', 'toolbox'],
    syntax: `docker run --rm -it --network container:<target> nicolaka/netshoot
docker run --rm -it --pid container:<target> --cap-add SYS_PTRACE <toolbox>`,
    example: `# network problems: share the target network namespace
docker run --rm -it --network container:shop nicolaka/netshoot
# then: dig db, curl -v http://db:5432, ss -ltnp

# look at the filesystem instead
docker cp shop:/app/config.json -`,
    explain:
      'You cannot exec a shell that does not exist. Instead, attach a container that has tools to the same namespaces, or copy what you need out.',
    notes: [
      'netshoot carries dig, curl, ss, tcpdump and friends, and sharing --network container:<name> means it sees exactly what the target sees.',
      'docker debug exists in Docker Desktop and some editions; on a plain server the sidecar trick is the portable answer.',
      'On the node, docker inspect gives the MergedDir under /var/lib/docker/overlay2 — you can read the filesystem from the host as root.',
      'This is the trade for a small, CVE-light image. Decide before production, not during an incident.',
    ],
    variants: [
      { name: 'docker run --rm -it --entrypoint sh <image>', note: 'works if the image does have a shell but a stubborn entrypoint.' },
      { name: 'a debug stage in the Dockerfile', note: 'multi-stage: same base, plus tools, built with --target debug.' },
    ],
    related: ['docker-exec', 'multi-stage', 'docker-cp', 'network-modes'],
  },

  // -------------------------------------------------------------- pitfalls
  {
    id: 'run-as-root',
    title: 'Everything runs as root by default',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Containers are not a security boundary you should lean on.',
    tags: ['security', 'privilege', 'escape', 'capabilities', 'docker group'],
    syntax: `USER app                          # in the Dockerfile
docker run --user 1000:1000 ...   # at run time
docker run --read-only --cap-drop ALL --security-opt no-new-privileges ...`,
    example: `docker service create --name api \\
  --user 1000:1000 \\
  --read-only \\
  --cap-drop ALL \\
  --mount type=tmpfs,target=/tmp \\
  ghcr.io/acme/shop:1.4`,
    explain:
      'Root in a container is root on the host kernel, one bug away. Dropping to a normal user, dropping capabilities and making the filesystem read-only removes most of what an exploit would want.',
    notes: [
      'Membership of the docker group is root on the host — anyone in it can mount / into a privileged container. Treat it as sudo.',
      '--privileged disables nearly every protection. It is almost never the right answer to a permission error.',
      'A read-only filesystem usually just needs a tmpfs for /tmp and any cache directory.',
      'Rootless Docker exists and is a real option for build hosts and CI.',
    ],
    variants: [
      { name: 'docker run --cap-drop ALL --cap-add NET_BIND_SERVICE', note: 'the middle ground when a low port is unavoidable.' },
      { name: 'docker scout cve <image>', note: 'what is actually vulnerable in the image you are shipping.' },
    ],
    related: ['dockerfile-user', 'secrets-in-env', 'volumes', 'service-create'],
  },
  {
    id: 'pid-one',
    title: 'PID 1, signals and zombie processes',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Why a stop takes ten seconds and then kills your app.',
    tags: ['sigterm', 'init', 'tini', 'graceful shutdown', 'shell form', 'exec'],
    syntax: `ENTRYPOINT ["node", "server.js"]   # exec form: your process is PID 1
docker run --init ...              # a tiny init that forwards signals and reaps`,
    example: `# bad: sh -c becomes PID 1 and swallows SIGTERM
CMD node server.js

# good
CMD ["node", "server.js"]

# entrypoint script: hand over properly
#!/bin/sh
set -e
exec "$@"`,
    explain:
      'PID 1 has special signal semantics: default handlers are not installed, so a shell wrapper simply ignores SIGTERM. Docker then waits out the stop timeout and sends SIGKILL, which is why "graceful shutdown" silently stops working.',
    notes: [
      'Symptom: every docker stop takes exactly 10 seconds, and in-flight requests are dropped.',
      'Use the JSON exec form for CMD and ENTRYPOINT, and exec "$@" at the end of entrypoint scripts.',
      '--init (or tini) also reaps zombies, which matters for anything spawning child processes.',
      'Your app should still handle SIGTERM: stop accepting connections, finish in flight, exit.',
    ],
    variants: [
      { name: 'docker run --init', note: 'adds an init process without changing the image.' },
      { name: 'STOPSIGNAL SIGQUIT', note: 'when the app wants a different signal (nginx, for example).', lang: 'dockerfile' },
      { name: 'stop_grace_period: 30s', note: 'the Compose/stack key for a longer drain.', lang: 'yaml' },
    ],
    related: ['cmd-vs-entrypoint', 'docker-stop-start', 'exit-codes', 'healthcheck'],
  },
  {
    id: 'exec-format-error',
    title: '"exec format error"',
    category: 'pitfalls',
    kind: 'recipe',
    summary: 'An arm64 image on an amd64 server, or the other way round.',
    tags: ['architecture', 'arm64', 'apple silicon', 'platform', 'manifest'],
    syntax: `docker image inspect <image> -f '{{.Os}}/{{.Architecture}}'
docker buildx build --platform linux/amd64 -t <image> --push .`,
    example: `docker image inspect ghcr.io/acme/shop:1.4 -f '{{.Os}}/{{.Architecture}}'
# linux/arm64   <- built on a Mac, deployed to an x86 server

docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/acme/shop:1.4 --push .`,
    explain:
      'An image built on Apple silicon is arm64 unless you say otherwise. On an amd64 node the binary cannot run and the kernel reports exec format error.',
    notes: [
      'In a Swarm this shows up as a task that starts and dies on some nodes and works on others — mixed-architecture clusters make it intermittent.',
      'Build multi-platform images in CI and push a manifest list; then each node pulls what it can run.',
      'A constraint on node.platform.arch is the stopgap when only one architecture is available.',
      'The same error also appears when a script has CRLF line endings or a missing shebang — check that before blaming the CPU.',
    ],
    variants: [
      { name: 'docker buildx imagetools inspect <image>', note: 'which platforms a tag actually provides.' },
      { name: '--constraint node.platform.arch == amd64', note: 'pins tasks to nodes that can run the image.' },
    ],
    related: ['buildx-build', 'service-ps', 'image-digest', 'node-labels'],
  },
  {
    id: 'swarm-data-locality',
    title: 'Local volumes and rescheduling',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'A task that moves node finds an empty volume — and the data is still on the old one.',
    tags: ['stateful', 'database', 'data loss', 'volume', 'constraint', 'nfs'],
    syntax: `# pin it
--constraint 'node.hostname == wrk-1'
# or use storage every node can reach
docker volume create --driver <shared-driver> ...`,
    example: `docker service create --name db \\
  --constraint 'node.labels.db == primary' \\
  --mount type=volume,source=shop-db,target=/var/lib/postgresql/data \\
  postgres:16`,
    explain:
      'The default local volume driver creates the volume on whichever node runs the task. Reschedule the task and it gets a brand-new, empty volume elsewhere; the real data sits on a node with nothing running.',
    notes: [
      'The symptom is terrifying and reversible: an empty database after a node reboot, with the data intact on the old node.',
      'Either pin stateful tasks to a node with a constraint and accept that a node failure means downtime, or use shared storage (NFS, cloud block volumes) that follows the task.',
      'Managed databases outside the cluster remain the least exciting option, which in production is a compliment.',
      'Back up volumes regardless — a pinned node is still one disk.',
    ],
    variants: [
      { name: 'docker volume create --driver local --opt type=nfs', note: 'a volume any node can mount.' },
      { name: 'placement.max_replicas_per_node', note: 'stops two replicas fighting over one node volume.', lang: 'yaml' },
    ],
    related: ['service-mounts', 'node-labels', 'volume-backup', 'service-placement'],
  },
  {
    id: 'swarm-vs-compose-host',
    title: 'docker run on a Swarm node',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'The cluster does not know about it, and will not look after it.',
    tags: ['orphan', 'unmanaged', 'drain', 'invisible', 'mixed'],
    syntax: `docker run -d ...          # this node only, invisible to the orchestrator
docker service create ...   # scheduled, healed, rolled, load-balanced`,
    example: `# these two are not the same thing
docker run -d --name api -p 8080:8080 ghcr.io/acme/shop:1.4
docker service create --name api --replicas 3 -p 8080:8080 ghcr.io/acme/shop:1.4`,
    explain:
      'Containers started with docker run (or docker compose up) on a swarm node are ordinary containers. They are not rescheduled when the node drains, not part of the routing mesh, and not visible to docker service ls.',
    notes: [
      'Draining a node leaves them running, which quietly defeats the maintenance you were doing.',
      'They can also hold a port the mesh wants, producing "port is already allocated" on deploy.',
      'It is legitimate for node-local tooling — just do not run the application that way.',
      'docker ps on a node shows both kinds, which is why the distinction is easy to lose.',
    ],
    variants: [
      { name: 'docker service ls', note: 'shows only orchestrated services — a container missing here is unmanaged.' },
      { name: 'docker stack deploy', note: 'the declarative way to get the whole thing managed.' },
    ],
    related: ['service-create', 'compose-vs-stack', 'node-availability', 'publish-ports'],
  },
]
