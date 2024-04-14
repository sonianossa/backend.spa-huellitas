const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bodyParser = require("body-parser");


const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // se realiza la accion con bodyParser con el fin de ver los datos del body cuando accedemos al link
app.use(cors());

{
  /*Esto permite que se puedan leer los archivos del dotenv */
}
require("dotenv").config();
{
  /*Se requiere para que asi se pueda conectar a la base de datos de mysql con el servidor por lo que se utiliza createConnection */
}
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "sql11698891",
});

{
  /*Para conectar la base de datos con el servidor directamente con lo ya suministrado en const db sino conecta console.error*/
}

try {
  db.connect();
  console.log("Conectado con éxito a la base de datos");
} catch (error) {
  console.log("Error al conectarse a la base de datos SQL:" + error);
}

/* Se recibira la respuesta del usuario y contraseña asimismo se seleccionara la tabla de clientes y se pasan los valores de nombre y password*/
app.post("/login", (req, res) => {
  const { nombre, contrasena } = req.body;
  db.query(
    "SELECT nombre,password FROM clientes WHERE  nombre =? AND password =?",
    [nombre, contrasena],
    (err, result) => {
      /* si el nombre es correcto el estado sera success sino es asi sera failed */
      if (result.length > 0) {
        res.json({ status: "success" });
      } else {
        res.json({ status: "failed" });
      }
    }
  );
});
/* ruta para realizar el registro y enviarlo a la base de datos esto en el caso de que no existan usuarios registrados*/
app.post("/register", (req, res) => {
  const {
    nombre,
    apellidos,
    dni,
    email,
    telefono,
    nombremascota,
    edadmascota,
    raza,
    contrasena,
  } = req.body;
// no pueden existir dos usuarios con la misma contraseña o mismos datos 
  db.query(
    "SELECT nombre FROM clientes WHERE nombre =? ",
    [nombre],
    (error, resultado) => {
      if (resultado.length == 0) {
        db.query(
          "INSERT INTO clientes (nombre,apellidos,dni,email,telefono,nombremascota,edadmascota,raza,password) VALUES (?,?,?,?,?,?,?,?,?)", //arroja el resultado de insercion de todos los datos introducidos por el usuario creandolos en la base de datos sino se dan correctamente se establece el error de insercion de los datos
          [
            nombre,
            apellidos,
            dni,
            email,
            telefono,
            nombremascota,
            edadmascota,
            raza,
            contrasena,
          ],
          (err, result) => {
            if (err) {
              console.error("Error en la insercion de datos" + err);
            }
            res.json({ status: "success" });
          }
        ); 
      } 
    }
  );
});
/* se realizara un query para poder tomar la id y el nombre del servicio en la base de datos */
app.get("/servicios", (req, res) => {
  db.query("SELECT id_servicios,nombre FROM servicios", (err, result) => {
    if (err) {
      console.error("Error en la consulta de datos" + err);
    }
    res.json(result);
  });
});

