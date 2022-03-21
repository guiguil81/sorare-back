import {ActionCable} from "@sorare/actioncable";

const cable = new ActionCable({
  headers: {
    // 'Authorization': `Bearer <YourJWTorOAuthToken>`,
    // 'APIKEY': '<YourOptionalAPIKey>'
  }
});

cable.subscribe('aCardWasUpdated(rarities: [limited, rare, super_rare, unique]) { slug }', {
  connected() {
    console.log("connected");
  },

  disconnected(error) {
    console.log("disconnected", error);
  },

  rejected(error) {
    console.log("rejected", error);
  },

  received(data) {
    const aCardWasUpdated = data?.result?.data?.aCardWasUpdated;
    if (!aCardWasUpdated) {
      return;
    }
    const { slug } = aCardWasUpdated;
    console.log('a card was updated', slug);
  },
});

setTimeout(() => {
  console.log('lolll')
  cable.connection.close()
}, 5000)