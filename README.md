# Buggy Package

This package includes a CLI for the Buggy tool chain.

# Basic Idea

A program in Buggy can take up various different forms depending on the position in the
tool chain. The following pictures illustrates the different layers.

![The Buggy toolchain with its layers](res/toolchain)

# Command Line Interface

The CLI has the following commands

- `resolve <json>`: Makes a lookup for every node in a graph and resolves it until only atomics and recursions remain. It prints a new JSON file (graphlib format)
- `svg <json> [--bare]`: Creates a SVG image for the given graph in JSON format (graphlib). It usually resolves the graph before creating the SVG, if you activate the `--bare` flag it will use the given JSON file without resolving the nodes.
- `compile <json> <language>`: Create source code for the given graph. Currently the only supported language is `golang`.
- `ng <json>`: Create the fully prepared network-graph as used by the code generators like golang.

