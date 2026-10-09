-- Modas Naty · asignar rol a cada persona del equipo.
-- 1) En Supabase: Authentication → Users → "Add user" → correo + contraseña (marcá "Auto Confirm User"), uno por persona.
-- 2) Copiá este archivo, reemplazá los correos por los reales (ver Docs/05-equipo-y-roles.md) y pegalo en el SQL Editor.
-- Roles: admin · vendedor · enc_tienda · enc_ventas · enc_deposito. Son los permisos propuestos; se confirman con Natali.
-- Las iniciales NO se pueden repetir entre personas (forman el número de nota: NV-AM-0001).
-- Es seguro correrlo más de una vez (actualiza, no duplica).

select naty_configurar_usuario('natali@ejemplo.com',   'admin',        'Natali',         'NT');
select naty_configurar_usuario('ariel@ejemplo.com',    'vendedor',     'Ariel Maydana',  'AM');
select naty_configurar_usuario('brayan@ejemplo.com',   'vendedor',     'Brayan Aquino',  'BA');
select naty_configurar_usuario('norma@ejemplo.com',    'vendedor',     'Norma Toloza',   'NO');
select naty_configurar_usuario('maria@ejemplo.com',    'enc_deposito', 'María Córdoba',  'MC');
select naty_configurar_usuario('pamela@ejemplo.com',   'enc_tienda',   'Pamela Aramayo', 'PA');
select naty_configurar_usuario('jehovana@ejemplo.com', 'enc_ventas',   'Jehovana Calla', 'JC');

-- Para dar de baja a alguien sin borrar su historial:
--   update naty_perfiles set activo = false where id = (select id from auth.users where email = 'correo@ejemplo.com');
