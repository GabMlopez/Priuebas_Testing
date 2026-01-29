const http = require('k6/http');
const { sleep } = require('k6');
const { check } = require('k6');

export const options = {
  vus: 5,           
 stages: [
   { duration: '10s', target: 10 },
    { duration: '40s', target: 10 },
    { duration: '10s', target: 0 },
  ],
};

// Datos de prueba (en un test real deberías usar usuarios de prueba creados antes)
const payload = JSON.stringify({
  email:    'email',     
  password: 'pass',    
});

const params = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export default function () {
  const loginRes = http.post('http://localhost:3000/api/auth/login', payload, params);

  // Verificaciones (checks) importantes
  check(loginRes, {
    'status es 200': (r) => r.status === 200,
    'devuelve token': (r) => r.json('token') !== undefined && r.json('token').length > 20,
    'respuesta rápida (< 400ms)': (r) => r.timings.duration < 400,
    'no hay error en body': (r) => r.json('error') === undefined,
  });

  const token = loginRes.json('token');

  if (token) {
    const authParams = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const reservaPayload = JSON.stringify({
      fecha: "2026-02-01",
      hora:  "12:12",
      sala:  "1A"
    });

    const protectedRes = http.post(
      'http://localhost:3000/api/reservas/', 
      reservaPayload, 
      authParams
    );

    check(protectedRes, {
      'crear reserva status 201 o 200': (r) => r.status === 201 || r.status === 200,
      'respuesta rápida': (r) => r.timings.duration < 800, 
      'no hay error': (r) => r.json('error') === undefined,

    });
    }

  sleep(1); 
}