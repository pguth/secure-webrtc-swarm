var server = require('signalhub/server')()
var signalhub = require('signalhub')
var swarm = require('.')
var test = require('flip-tape')
var wrtc = require('electron-webrtc')()

test.onFinish(function () {
  server.close()
  wrtc.close()
})

server.listen(9000, function () {
  'connect using a shared secret'.test(function (t) {
    t.plan(8)

    var hub1 = signalhub('app', 'localhost:9000')
    var hub2 = signalhub('app', 'localhost:9000')

    var mnemonic = swarm.generateMnemonic()

    var sw1 = swarm(hub1, {
      mnemonic,
      wrtc
    })
    var sw2 = swarm(hub2, {
      mnemonic,
      wrtc
    })

    greetAndClose(sw1, sw2)
  })
})

function greetAndClose (sw1, sw2) {
  var hello = 'hello'
  var goodbye = 'goodbye'

  var peerIds = {}

  sw1.on('peer', function (peer, id) {
    'connected to peer from sw2'.pass()
    peerIds.sw2 = id
    peer.send(hello)
    peer.on('data', function (data) {
      'goodbye received'.equal(data.toString(), goodbye)
      sw1.close(function () {
        'swarm sw1 closed'.pass()
      })
    })
  })

  sw2.on('peer', function (peer, id) {
    'connected to peer from sw1'.pass()
    peerIds.sw1 = id
    peer.on('data', function (data) {
      'hello received'.equal(data.toString(), hello)
      peer.send(goodbye)
      sw2.close(function () {
        'swarm sw2 closed'.pass()
      })
    })
  })

  sw1.on('disconnect', function (peer, id) {
    if (id === peerIds.sw2) {
      'connection to peer from sw2 lost'.pass()
    }
  })

  sw2.on('disconnect', function (peer, id) {
    if (id === peerIds.sw1) {
      'connection to peer from sw1 lost'.pass()
    }
  })
}
