import Bootstrap from "#Bootstrap"
import {
  describe,
  expect,
  it,
} from "bun:test"

describe('How a default export is handled', () => {
  it('is assigned to the first dependency with a capitalized name', async () => {
    const madul = await Bootstrap('+DefaultExportDep')
    const fun   = madul.iCanHazDefaultExport()

    expect(fun.OhYeahBaby).toBeDefined();
    expect(typeof fun.OhYeahBaby).toBe('function');
  })
})