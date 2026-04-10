const PIN_HASH = 'f3e055913a0b1eb0f07317896f9a1bc466b9a50db85a7f882f3ffde9ffb23aca';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const auth = request.headers.get('Authorization') || '';
    const token = env.AUTH_TOKEN || PIN_HASH;
    if (auth !== `Bearer ${token}`) {
      return new Response('Unauthorized', { status: 401, headers: CORS });
    }

    if (request.method === 'GET') {
      const data = await env.GRAVITY_KV.get('appdata', 'json');
      return Response.json(data ?? {}, { headers: CORS });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      await env.GRAVITY_KV.put('appdata', JSON.stringify(body));
      return new Response('OK', { headers: CORS });
    }

    return new Response('Not Found', { status: 404, headers: CORS });
  },
};
