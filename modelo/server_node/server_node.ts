import { count } from "console";

const express = require(`express`);
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');
const mysql = require('mysql');
const myconn = require('express-myconnection');
const cors = require('cors');
const jwt = require("jsonwebtoken");

const app = express();

app.set("puerto",9876);
app.set("key", "cl@ve_secreta");

const storage = multer.diskStorage(
    {
    destination: "public/fotos/",   
    }
);

const upload = multer(
    {
        storage : storage
    }
);

const db_options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'productos_usuarios_node'
};

app.use(express.json());
app.use(myconn(mysql, db_options, 'single'));
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"))
app.use(cors());

//const PATH_ARCHIVOS = "./archivos/productos.txt";

/*
(*) el payload del JWT tendrá la siguiente estructura:
● usuario: con todos los datos del usuario, a excepción de la clave.
● api: nombre de la base de datos.

El token debe expirar en 5 minutos.

verificar_token (GET): Se envía el JWT (en el Bearer) y retorna un JSON (éxito: true/false;
mensaje: string; payload: datos (*)/ null; status: 200/403).
Agregar el middleware anterior.

(*) datos completos del payload
*/

const verificar_usuario = express.Router();
const verificar_jwt = express.Router();

/*
verificar_usuario (MW): Recibe el legajo y el apellido en un JSON y retorna toda la
información del registro al siguiente callable. Si el usuario no existe, retornará un JSON (éxito:
false; mensaje: string; jwt: null; status: 401).
*/
verificar_usuario.use((request:any, response:any, next:any)=>
{
    let obj = request.body;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from usuarios where legajo = ? and apellido = ? ", [obj.legajo, obj.apellido], (err:any, rows:any)=>{

            if(err) throw("Error en consulta de base de datos.");

            if(rows.length == 1){

                response.obj_usuario = rows[0];
                //SE INVOCA AL PRÓXIMO CALLEABLE
                next();
            }
            else{
                response.status(401).json({
                    exito : false,
                    mensaje : "Apellido y/o Legajo incorrectos.",
                    jwt : null
                });
            }
           
        });
    });
}
);

/*
    login (POST): Se envía el legajo y el apellido en un JSON y creará un JWT retornando otro
    JSON (éxito: true/false; mensaje: string; jwt: JWT (*) / null; status: 200/401).

    Agregar el middleware anterior.

    (*) el payload del JWT tendrá la siguiente estructura:
    ● usuario: con todos los datos del usuario, a excepción de la clave.
    ● api: nombre de la base de datos.

    El token debe expirar en 5 minutos.
*/
app.post("/login", verificar_usuario, (request:any, response:any, obj:any)=>
{
    //SE RECUPERA EL USUARIO DEL OBJETO DE LA RESPUESTA
    const user = response.obj_usuario;

    //SE CREA EL PAYLOAD CON LOS ATRIBUTOS QUE NECESITAMOS
    const payload = { 
        usuario: {
            id : user.id,
            apellido : user.apellido,
            nombre : user.nombre,
            rol : user.rol
        },
        api : "productos_usuarios_node",
    };

    //SE FIRMA EL TOKEN CON EL PAYLOAD Y LA CLAVE SECRETA
    const token = jwt.sign(payload, app.get("key"), {
        expiresIn : "5m"
    });

    response.status(200).json({
        exito : true,
        mensaje : "JWT creado!!!",
        jwt : token
    });
});


/*
verificar_jwt (MW): Recibe el JWT (en el Bearer) y retorna toda la información del JWT
decodificada al siguiente callable. Si el JWT no es válido, retornará un JSON (éxito: false;
mensaje: string; status: 403).
*/
verificar_jwt.use((request:any, response:any, next:any)=>
{
    //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
    let token = request.headers["x-access-token"] || request.headers["authorization"];

    /*
    if (! token) {
        response.status(401).send({
            error: "El JWT es requerido!!!"
        });
        return;
    }
    */
    if(token.startsWith("Bearer ")){
        token = token.slice(7, token.length);
    }

    if(token){
        //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
        jwt.verify(token, app.get("key"), (error:any, decoded:any)=>{

            if(error){
                return response.status(403).json({
                    exito: false,
                    mensaje:"El JWT NO es válido!!!"
                });
            }
            else{

             //   console.log("middleware verificar_jwt");

                //SE AGREGA EL TOKEN AL OBJETO DE LA RESPUESTA
                response.jwt = decoded;
                //SE INVOCA AL PRÓXIMO CALLEABLE
                next();
            }
        });
    }
});

/*
(*) el payload del JWT tendrá la siguiente estructura:
● usuario: con todos los datos del usuario, a excepción de la clave.
● api: nombre de la base de datos.

El token debe expirar en 5 minutos.

verificar_token (GET): Se envía el JWT (en el Bearer) y retorna un JSON (éxito: true/false;
mensaje: string; payload: datos (*)/ null; status: 200/403).
Agregar el middleware anterior.

(*) datos completos del payload
*/
    /*
    let user = response.jwt;

    response.status()

    const payload = { 
        usuario: {
            id : user.id,
            apellido : user.apellido,
            nombre : user.nombre,
            rol : user.rol
        },
        api : "productos_usuarios_node",
    };
    */
