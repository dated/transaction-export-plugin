const getValidPeer = async (peers, options = {}) => {
  let peer = undefined

  let count = 1
  while (count < 20 && !peer) {
    peer = peers[Math.floor(Math.random() * peers.length)]

    try {
      const response = await walletApi.http.get(`http://${peer.ip}:${peer.port}/api/blocks?limit=1`)

      if (options.withoutEstimates) {
        const body = JSON.parse(response.body)
        if (body.meta.totalCountIsEstimate) {
          peer = undefined
        }
      }
    } catch {
      peer = undefined
    }

    count = count + 1
  }

  return peer
}

module.exports = {
  getValidPeer
}
