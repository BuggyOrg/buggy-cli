export { default as npmWrapper } from './npmWrapper'

export function getToolDisplayName ({ module, name, version }) {
  if (version) {
    return `${module || name}@${version}`
  }
  return `${module || name}`
}