app.get("/verificar_token", verificar_jwt, (request : any, response : any)=>
{
    response.status(200).json({exito:true, jwt: response.jwt});
});

/*
productos_bd (GET): mostrará el listado completo de los productos (obtenidos de la base de datos)
en un array de Producto (en formato de cadena JSON).
Retorna un JSON (éxito: true/false; mensaje: string; dato: arrayJSON / null; status: 200/424)
Agregar el middleware verificar_jwt
*/

app.get("/productos_bd", verificar_jwt, (request : any, response : any)=>
{
    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from productos", (err:any, rows:any)=>{

            if(err) throw("Error en consulta de base de datos.");

            response.status(200).json({exito:true, mensaje: "Se pudodieron leer los productos", dato: rows});

//            response.send(JSON.stringify(rows));
        });
    });

});

/*
productos_bd (POST): recibirá un JSON → obj (código, marca y precio) y foto para agregar
un registro en la tabla productos, de la base de datos productos_usuarios_node.
Se retornará un JSON que contendrá: éxito(bool) y mensaje(string) indicando lo acontecido.
Agregar el middleware verificar_jwt
Nota: La foto guardarla en ./public/fotos/, con el nombre formado por código punto extensión.
Ejemplo: 912.jpg
*/
app.post("/productos_bd", verificar_jwt, upload.single("foto"),(request : any, response : any)=>
{
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.obj);
    let path : string = file.destination + obj.codigo + "." + extension;

    fs.renameSync(file.path, path);

    obj.path = path.split("public/")[1];

    request.getConnection((err:any, conn:any)=>{

        if(err) 
        {
            response.json({exito:true, mensaje: "Se pudo agregar el producto"});
        }
        else
        {
            conn.query("insert into productos set ?", [obj], (err:any, rows:any)=>{

                if(err) {            response.json({exito:true, mensaje: "Se pudo agregar el producto"});
                }//console.log(err); throw("Error en consulta de base de datos.");}
                else
                {
                    response.json({exito:true, mensaje: "Se pudo agregar el producto"});
                }
            });
        }

    });
});

/*
productos_bd/eliminar (POST): Borrado de productos por código.
Recibe el código del producto a ser borrado en un JSON más el JWT (en el Bearer).
Agregar el middleware verificar_jwt
Nota: La foto debe ser borrada.
Retorna un JSON (éxito: true/false; mensaje: string; status: 200/418)
*/
app.post('/productos_bd/eliminar', verificar_jwt, (request:any, response:any)=>{
   
    let obj = request.body;
    let path_foto : string = "public/";

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        //obtengo el path de la foto del producto a ser eliminado
        conn.query("select path from productos where codigo = ?", [obj.codigo], (err:any, result:any)=>{

            if(err) throw("Error en consulta de base de datos.");
            //console.log(result[0].path);
            if(result.length > 0)
            {
                path_foto += result[0].path;
            }
            //path_foto += result[0].path;
        });
    });

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("delete from productos where codigo = ?", [obj.codigo], (err:any, rows:any)=>{

            if(err) {}//console.log(err); throw("Error en consulta de base de datos.");}

                if(path_foto != "public/")
                {
                    fs.unlink(path_foto, (err:any) => {
                        if (err) throw err;
                        //console.log(path_foto + ' fue borrado.');
                    });
                    response.status(200).json({exito:true, mensaje: "Se pudo eliminar el producto"});
                }
                else
                {
                    response.status(418).json({exito:true, mensaje: "El producto no pudo el producto porque no existe"});
                }

                /*
                Retorna un JSON (éxito: true/false; mensaje: string; status: 200/418);
                response.send("El producto no se pudo eliminar porque no existe");
                */
        });
    });
});

/*
productos_bd/modificar (POST): Modificar productos.
Recibe el JSON del producto a ser modificado → obj (codigo, marca, precio), la foto y el JWT (en el
Bearer).
El código será el del producto a ser modificado, mientras que el resto, serán los valores a ser
modificados.
Agregar el middleware verificar_jwt
Nota: La foto guardarla en ./public/fotos/, con el siguiente formato:
codigo.extension.
Ejemplo: ./public/fotos/91218.jpg
Retorna un JSON (éxito: true/false; mensaje: string; status: 200/418)
*/

app.post('/productos_bd/modificar', verificar_jwt, upload.single("foto"), (request:any, response:any)=>{
    
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.obj);
    let path : string = file.destination + obj.codigo + "." + extension;

    obj.path = path.split("public/")[1];

    let obj_modif : any = {};
    obj_modif.marca = obj.marca;
    obj_modif.precio = obj.precio;
    obj_modif.path = obj.path;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("update productos set ? where codigo = ?", [obj_modif, obj.codigo], (err:any, rows:any)=>{

            //éxito: true/false; mensaje: string; status: 200/418
            if(err) {response.status(418).json({exito:false, mensaje: "El producto no pudo ser modificado"});}
            else
            {
                fs.renameSync(file.path, path);
                response.status(200).json({exito:true, mensaje: "El producto no pudo ser modificado se ha modificado"});
            }

            //response.send("Producto modificado en la bd.");
        });
    });
});

app.listen(app.get('puerto'), ()=>{
    console.log('Servidor corriendo sobre puerto:', app.get('puerto'));
});
