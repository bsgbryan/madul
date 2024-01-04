const cluster = require('cluster')

const { system } = require('systeminformation')

const { now } = performance

const {
  call,
  done,
  error,
  progress,
} = require('./Events').emit

let id

const bootstrap = async () => {
  const info = await system()

  id = info.uuid

  if (cluster.isWorker)
    id = `${id}:${cluster.worker.id}`
}

const record = () => {
  let invoked

  return {
    invoke: (spec, member, params = { }) => {
      invoked = now()

      call(spec, member, { params, META: { invoked, id } })
    },
    complete: (spec, member, output) =>
      done(spec, member, { output, META: { invoked, id } })
    ,
    fail: (spec, member, details) =>
      error(spec, member, { details, META: { invoked, id } })
    ,
    update: (spec, member, params) =>
      progress(spec, member, { params, META: { invoked, id } })
  }
}

exports.record    = record
exports.bootstrap = bootstrap