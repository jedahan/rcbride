const net = require('net')
const https = require('https')
const server = new net.Server()
const token = process.env.RC_TOKEN

const get = (options, cb) => {
  const querystring = Object.entries(options)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

  https.get({
    hostname: 'www.recurse.com',
    path: `/api/v1/profiles?${querystring}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let buffer = ''

    res.on('data', (data) => { buffer += data })

    res.on('end', () => {
      const data = buffer.toString('ascii')
      const json = JSON.parse(data)

      const infos = json.map(profile => {
        const { stints } = profile
        const latestStint = stints[stints.length - 1]

        const title = ({
          'retreat': latestStint.batch && latestStint.batch.short_name,
          'employment': latestStint.title,
          'experimental': latestStint.title,
          'residency': 'resident',
          'research_fellowship': 'research_fellow',
          'facilitatorship': 'facilitator',
        })[latestStint.type]

        return `${profile.name} (${title})`
      })

      cb(infos.join('\r\n'))
    })
  })
}

server.on('connection', socket => {
  console.log(`connection from ${socket.remoteAddress}`)

  let buffer = ''

  socket.on('data', chunk => {
    const enterIndex = chunk.indexOf(0x0a)
    if (enterIndex !== -1) {
      buffer += chunk.slice(0, enterIndex)

      const query = buffer.toString('ascii')
      console.log(`got query: ${query}`)

      const [scope, text] = query.split('!')
      const limit = 50

      get({scope, text, limit}, names => {
        socket.write(names, 'ascii')
        buffer = ''
      })
    }
  })
})

server.listen({
  host: '0.0.0.0',
  port: 8888
}, () => {
  console.log(`listening on`, server.address())
}
)
