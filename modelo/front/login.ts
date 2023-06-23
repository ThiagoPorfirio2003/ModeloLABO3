$(()=>
{
    $("#btnForm").on("click", iniciarSesion);
});  
        /*
Asociar 'dinámicamente' al evento click del botón btnEnviar, de la página login.html, una función que
recupere el legajo y el apellido para luego invocar (por AJAX) hacia al verbo POST de la ruta /login
(de la Api Rest, “http://localhost:4321/login”).
Si el atributo éxito del json de retorno es false, se mostrará un mensaje que indique lo acontecido (por
consola y alert).
Si es true, se guardará en el LocalStorage el JWT obtenido y se redireccionará hacia principal.php.
*/

function iniciarSesion() : void
{
    let apellido = $("#apellido").val();
    let legajo = $("#legajo").val();

    let dato:any = {};
        dato.legajo = legajo;
        dato.apellido = apellido;
    //let formData = new FormData();

    let pagina = "http://localhost:9876/login";            

    $.ajax({
        type: 'POST',
        url: pagina,
        dataType: "json",
        data: dato,
        async: true
    })
    .done(function (objJSON:any) {
        //MUESTRO EL RESULTADO DE LA PETICION
        //let retorno = JSON.parse(objJSON);

        if(objJSON.exito)
        {
            localStorage.setItem("jwt", objJSON.jwt);
            $(location).attr('href', "http://localhost/P2_labo/modelo/front/principal.html");

            /*
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "principal.html");
            }, 2000);*/
        }
        else
        {
            informar(objJSON.exito);
        }
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {
        let retorno = JSON.parse(jqXHR.responseText);

        informar(retorno.mensaje);
    });  
}