const extractInitializerAndPrerequisites = (
  before: string,
) => {
  const [initializer, prerequisites] = before?.split(':') || [ ]

  return {
    initializer,
    prerequisites: prerequisites?.split(',') || [ ],
  }
}

export default extractInitializerAndPrerequisites
