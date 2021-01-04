exports = {
  deps: ['/exampleDep', '/anotherExampleDep'],
  greet: ({ name, done }) => done(`Hello, ${name}!`)
}