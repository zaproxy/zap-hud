import test from 'ava';

// TODO: use clean build system
// Dynamically load utils functions from utils.js
// <dirty-hack>
var fs = require('fs')
var CODE_PATH = './src/main/zapHomeFiles/hud/utils.js'
const jsCode = fs.readFileSync(CODE_PATH, 'utf-8')
global.eval(jsCode)
// </dirty-hack>

test('sortToolsByPosition result are in descending order', t => {
  var tools = [{
    'position': 3,
    'name': 'shovel'
  }, {
    'position': 1,
    'name': 'screwdriver'
  }, {
    'position': 4,
    'name': 'wheelbarrow'
  }, {
    'position': 2,
    'name': 'hammer'
  }]

  utils.sortToolsByPosition(tools)

  t.is(tools[0]['name'], 'wheelbarrow')
  t.is(tools[1]['name'], 'shovel')
  t.is(tools[2]['name'], 'hammer')
  t.is(tools[3]['name'], 'screwdriver')
})


test('parseDomainFromUrl returns domain from url without protocol', t => {
  var url = 'zaproxy.org'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

test('parseDomainFromUrl returns domain from url with http protocol', t => {
  var url = 'http://zaproxy.org'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

test('parseDomainFromUrl returns domain from url with https protocol', t => {
  var url = 'https://zaproxy.org'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

test('parseDomainFromUrl returns domain from url containing several path segments', t => {
  var url = 'zaproxy.org/more/path/segments'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

test('parseDomainFromUrl returns domain from url containing query parameters', t => {
  var url = 'zaproxy.org?parameter=value'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

// TODO: Skipped test
// Is this expected behavior or not?
test.skip('parseDomainFromUrl returns domain from url containing a port number', t => {
  var url = 'zaproxy.org:80'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

// TODO: Skipped test
// Is this expected behavior or not?
test.skip('parseDomainFromUrl returns domain from url containing subdomains', t => {
  var url = 'www.zaproxy.org'
  var domain = utils.parseDomainFromUrl(url)
  t.is(domain, 'zaproxy.org')
})

test('isFromTrustedOrigin returns true when origin is ZAP', t => {
  const message = { 'origin': 'https://zap' };
  t.true(utils.isFromTrustedOrigin(message))
})

test('isFromTrustedOrigin returns true when the `isTrusted` property of message is true', t => {
  const message = { 'isTrusted': true };
  t.true(utils.isFromTrustedOrigin(message))
})

test('isFromTrustedOrigin returns false when origin is not ZAP and the `isTrusted` property of message is false', t => {
  const message = { 'origin': 'https://somewhere.com',
    'isTrusted': false }
  t.false(utils.isFromTrustedOrigin(message));
})
