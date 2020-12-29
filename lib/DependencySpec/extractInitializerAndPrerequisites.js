const extractInitializerAndPrerequisites = before => {
  const [initializer, prerequisites] = before?.split(':') || [ ]

  return [initializer, prerequisites?.split(',') || [ ]]
}

module.exports = extractInitializerAndPrerequisites