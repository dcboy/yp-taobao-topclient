//
const TopClient = require('../lib');
const assert = require('assert');

const client = new TopClient({
  appkey: '1',
  appsecret: '2',
  redirect_uri: '3',
});

describe('订单相关', () => {
  it('getAuthorizeUrl', async () => {
    const res = client.getAuthorizeUrl();
  });
})
