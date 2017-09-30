const net = require('net')
const https = require('https')
const server = new net.Server()
const token = process.env.RC_TOKEN

console.log(`token is ${token}`)

const get = (query, cb) => {
    console.log(`got query: ${query}`)

    https.get({
      hostname: 'www.recurse.com',
      path: `/api/v1/profiles?query=${encodeURIComponent(query.trim())}`,
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }, (res) => {
      let buffer = ''

      res.on('data', (data) => {
        buffer += data
      })

      res.on('end', () => {
        const data = buffer.toString('ascii')
        const json = JSON.parse(data)
        const infos = json.map(profile => {
          let info = profile.name
          const { stints } = profile
          const latest_stint = stints[stints.length-1]

          switch (latest_stint.type) {
            case 'retreat':
              info += ` (${latest_stint.batch.short_name})`
              break;
            case 'employment':
            case 'experimental':
              info += ` (${latest_stint.title})`
              break;
            case 'residency':
              info += ` (resident)`
              break;
            case 'research_fellowship':
              info += ` (research fellow)`
              break;
            case 'facilitatorship':
              info += ` (facilitator)`
              break;
          }
          return info
        })
        cb(infos.join('\r'))
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
        get(query, names => {
          socket.write(names, 'ascii')
        })
      }
    })
})
server.on('listening', () => {
  console.log(server.address())
})

server.listen({
  host: '0.0.0.0',
  port: 8888,
})
