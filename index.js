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
        const json = JSON.parse(buffer)
        const names = json.map(profile => profile.name)
        cb(names.join(', '))
      })
    })
}

get('jonathan', names => {
  console.log(names)
})

server.on('connection', socket => {
  console.log(`connection from ${socket.remoteAddress}`)

  let buffer = ''

  socket.on('data', chunk => buffer += chunk)

  socket.on('end', () => {
    const query = buffer.toString('ascii')
    get(query, names => {
      socket.send(names)
    })
  })
})

server.listen(7777)
