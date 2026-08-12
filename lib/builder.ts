export type BuilderInput = {
  name: string
  role: string
  location?: string
  github?: string
  portfolio?: string
  linkedin?: string
  photo?: string // data url
}

export type BuilderProfile = BuilderInput & {
  title: string
  tagline: string
  xp: number
  level: number
  levelName: string
  skills: string[]
  builderId: string
  date: string
}

type TitleRule = {
  title: string
  tagline: string
  keywords: string[]
}

// Ordered by specificity — first strong match wins.
const TITLE_RULES: TitleRule[] = [
  { title: 'AI Explorer', tagline: 'Teaching machines to dream.', keywords: ['ai', 'ml', 'machine learning', 'llm', 'genai', 'pytorch', 'tensorflow', 'nlp', 'model'] },
  { title: 'Cloud Pioneer', tagline: 'Scaling worlds on demand.', keywords: ['cloud', 'aws', 'gcp', 'azure', 'kubernetes', 'k8s', 'devops', 'terraform', 'docker', 'infra'] },
  { title: 'Design Engineer', tagline: 'Where pixels meet logic.', keywords: ['design engineer', 'design', 'ui', 'ux', 'figma', 'motion', 'framer', 'product designer'] },
  { title: 'Frontend Wizard', tagline: 'Conjuring interfaces from thin air.', keywords: ['frontend', 'react', 'next', 'vue', 'svelte', 'tailwind', 'css', 'ui engineer', 'web'] },
  { title: 'Backend Beast', tagline: 'Taming servers for a living.', keywords: ['backend', 'node', 'go', 'golang', 'rust', 'java', 'python', 'django', 'rails', 'api', 'server'] },
  { title: 'System Architect', tagline: 'Designing the invisible foundations.', keywords: ['architect', 'systems', 'distributed', 'scalability', 'platform', 'staff', 'principal'] },
  { title: 'Pixel Engineer', tagline: 'Crafting beauty at the sub-pixel.', keywords: ['graphics', 'webgl', 'three', 'shader', 'game', 'canvas', 'creative dev'] },
  { title: 'Data Alchemist', tagline: 'Turning raw data into gold.', keywords: ['data', 'analytics', 'sql', 'etl', 'pipeline', 'spark', 'warehouse', 'bi'] },
  { title: 'Mobile Maker', tagline: 'Building in the palm of your hand.', keywords: ['mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'expo'] },
  { title: 'Security Sentinel', tagline: 'Guarding the gates of the stack.', keywords: ['security', 'infosec', 'pentest', 'crypto', 'auth', 'zero trust'] },
  { title: 'Startup Dreamer', tagline: 'Turning napkins into companies.', keywords: ['founder', 'ceo', 'cto', 'entrepreneur', 'startup', 'indie', 'solo'] },
  { title: 'Blockchain Builder', tagline: 'Writing trust into code.', keywords: ['blockchain', 'web3', 'solidity', 'ethereum', 'smart contract', 'defi'] },
]

const FALLBACK_TITLES: TitleRule[] = [
  { title: 'Creative Builder', tagline: 'Making things that did not exist yesterday.', keywords: [] },
  { title: 'Innovation Hacker', tagline: 'Breaking rules to build the future.', keywords: [] },
  { title: 'Code Alchemist', tagline: 'Turning caffeine into products.', keywords: [] },
  { title: 'Logic Architect', tagline: 'Structuring chaos into systems.', keywords: [] },
]

const SKILL_CANON: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  react: 'React',
  next: 'Next.js',
  nextjs: 'Next.js',
  node: 'Node.js',
  nodejs: 'Node.js',
  go: 'Go',
  golang: 'Go',
  rust: 'Rust',
  python: 'Python',
  py: 'Python',
  ai: 'AI',
  ml: 'ML',
  llm: 'LLM',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  docker: 'Docker',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  figma: 'Figma',
  design: 'Design',
  ui: 'UI',
  ux: 'UX',
  tailwind: 'Tailwind',
  swift: 'Swift',
  kotlin: 'Kotlin',
  flutter: 'Flutter',
  solidity: 'Solidity',
  web3: 'Web3',
  sql: 'SQL',
  graphql: 'GraphQL',
}

const LEVELS = [
  { min: 0, name: 'Rookie Builder' },
  { min: 1200, name: 'Rising Builder' },
  { min: 2400, name: 'Senior Builder' },
  { min: 3600, name: 'Core Builder' },
  { min: 4600, name: 'Founding Builder' },
]

// Deterministic hash so the same input always yields the same passport.
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function deriveTitle(role: string, seed: number): TitleRule {
  const normalized = role.toLowerCase()
  for (const rule of TITLE_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule
    }
  }
  return FALLBACK_TITLES[seed % FALLBACK_TITLES.length]
}

function deriveSkills(role: string): string[] {
  const tokens = role
    .toLowerCase()
    .split(/[\s,/&|+.·-]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const skills: string[] = []
  for (const token of tokens) {
    const canon = SKILL_CANON[token]
    if (canon && !seen.has(canon)) {
      seen.add(canon)
      skills.push(canon)
    }
  }

  // Ensure at least a few tags for a rich card.
  const filler = ['Builder', 'Shipper', 'Goa 2026']
  let fi = 0
  while (skills.length < 3 && fi < filler.length) {
    if (!seen.has(filler[fi])) {
      seen.add(filler[fi])
      skills.push(filler[fi])
    }
    fi++
  }
  return skills.slice(0, 6)
}

const FIELD_LIMITS = {
  name: 40,
  role: 60,
  location: 40,
  github: 40,
  portfolio: 60,
  linkedin: 40,
} as const

function clamp(value: string | undefined, max: number): string | undefined {
  if (!value) return value
  const trimmed = value.trim()
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

/** Defensively re-clamps input lengths, independent of any UI-level maxLength. */
function sanitizeInput(input: BuilderInput): BuilderInput {
  return {
    ...input,
    name: clamp(input.name, FIELD_LIMITS.name) ?? input.name,
    role: clamp(input.role, FIELD_LIMITS.role) ?? input.role,
    location: clamp(input.location, FIELD_LIMITS.location),
    github: clamp(input.github, FIELD_LIMITS.github),
    portfolio: clamp(input.portfolio, FIELD_LIMITS.portfolio),
    linkedin: clamp(input.linkedin, FIELD_LIMITS.linkedin),
  }
}

export function generateProfile(rawInput: BuilderInput): BuilderProfile {
  const input = sanitizeInput(rawInput)
  const seed = hash(`${input.name}|${input.role}`)
  const { title, tagline } = deriveTitle(input.role, seed)
  const skills = deriveSkills(input.role)

  // XP between 1000 and 4999, deterministic from seed.
  const xp = 1000 + (seed % 4000)
  const level =
    LEVELS.reduce((acc, l, i) => (xp >= l.min ? i : acc), 0) + 1
  const levelName = LEVELS[level - 1].name

  const idNum = (seed % 9000) + 1000
  const builderId = `HHG-26-${idNum}`

  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())

  return {
    ...input,
    title,
    tagline,
    xp,
    level,
    levelName,
    skills,
    builderId,
    date,
  }
}

export const GENERATION_STEPS = [
  'Analyzing Builder',
  'Reading Energy',
  'Generating Identity',
  'Creating Passport',
  'Preparing Goa Experience',
  'Almost Ready',
]
