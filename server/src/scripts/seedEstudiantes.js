require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const estudiantes = [
            { nombre: 'Sergio Gomar', correo: 'sgomar@miumg.edu.gt', carne: '99892311043', carrera: 'Ingeniería en Sistemas', saldo: 2500.00 },
            { nombre: 'Fabiola Hipolito', correo: 'fhipolito@miumg.edu.gt', carne: '99892311044', carrera: 'Ingeniería en Sistemas', saldo: 2500.00 },
            { nombre: 'Claudia de Leon', correo: 'cdeleon@miumg.edu.gt', carne: '99892311045', carrera: 'Ingeniería en Sistemas', saldo: 2500.00 },
            { nombre: 'Angie Jacinto', correo: 'ajacinto@miumg.edu.gt', carne: '99892311046', carrera: 'Ingeniería en Sistemas', saldo: 2500.00 }
        ];

        for (const estudiante of estudiantes) {
            const hash = await bcrypt.hash('123456', 10);

            const query = await client.query(
                `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
                     VALUES ($1, $2, $3, 'Estudiante')
                     ON CONFLICT (correoinstitucional) DO UPDATE SET
                       nombrecompleto = EXCLUDED.nombrecompleto,
                       passwordhash = EXCLUDED.passwordhash,
                       rol = EXCLUDED.rol
                     RETURNING idusuario`,
                [estudiante.nombre, estudiante.correo, hash]
            );

            const idUsuario = query.rows[0].idusuario;

            const update = await client.query(
                `UPDATE estudiante
                 SET carne = $1, carrera = $2, saldoactual = $3
                 WHERE idusuario = $4`,
                [estudiante.carne, estudiante.carrera, estudiante.saldo, idUsuario]
            );

            if (update.rowCount === 0) {
                await client.query(
                    `INSERT INTO estudiante (carne, carrera, saldoactual, idusuario)
                     VALUES ($1, $2, $3, $4)`,
                    [estudiante.carne, estudiante.carrera, estudiante.saldo, idUsuario]
                );
            }

            console.log(`${estudiante.nombre} creado — ${estudiante.correo} / 123456`);
        }

        await client.query('COMMIT');
        console.log('Estudiantes creados exitosamente');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding estudiantes:', err,  'Rolling back transaction.');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
};

seed().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
