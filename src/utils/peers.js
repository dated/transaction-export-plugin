const getRandomPeer = (peers) => peers[Math.floor(Math.random() * peers.length)]

const getValidPeer = async (peers, options = {}) => {
  if (!Object.keys(options)) {
    return getRandomPeer(peers)
  }

  const checked = {}

  let result = undefined
  let count = 0

  while (count < peers.length && !result) {
    const peer = getRandomPeer(peers)

    if (checked[peer.ip]) {
      continue
    }

    try {
      const response = await walletApi.http.get(`http://${peer.ip}:${peer.port}/api/blocks?limit=1`)

      if (options.withoutEstimates) {
        const body = JSON.parse(response.body)
        if (body.meta.totalCountIsEstimate) {
          peer = undefined
        }
      }

      result = peer
    } catch {}

    checked[peer.ip] = true

    count = count + 1
  }

  return result
}

module.exports = {
  getRandomPeer,
  getValidPeer
}
