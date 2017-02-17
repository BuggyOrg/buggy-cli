export default function wrapProvider (provider, { spinner }) {
  return {
    ...provider,

    install (dependency, version, path) {
      spinner.start().text = `Installing ${dependency}@${version}`
      const promise = provider.install(dependency, version, path)
      promise
        .then(() => spinner.succeed())
        .catch((e) => spinner.fail(e))
      return promise
    }
  }
}