app.get("/serviciosById", (req, res) => {
  console.log(req.query.id);
  db.query(
    "SELECT * FROM servicios WHERE id_servicios =? ",
    [req.query.id],
    (err, result) => {
      if (err) {
        console.log("Error en la consulta de datos" + err);
      }
      res.json(
        result[0]
      ); /* devolvemos el resultado con res.json para que el cliente pueda visualizar la información almacenada en la base datos */
    }
  );
});
/* Se crea la ruta de reserva para traer los datos al servidor del usuario y servicio y asimismo enviarlos a la base de datos ya seleccionado */
app.post("/reserva", (req, res) => {
  const { usuario, servicio } = req.body;
  console.log(usuario);
  console.log(servicio);
  db.query(
    "SELECT * FROM clientes WHERE nombre =? ",
    [usuario],
    (err, result) => {
      if (err) {
        console.log("Error en la consulta de datos:" + err);
      }
      {
        /* se inserta todo la peticion dentro de un if para que el usuario no pueda reservar mas de una vez el mismo servicio y el if result===0 nos sirve va saber que 
  no se a encontrado ninguna reserva pues va al inicio con reserva exitosa sino no deja realizar reserva y no redirecciona a ninguna ruta */
      }
      let idCliente = result[0].id_cliente;
      db.query(
        "SELECT * FROM reserva WHERE id_cliente =? AND id_servicios =? ",
        [idCliente, servicio],
        (err, result) => {
          if (err) {
            console.log("Error en la consulta" + err);
          }
          if (result.length == 0) {
            db.query(
              "INSERT INTO reserva (id_cliente,id_servicios) VALUES (?,?)",
              [idCliente, servicio],
              (err, result) => {
                if (err) {
                  console.log("Error en la insercion de datos:" + err);
                }
                  res.json({ status: "successful" });
              }
            );
          } 
        }
      );
    }
  );
});
//peticion del objeto que se manda por el link de localhost3000  cuando se esta en reservas saltara todos los datos con los que estamos logueados en el sistema
// en el select de reserva se realiza un array ya que es el resultado de la base de datos esta metido en un array en la primera posicion por lo que se coloca el 0
app.get("/reservas", (req, res) => {
  db.query(
    "SELECT * FROM clientes WHERE nombre =?",
    [req.query.usuario],
    (err, result) => {
      if (err) {
        console.log("Error en la consulta de datos del usuario:" + err);
      }
      db.query(
        "SELECT * FROM reserva WHERE id_cliente =?",
        [result[0].id_cliente],
        (err, result) => {
          if (err) {
            console.log("Error en la consulta de datos:" + err);
          }
          console.log(result);
          let filtroPackServicios = []; //se realiza un bucle for en donde se de la vuelta de todas las reservas realizadas por el cliente para que traiga tantas veces como reservas de pack de servicios realice el cliente
          for (let i = 0; i < result.length; i++) {
            db.query(
              "SELECT * FROM servicios WHERE id_servicios =? ",
              [result[i].id_servicios],
              (err, resultado) => {
                if (err) {
                  console.log(
                    "Error en la consulta de datos de servicios:" + err
                  );
                }
                filtroPackServicios.push(resultado[0]);
                if (i == result.length - 1) {
                  res.json({ servicios: filtroPackServicios }); //se realiza el res json de servicios para filtrar todos los pack de servicios que a reservado el cliente y asi asociar cliente y servicios con todos los datos del mismo
                }
              }
            );
          }
        }
      );
    }
  );
});
// elegimos la id del cliente con el select elegimos tambien la id del servicio que el cliente desea eliminar cuando ya tomamos estos datos con delete elije la primera id y eliminadonde cliente y servicios sea el respectivo donde se da la opcion de clicar y eliminar la reserva
app.delete("/reservas", (req, res) => {
  let idEliminar = req.query.id;
  let nombre = req.query.nombre_us;

  db.query(
    "SELECT id_cliente FROM clientes WHERE nombre=?",
    [nombre],
    (err, result) => {
      if (err) {
        console.log("Error en la consulta:" + err);
      }
      let idUsuario = result[0].id_cliente;
      db.query(
        "DELETE FROM reserva WHERE id_cliente =? AND id_servicios=?",
        [idUsuario, idEliminar],
        (err, result) => {
          if (err) {
            console.log("Error en el borrado del pack:" + err);
          }
          res.json({ status: "success" });
        }
      );
    }
  );
});

app.get("/editarReservasById", (req, res) => {
  console.log(req.query.id);
  db.query(
    "SELECT * FROM servicios WHERE id_servicios =? ",
    [req.query.id],
    (err, result) => {
      if (err) {
        console.log("Error en la consulta de datos" + err);
      }
      res.json(
        result[0]
      ); /* devolvemos el resultado con res.json para que el cliente pueda visualizar la información almacenada en la base datos */
    }
  );
});
/* tomo la variable con id_servicios,fecha y hora que es lo que requiero para actualizar por parte del cliente en los servicios despues lo paso para que se 
actualice en la base de datos con update de fecha y hora localizando la id del servicio que se quiere actualizar especificamente ya que sino se realiza se actualiza 
toda la tabla de fecha y hora sin identificacion alguna quedando todos los servicios con la misma fecha y hora.*/
app.put("/editarReservas", (req, res) => {
  let { id_servicios, fecha, hora } = req.body;
  db.query(
    "UPDATE servicios SET fecha =?, hora =? WHERE id_servicios=?",
    [fecha, hora, id_servicios],
    (err, result) => {
      if (err) {
        console.log("Error en la actualización de datos:" + err);
      }
      res.json({ status: "success" });
    }
  );
});

app.listen(process.env.PORT, () => {
  console.log("Conectado al servidor correctamente");
});
