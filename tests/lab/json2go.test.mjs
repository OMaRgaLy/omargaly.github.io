import test from 'node:test';
import assert from 'node:assert/strict';
import { jsonToGo, goToJson } from '../../assets/js/lab/lib/json2go.js';

test('flat object with aligned columns and tags', () => {
  const out = jsonToGo('{"id":1,"name":"a","price":9.5,"ok":true}');
  assert.equal(
    out,
    [
      'type Root struct {',
      '\tID    int     `json:"id"`',
      '\tName  string  `json:"name"`',
      '\tPrice float64 `json:"price"`',
      '\tOk    bool    `json:"ok"`',
      '}',
      '',
    ].join('\n'),
  );
});

test('initialisms and snake_case become idiomatic Go names', () => {
  const out = jsonToGo('{"user_id":1,"html_url":"x","api":"y"}');
  assert.match(out, /\tUserID /);
  assert.match(out, /\tHTMLURL /);
  assert.match(out, /\tAPI /);
});

test('nested objects become their own types', () => {
  const out = jsonToGo('{"address":{"city":"Semey","zip":"1"}}');
  assert.match(out, /\tAddress Address `json:"address"`/);
  assert.match(out, /type Address struct \{/);
  assert.match(out, /\tCity string `json:"city"`/);
});

test('arrays of objects merge their fields; fields missing somewhere get omitempty', () => {
  const out = jsonToGo('{"items":[{"id":1},{"id":2,"name":"x"}]}');
  assert.match(out, /\tItems \[\]Item `json:"items"`/);
  assert.match(out, /type Item struct \{/);
  assert.match(out, /\tName string `json:"name,omitempty"`/);
});

test('mixed arrays and lone nulls fall back to interface{}', () => {
  assert.match(jsonToGo('{"a":[1,"x"]}'), /\tA \[\]interface\{\} /);
  assert.match(jsonToGo('{"a":null}'), /\tA interface\{\} /);
});

test('int and float values in one array widen to float64', () => {
  assert.equal(jsonToGo('[1,2.5]'), 'type Root []float64\n');
});

test('null merged with a concrete type keeps the concrete type', () => {
  const out = jsonToGo('[{"a":null},{"a":"x"}]');
  assert.match(out, /\tA string `json:"a,omitempty"`/);
});

test('large integers use int64', () => {
  assert.match(jsonToGo('{"n":9007199254740991}'), /\tN int64 /);
});

test('keys that are not valid Go identifiers are fixed and de-duplicated', () => {
  assert.match(jsonToGo('{"1st":1}'), /\tX1st int /);
  const dup = jsonToGo('{"a_b":1,"aB":2}');
  assert.match(dup, /\tAB /);
  assert.match(dup, /\tAB2 /);
});

test('root can be a primitive or an array of primitives', () => {
  assert.equal(jsonToGo('"hi"'), 'type Root string\n');
  assert.equal(jsonToGo('["a","b"]'), 'type Root []string\n');
});

test('custom root name', () => {
  assert.match(jsonToGo('{"a":1}', { rootName: 'Response' }), /^type Response struct \{/);
});

test('invalid JSON gives a readable error', () => {
  assert.throws(() => jsonToGo('{"a":'), /^Error: Invalid JSON/);
  assert.throws(() => jsonToGo(''), /Invalid JSON/);
});

test('handles a large array without trouble', () => {
  const big = JSON.stringify(Array.from({ length: 5000 }, (_, i) => ({ id: i, tag: i % 2 ? 'a' : undefined })));
  const out = jsonToGo(big);
  assert.match(out, /type Root \[\]RootItem/);
  assert.match(out, /\tTag string `json:"tag,omitempty"`/);
});

const GO = `
package model

// Root is the response.
type Root struct {
	ID    int      \`json:"id"\`
	Tags  []string \`json:"tags"\`
	Owner Owner    \`json:"owner"\`
	Skip  string   \`json:"-"\`
	Meta  map[string]int \`json:"meta,omitempty"\`
	Ptr   *Owner   \`json:"ptr"\`
	Any   interface{} \`json:"any"\`
	When  time.Time \`json:"when"\`
	Plain string
}

type Owner struct {
	Name string \`json:"name,omitempty"\`
}
`;

test('goToJson builds sample JSON from a struct', () => {
  assert.deepEqual(JSON.parse(goToJson(GO)), {
    id: 0,
    tags: ['string'],
    owner: { name: 'string' },
    meta: { key: 0 },
    ptr: { name: 'string' },
    any: null,
    when: '2006-01-02T15:04:05Z',
    Plain: 'string',
  });
});

test('goToJson reports when there is no struct', () => {
  assert.throws(() => goToJson('package x'), /No struct found/);
});

test('goToJson survives self-referencing types', () => {
  const out = goToJson('type Node struct {\n\tNext *Node `json:"next"`\n}');
  assert.ok(JSON.parse(out));
});

test('goToJson does not blow up on structs with many self-referencing pointers', () => {
  const fields = Array.from({ length: 20 }, (_, i) => `\tN${i} *Node \`json:"n${i}"\``).join('\n');
  const started = Date.now();
  const out = goToJson(`type Node struct {\n\tName string \`json:"name"\`\n${fields}\n}`);
  assert.ok(Date.now() - started < 1000, 'expansion took too long');
  const parsed = JSON.parse(out);
  assert.equal(parsed.name, 'string');
  assert.equal(parsed.n0, null);
});

test('goToJson still expands the same struct type used in sibling fields', () => {
  const out = goToJson('type A struct {\n\tX B `json:"x"`\n\tY B `json:"y"`\n}\ntype B struct {\n\tV int `json:"v"`\n}');
  assert.deepEqual(JSON.parse(out), { x: { v: 0 }, y: { v: 0 } });
});

test('root names are turned into valid Go identifiers', () => {
  assert.match(jsonToGo('{"a":1}', { rootName: 'my root' }), /^type MyRoot struct \{/);
  assert.match(jsonToGo('{"a":1}', { rootName: '9lives' }), /^type X9lives struct \{/);
  assert.match(jsonToGo('{"a":1}', { rootName: '   ' }), /^type Root struct \{/);
});

test('keys with quotes, backslashes or backticks produce a valid struct tag', () => {
  assert.match(jsonToGo(JSON.stringify({ 'a"b': 1 })), /`json:"a\\"b"`/);
  assert.match(jsonToGo(JSON.stringify({ 'a\\b': 1 })), /`json:"a\\\\b"`/);
  assert.match(jsonToGo(JSON.stringify({ 'a`b': 1 })), /"json:\\"a`b\\""/);
});

test('goToJson keeps anonymous nested structs nested', () => {
  const src = [
    'type Root struct {',
    '\tInner struct {',
    '\t\tY int `json:"y"`',
    '\t} `json:"inner"`',
    '\tZ int `json:"z"`',
    '}',
  ].join('\n');
  assert.deepEqual(JSON.parse(goToJson(src)), { inner: { y: 0 }, z: 0 });
});
