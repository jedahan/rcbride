const net = require('net')
const https = require('https')
const server = new net.Server()
const token = process.env.RC_TOKEN

console.log(`token is ${token}`)

const get = (query, cb) => {
    console.log(`got query: ${query}`)

    https.get({
      hostname: 'www.recurse.com',
      path: `/api/v1/profiles?query=${query}`,
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
        const names = json.map(profile => profile.name)
        cb(names.join(', '))
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
  host: 'localhost',
  port: 8888
})
