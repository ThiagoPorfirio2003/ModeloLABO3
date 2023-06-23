"use strict";
/*
Principal.html debe tener un menú (cómo muestra la imagen) y poseer un <div> en el cuerpo.
Al pulsar el submenú Verificar JWT del menú Credenciales, se mostrará el <div> la información
obtenida del servidor.
Invocar (por AJAX) al verbo GET (de la ruta /verificar_token, de la Api Rest). Si el atributo éxito
del json de retorno es false, se mostrará el mensaje recibido (por consola y alert)
Nota: Si el JWT no es válido, redirigir hacia index.html.
*/
$(() => {
    VerificarJWT();
    AdministrarVerificarJWT();
    AdministrarLogout();
});
function VerificarJWT() {
    let pagina = "http://localhost:9876/verificar_token";
    let jwt = localStorage.getItem("jwt");
    $.ajax({
        type: 'GET',
        url: pagina,
        dataType: "json",
        data: {},
        headers: { 'Authorization': 'Bearer ' + jwt },
        async: true
    })
        .done(function (obj_rta) {
        //console.log(obj_rta);
        if (obj_rta.exito) {
            let app = obj_rta.jwt.api;
            let usuario = obj_rta.jwt.usuario;
            let mensaje = app + ": " + JSON.stringify(usuario);
            //let alerta:string = ArmarAlert(app + "<br>" + JSON.stringify(usuario));
            $("#divResultado").html(mensaje); //.toggle(2000);
            //$("#rol").html(usuario.rol);
        }
        else {
            localStorage.clear();
            $(location).attr('href', "http://localhost/P2_labo/modelo/front/");
            /*
            let alerta:string = ArmarAlert(obj_rta.mensaje, "danger");

            $("#divResultado").html(alerta).toggle(2000);

            setTimeout(() => {
                $(location).attr('href', URL_BASE + "index.html");
            }, 1500);
            */
        }
    })
        .fail(function (jqXHR, textStatus, errorThrown) {
        //localStorage.removeItem()
        $(location).attr('href', "http://localhost/P2_labo/modelo/front/");
    });
}
function AdministrarVerificarJWT() {
    $("#verificarJWT").on("click", () => {
        VerificarJWT();
    });
}
function AdministrarLogout() {
    $("#logout").on("click", () => {
        localStorage.removeItem("jwt");
        $(location).attr('href', "http://localhost/P2_labo/modelo/front/");
        /*
       // let alerta:string = ArmarAlert('Usuario deslogueado!');
    
        $("#divResultado").html(alerta).show(2000);

        setTimeout(() => {
            $(location).attr('href', URL_BASE + "index.html");
        }, 1500);
        */
    });
}
//# sourceMappingURL=principal.js.map