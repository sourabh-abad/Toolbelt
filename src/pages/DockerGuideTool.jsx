import { Container } from 'lucide-react'
import { ENTRIES, CATEGORIES, KINDS, SAMPLE_STACK } from '../lib/dockerref'
import GuidePage from '../components/GuidePage'

/**
 * The Docker and Swarm catalogue rendered by the shared guide page. Everything
 * this route knows is in src/lib/dockerref.js.
 */
export default function DockerGuideTool() {
  return (
    <GuidePage
      icon={Container}
      title="Docker & Swarm Guide"
      subtitle={`${ENTRIES.length} searchable commands, flags and gotchas — with real examples.`}
      accent="sky"
      entries={ENTRIES}
      categories={CATEGORIES}
      kinds={KINDS}
      language="bash"
      searchPlaceholder="Search — build, exec, volume, overlay, service update, secret, drain…"
      searchLabel="Search the Docker guide"
      emptyTitle="Pick a command"
      emptyDescription="Or search above — containers, Compose, Swarm services, stacks and the traps."
      introText="Every example talks about the same small system, so the entries read as one deployment rather than unrelated snippets:"
      introCode={SAMPLE_STACK}
      labels={{ syntax: 'Command', variants: 'Related commands' }}
      variantsMono
    />
  )
}
